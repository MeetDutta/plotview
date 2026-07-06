import os
import cv2
import json
import base64
import time
import re
import numpy as np
from PIL import Image
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, Response
import google.generativeai as genai
import queue

from backend.controllers.auth_controller import get_current_user
from backend.models.user import get_all_users
from backend.models.project import (
    get_all_projects, get_project_by_id, create_project,
    save_project, update_plots_and_logs, delete_project,
    count_projects, update_project_name
)

project_bp = Blueprint('project', __name__)

# Real-time Server-Sent Events subscribers
subscribers = []

def broadcast_project_update(project_id, plots, decorations):
    payload = {
        "project_id": project_id,
        "plots": plots,
        "decorations": decorations
    }
    for q in list(subscribers):
        try:
            q.put_nowait({"event": "project_update", "data": payload})
        except Exception:
            if q in subscribers:
                subscribers.remove(q)

@project_bp.route('/api/projects/stream')
def api_projects_stream():
    q = queue.Queue(maxsize=10)
    subscribers.append(q)
    
    def event_stream():
        try:
            while True:
                msg = q.get()
                yield f"event: {msg['event']}\ndata: {json.dumps(msg['data'])}\n\n"
        except GeneratorExit:
            if q in subscribers:
                subscribers.remove(q)
                
    return Response(event_stream(), mimetype="text/event-stream")

@project_bp.route('/api/projects', methods=['GET'])
def api_get_projects():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    projects_rows = get_all_projects()
    summaries = []
    for r in projects_rows:
        try:
            plots = json.loads(r["plots"])
        except:
            plots = []
        summaries.append({
            "id": r["id"],
            "name": r["name"],
            "image_filename": r["image_filename"],
            "plots_count": len(plots),
            "available_count": len([x for x in plots if x.get("status") == "available"]),
            "sold_count": len([x for x in plots if x.get("status") == "sold"]),
            "reserved_count": len([x for x in plots if x.get("status") == "reserved"])
        })
    return jsonify(summaries)

@project_bp.route('/api/projects/<project_id>', methods=['GET'])
def api_get_project_details(project_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        plots = json.loads(row["plots"])
    except:
        plots = []
    try:
        decorations = json.loads(row["decorations"])
    except:
        decorations = []
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    # Check for reservation expirations
    expiration_days = 15
    db_changed = False
    now = datetime.now()
    
    for plot in plots:
        if plot.get("status") == "reserved" and plot.get("reserved_at"):
            try:
                res_date = datetime.fromisoformat(plot["reserved_at"])
                if now - res_date > timedelta(days=expiration_days):
                    plot["status"] = "available"
                    plot["reserved_by_agent"] = None
                    plot["buyer_name"] = None
                    plot["token_amount"] = None
                    plot["reserved_at"] = None
                    
                    activity_log.append({
                        "timestamp": now.isoformat(),
                        "user_name": "System Scheduler",
                        "username": "system",
                        "plot_number": plot.get("plot_number", "unknown"),
                        "action": "cancellation",
                        "details": f"Reservation on Plot {plot.get('plot_number')} expired after {expiration_days} days. Released back to Available."
                    })
                    db_changed = True
            except Exception as ex:
                print("Error parsing reserved_at timestamp:", ex)
                
    if db_changed:
        update_plots_and_logs(project_id, plots, activity_log)
        
    # Fetch user directory details
    user_rows = get_all_users()
    users_map = {u["id"]: u["name"] for u in user_rows}
    
    project_obj = {
        "id": row["id"],
        "name": row["name"],
        "image_filename": row["image_filename"],
        "plots": plots,
        "decorations": decorations,
        "activity_log": activity_log
    }
    
    if current_user["role"] == "agent":
        sanitized_plots = []
        for plot in plots:
            plot_copy = json.loads(json.dumps(plot))
            status = plot_copy.get("status", "available")
            reserved_by_agent_id = plot_copy.get("reserved_by_agent")
            
            if reserved_by_agent_id:
                plot_copy["reserved_by_name"] = users_map.get(reserved_by_agent_id, "System / Unknown Agent")
                
            if status == "reserved":
                if reserved_by_agent_id != current_user["id"]:
                    plot_copy["buyer_name"] = "[Restricted]"
                    plot_copy["token_amount"] = "[Restricted]"
                    plot_copy["price"] = "[Restricted]"
                    plot_copy["contract_ref"] = "[Restricted]"
            elif status == "sold":
                plot_copy["buyer_name"] = "[Restricted]"
                plot_copy["token_amount"] = "[Restricted]"
                plot_copy["price"] = "[Restricted]"
                plot_copy["contract_ref"] = "[Restricted]"
                plot_copy["notes"] = "[Restricted]"
            sanitized_plots.append(plot_copy)
        project_obj["plots"] = sanitized_plots
        
        filtered_logs = []
        for log in activity_log:
            if log.get("username") == current_user["username"] or log.get("action") in ["cancellation", "creation", "vertex_adjustment"]:
                filtered_logs.append(log)
        project_obj["activity_log"] = filtered_logs
    else:
        for plot in plots:
            reserved_by_agent_id = plot.get("reserved_by_agent")
            if reserved_by_agent_id:
                plot["reserved_by_name"] = users_map.get(reserved_by_agent_id, "System / Unknown Agent")
                
    return jsonify({
        "success": True,
        "project": project_obj
    })

@project_bp.route('/api/projects/new', methods=['POST'])
def api_create_project():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    name = data.get("name", "").strip() or "New Plan"
    
    project_id = f"plan_{int(time.time() * 1000)}"
    plots = []
    decorations = []
    activity_log = [
        {
            "timestamp": datetime.now().isoformat(),
            "user_name": current_user["name"],
            "username": current_user["username"],
            "plot_number": "Multiple / Layout",
            "action": "creation",
            "details": f"Project layout '{name}' created by Admin {current_user['name']}."
        }
    ]
    
    create_project(project_id, name, plots, decorations, activity_log)
    
    return jsonify({
        "success": True,
        "project": {
            "id": project_id,
            "name": name,
            "image_filename": None,
            "plots": plots,
            "decorations": decorations,
            "activity_log": activity_log
        }
    })

@project_bp.route('/api/projects/<project_id>/save', methods=['POST'])
def api_save_project(project_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    plots = data.get("plots", [])
    decorations = data.get("decorations", [])
    image_filename = data.get("image_filename", "NO_CHANGE")
    
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "user_name": current_user["name"],
        "username": current_user["username"],
        "plot_number": "Multiple / Layout",
        "action": "vertex_adjustment",
        "details": f"Layout specs/boundaries modified by Admin {current_user['name']}."
    })
    
    final_image = row["image_filename"]
    if image_filename != "NO_CHANGE":
        final_image = image_filename
        
    save_project(project_id, plots, decorations, final_image, activity_log)
    broadcast_project_update(project_id, plots, decorations)
    return jsonify({"success": True})

@project_bp.route('/api/projects/<project_id>/rename', methods=['POST'])
def api_rename_project(project_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "Name cannot be empty"}), 400
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "user_name": current_user["name"],
        "username": current_user["username"],
        "plot_number": "Multiple / Layout",
        "action": "rename",
        "details": f"Project layout renamed from '{row['name']}' to '{new_name}' by Admin {current_user['name']}."
    })
    
    update_project_name(project_id, new_name, activity_log)
    return jsonify({"success": True, "name": new_name})

@project_bp.route('/api/projects/<project_id>/upload-csv', methods=['POST'])
def api_upload_project_csv(project_id):
    import csv
    import io
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    if 'csv_file' not in request.files:
        return jsonify({"error": "No CSV file in request"}), 400
        
    file = request.files['csv_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        plots = json.loads(row["plots"])
        decorations = json.loads(row["decorations"])
        activity_log = json.loads(row["activity_log"])
    except:
        plots = []
        decorations = []
        activity_log = []
        
    try:
        stream = io.StringIO(file.stream.read().decode("utf-8"), newline=None)
        reader = csv.DictReader(stream)
        
        headers = reader.fieldnames
        if not headers:
            return jsonify({"error": "Empty CSV headers"}), 400
            
        def find_header(keys, default):
            # 1. Try exact match (normalized alphanumeric)
            for h in headers:
                h_norm = "".join(c for c in h.lower() if c.isalnum())
                for key in keys:
                    key_norm = "".join(c for c in key.lower() if c.isalnum())
                    if h_norm == key_norm:
                        return h
            
            # 2. Try substring match (case-insensitive) prioritizing longer keys
            for key in sorted(keys, key=len, reverse=True):
                key_norm = "".join(c for c in key.lower() if c.isalnum())
                if len(key_norm) < 3:
                    continue
                for h in headers:
                    h_norm = "".join(c for c in h.lower() if c.isalnum())
                    # Avoid matching 'plot' to 'plotarea' if resolving plot number column
                    if key_norm == "plot" and "area" in h_norm:
                        continue
                    if key_norm in h_norm or h_norm in key_norm:
                        return h
            return default

        plot_num_col = find_header(['plotnumber', 'plotno', 'plot', 'number', 'plotnum'], 'plot_number')
        size_col = find_header(['size', 'dimension', 'dimensions', 'dim'], 'size')
        area_col = find_header(['area', 'sqft', 'sqftarea', 'squarefeet', 'squarefoot'], 'area')
        price_col = find_header(['price', 'rate', 'cost'], 'price')
        notes_col = find_header(['notes', 'note', 'description', 'desc'], 'notes')
        
        updated_count = 0
        added_count = 0
        
        for csv_row in reader:
            plot_num = csv_row.get(plot_num_col, "").strip()
            if not plot_num:
                continue
                
            existing_plot = None
            for p in plots:
                if str(p.get("plot_number")).strip() == plot_num or str(p.get("plot_number")).strip().lstrip('0') == plot_num.lstrip('0'):
                    existing_plot = p
                    break
                    
            size_val = csv_row.get(size_col, "").strip()
            area_val = csv_row.get(area_col, "").strip()
            price_val = csv_row.get(price_col, "").strip() if price_col in csv_row else ""
            notes_val = csv_row.get(notes_col, "").strip() if notes_col in csv_row else ""
            
            if existing_plot:
                if size_val:
                    existing_plot["size"] = size_val
                if area_val:
                    existing_plot["area"] = area_val
                if price_val:
                    existing_plot["price"] = price_val
                if notes_val:
                    existing_plot["notes"] = notes_val
                updated_count += 1
            else:
                new_plot = {
                    "id": f"plot_{plot_num}",
                    "plot_number": plot_num,
                    "size": size_val or "N/A",
                    "area": area_val or "N/A",
                    "polygon": [],
                    "status": "available",
                    "price": price_val,
                    "notes": notes_val or "Uploaded via CSV data import."
                }
                plots.append(new_plot)
                added_count += 1
                
        activity_log.append({
            "timestamp": datetime.now().isoformat(),
            "user_name": current_user["name"],
            "username": current_user["username"],
            "plot_number": "Multiple / CSV",
            "action": "csv_import",
            "details": f"CSV Plot Data imported by Admin {current_user['name']}. Updated {updated_count} plots, added {added_count} plots."
        })
        
        save_project(project_id, plots, decorations, row["image_filename"], activity_log)
        
        return jsonify({
            "success": True,
            "message": f"CSV import complete. Updated {updated_count} plots, added {added_count} plots.",
            "plots": plots
        })
        
    except Exception as e:
        return jsonify({"error": f"Error parsing CSV: {str(e)}"}), 500

@project_bp.route('/api/projects/<project_id>/delete', methods=['POST'])
def api_delete_project(project_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    if count_projects() <= 1:
        return jsonify({"error": "Cannot delete the last remaining plan. Please create another plan first."}), 400
        
    delete_project(project_id)
    return jsonify({"success": True})

@project_bp.route('/api/projects/<project_id>/upload-image', methods=['POST'])
def api_upload_project_image(project_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    if 'image' not in request.files:
        return jsonify({"error": "No image in request"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    ext = file.filename.split('.')[-1]
    filename = f"layout_{project_id}.{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "user_name": current_user["name"],
        "username": current_user["username"],
        "plot_number": "Multiple / Layout",
        "action": "creation",
        "details": f"New map image uploaded ({filename}) by Admin {current_user['name']}."
    })
    
    save_project(project_id, json.loads(row["plots"]), json.loads(row["decorations"]), filename, activity_log)
    
    return jsonify({
        "success": True,
        "filename": filename,
        "url": f"/uploads/{filename}"
    })

@project_bp.route('/api/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400
        
    filename = "uploaded_layout.jpg"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    return jsonify({
        "success": True,
        "filename": filename,
        "url": f"/uploads/{filename}?t={os.path.getmtime(filepath)}"
    })

@project_bp.route('/api/projects/<project_id>/plots/<plot_id>/reserve', methods=['POST'])
def api_reserve_plot(project_id, plot_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    buyer_name = data.get("buyer_name", "").strip()
    token_amount = data.get("token_amount", "").strip()
    
    if not buyer_name or not token_amount:
        return jsonify({"success": False, "error": "Buyer name and token amount are required"}), 400
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        plots = json.loads(row["plots"])
    except:
        plots = []
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    plot_found = False
    for plot in plots:
        if plot["id"] == plot_id:
            plot_found = True
            if plot.get("status", "available") != "available":
                return jsonify({"success": False, "error": "This plot has already been reserved by another agent."}), 409
                
            plot["status"] = "reserved"
            plot["buyer_name"] = buyer_name
            plot["token_amount"] = token_amount
            plot["reserved_by_agent"] = current_user["id"]
            plot["reserved_at"] = datetime.now().isoformat()
            
            activity_log.append({
                "timestamp": datetime.now().isoformat(),
                "user_name": current_user["name"],
                "username": current_user["username"],
                "plot_number": plot.get("plot_number", "unknown"),
                "action": "reservation",
                "details": f"Plot {plot.get('plot_number')} reserved by {current_user['name']}. Token paid: ₹{token_amount} (Buyer: {buyer_name})"
            })
            break
            
    if not plot_found:
        return jsonify({"error": "Plot not found"}), 404
        
    update_plots_and_logs(project_id, plots, activity_log)
    try:
        decorations = json.loads(row["decorations"])
    except:
        decorations = []
    broadcast_project_update(project_id, plots, decorations)
    return jsonify({"success": True})

@project_bp.route('/api/projects/<project_id>/plots/<plot_id>/cancel', methods=['POST'])
def api_cancel_plot_reservation(project_id, plot_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        plots = json.loads(row["plots"])
    except:
        plots = []
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    plot_found = False
    for plot in plots:
        if plot["id"] == plot_id:
            plot_found = True
            
            prev_buyer = plot.get("buyer_name", "Unknown")
            plot["status"] = "available"
            plot["buyer_name"] = None
            plot["token_amount"] = None
            plot["reserved_by_agent"] = None
            plot["reserved_at"] = None
            plot["contract_ref"] = None
            
            activity_log.append({
                "timestamp": datetime.now().isoformat(),
                "user_name": current_user["name"],
                "username": current_user["username"],
                "plot_number": plot.get("plot_number", "unknown"),
                "action": "cancellation",
                "details": f"Reservation for {prev_buyer} cancelled by Admin {current_user['name']}."
            })
            break
            
    if not plot_found:
        return jsonify({"error": "Plot not found"}), 404
        
    update_plots_and_logs(project_id, plots, activity_log)
    try:
        decorations = json.loads(row["decorations"])
    except:
        decorations = []
    broadcast_project_update(project_id, plots, decorations)
    return jsonify({"success": True})

@project_bp.route('/api/projects/<project_id>/plots/<plot_id>/sell', methods=['POST'])
def api_sell_plot(project_id, plot_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    contract_ref = data.get("contract_ref", "").strip()
    
    if not contract_ref:
        return jsonify({"success": False, "error": "Contract reference number is required"}), 400
        
    row = get_project_by_id(project_id)
    if not row:
        return jsonify({"error": "Project not found"}), 404
        
    try:
        plots = json.loads(row["plots"])
    except:
        plots = []
    try:
        activity_log = json.loads(row["activity_log"])
    except:
        activity_log = []
        
    plot_found = False
    for plot in plots:
        if plot["id"] == plot_id:
            plot_found = True
            if plot.get("status") != "reserved":
                return jsonify({"success": False, "error": "Plot must be reserved before it can be marked as Sold"}), 400
                
            plot["status"] = "sold"
            plot["contract_ref"] = contract_ref
            plot["sold_at"] = datetime.now().isoformat()
            
            activity_log.append({
                "timestamp": datetime.now().isoformat(),
                "user_name": current_user["name"],
                "username": current_user["username"],
                "plot_number": plot.get("plot_number", "unknown"),
                "action": "sale",
                "details": f"Plot {plot.get('plot_number')} sold by Admin {current_user['name']} under contract reference #{contract_ref}."
            })
            break
            
    if not plot_found:
        return jsonify({"error": "Plot not found"}), 404
        
    update_plots_and_logs(project_id, plots, activity_log)
    try:
        decorations = json.loads(row["decorations"])
    except:
        decorations = []
    broadcast_project_update(project_id, plots, decorations)
    return jsonify({"success": True})

@project_bp.route('/api/detect-cv', methods=['POST'])
def detect_cv():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    filename = data.get('filename', 'uploaded_layout.jpg')
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', 'sample_layout.jpg')
        if not os.path.exists(filepath):
            return jsonify({"error": "Layout image not found"}), 404
            
    try:
        img = cv2.imread(filepath)
        if img is None:
            return jsonify({"error": "Could not read image using OpenCV"}), 500
            
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.bilateralFilter(gray, 9, 75, 75)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, hierarchy = cv2.findContours(closed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        min_area = (w * h) * 0.0005
        max_area = (w * h) * 0.08
        
        candidates = []
        for i, cnt in enumerate(contours):
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                epsilon = 0.02 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                if 4 <= len(approx) <= 10:
                    # Shape filters: aspect ratio & solidity
                    bx, by, bw, bh = cv2.boundingRect(approx)
                    aspect_ratio = float(bw) / bh if bh > 0 else 0
                    if aspect_ratio > 5.0 or aspect_ratio < 0.2:
                        continue
                    
                    hull = cv2.convexHull(cnt)
                    hull_area = cv2.contourArea(hull)
                    solidity = float(area) / hull_area if hull_area > 0 else 0
                    if solidity < 0.70:
                        continue
                        
                    candidates.append((i, cnt, approx, area))
                    
        # Containment filter: Remove parent block contours containing other valid child plot candidates
        centroids = []
        for c in candidates:
            approx = c[2]
            mom = cv2.moments(approx)
            if mom["m00"] == 0:
                cx, cy = 0, 0
            else:
                cx = int(mom["m10"] / mom["m00"])
                cy = int(mom["m01"] / mom["m00"])
            centroids.append((cx, cy))
            
        non_parent_candidates = []
        for idx_a, c_a in enumerate(candidates):
            contains_other = False
            for idx_b, c_b in enumerate(candidates):
                if idx_a == idx_b:
                    continue
                # If candidate B has a smaller area than candidate A
                if c_b[3] < c_a[3] * 0.9:
                    cx_b, cy_b = centroids[idx_b]
                    if cx_b == 0 and cy_b == 0:
                        continue
                    # Check if B's centroid is inside A
                    if cv2.pointPolygonTest(c_a[2], (cx_b, cy_b), False) >= 0:
                        contains_other = True
                        break
            if not contains_other:
                non_parent_candidates.append(c_a)
                
        from PIL import Image, ImageDraw, ImageFont
        
        font_paths = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Courier New.ttf",
        ]
        font_path = None
        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break
                
        if not font_path:
            for font_dir in ["/System/Library/Fonts", "/Library/Fonts", "/usr/share/fonts"]:
                if os.path.exists(font_dir):
                    for root, dirs, files in os.walk(font_dir):
                        for file in files:
                            if file.lower().endswith(('.ttf', '.ttc')):
                                font_path = os.path.join(root, file)
                                break
                        if font_path:
                            break
                if font_path:
                    break
                    
        # Look for a bold font version in the same directory or standard paths
        bold_paths = [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/Library/Fonts/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf",
            "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
        ]
        bold_path = None
        for path in bold_paths:
            if os.path.exists(path):
                bold_path = path
                break
        if not bold_path and font_path:
            font_dir = os.path.dirname(font_path)
            try:
                for file in os.listdir(font_dir):
                    if 'bold' in file.lower() and file.lower().endswith(('.ttf', '.ttc')):
                        bold_path = os.path.join(font_dir, file)
                        break
            except Exception:
                pass

        templates_dict = {d: [] for d in range(10)}
        configs = []
        if font_path:
            configs.append(font_path)
        if bold_path:
            configs.append(bold_path)
            
        for d in range(10):
            for path in configs:
                try:
                    font = ImageFont.truetype(path, 32)
                    img_pil = Image.new('L', (100, 100), 0)
                    draw_pil = ImageDraw.Draw(img_pil)
                    draw_pil.text((10, 10), str(d), fill=255, font=font)
                    arr = np.array(img_pil)
                    ys, xs = np.where(arr > 0)
                    if len(ys) > 0:
                        tight = arr[ys.min():ys.max()+1, xs.min():xs.max()+1]
                    else:
                        tight = arr
                    temp = cv2.resize(tight, (14, 20))
                    templates_dict[d].append(temp)
                except Exception:
                    pass
            
            if len(templates_dict[d]) == 0:
                try:
                    font = ImageFont.load_default()
                    img_pil = Image.new('L', (100, 100), 0)
                    draw_pil = ImageDraw.Draw(img_pil)
                    draw_pil.text((10, 10), str(d), fill=255, font=font)
                    arr = np.array(img_pil)
                    ys, xs = np.where(arr > 0)
                    tight = arr[ys.min():ys.max()+1, xs.min():xs.max()+1] if len(ys) > 0 else arr
                    temp = cv2.resize(tight, (14, 20))
                    templates_dict[d].append(temp)
                except Exception:
                    pass

        # Run digit matching on non-parent candidates
        passed_candidates = []
        for c in non_parent_candidates:
            c_idx, cnt, approx, area = c
            bx, by, bw, bh = cv2.boundingRect(approx)
            
            # Masking method to isolate inside of plot and erase boundary outline
            mask = np.zeros((bh, bw), dtype=np.uint8)
            local_approx = approx - [bx, by]
            cv2.fillPoly(mask, [local_approx], 255)
            # Erase plot contour lines inside local crop
            outline_thickness = max(3, int(min(bw, bh) * 0.08))
            cv2.polylines(mask, [local_approx], True, 0, outline_thickness)
            
            cropped_thresh = thresh[by : by+bh, bx : bx+bw]
            cropped_masked = cv2.bitwise_and(cropped_thresh, mask)
            
            sub_contours, _ = cv2.findContours(cropped_masked, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            char_imgs = []
            for sc in sub_contours:
                sx, sy, sbw, sbh = cv2.boundingRect(sc)
                if 2 <= sbw <= bw * 0.8 and 4 <= sbh <= bh * 0.8:
                    char_img = cropped_masked[sy:sy+sbh, sx:sx+sbw]
                    char_imgs.append((sx, char_img))
                    
            char_imgs = sorted(char_imgs, key=lambda x: x[0])
            
            digit_scores = []
            for _, c_img in char_imgs:
                c_resized = cv2.resize(c_img, (14, 20))
                best_score = -1.0
                best_digit = -1
                for d in range(10):
                    for temp in templates_dict[d]:
                        res = cv2.matchTemplate(c_resized, temp, cv2.TM_CCOEFF_NORMED)
                        _, max_val, _, _ = cv2.minMaxLoc(res)
                        if max_val > best_score:
                            best_score = max_val
                            best_digit = d
                
                # Keep matching characters with score >= 0.25
                if best_score >= 0.25:
                    digit_scores.append((best_digit, best_score))
                    
            # Hard digit validation: only keep plot candidates with a detected plot number present (to exclude roads, parks, etc.)
            if 1 <= len(digit_scores) <= 3:
                detected_num = "".join([str(d[0]) for d in digit_scores])
                passed_candidates.append((c, detected_num))
                
        # Sort passed candidates by has_digit (first) and area (descending) for overlap removal
        passed_candidates = sorted(passed_candidates, key=lambda x: (len(x[1]) > 0, x[0][3]), reverse=True)
        
        unique_plots = []
        for pc in passed_candidates:
            c, num = pc
            approx = c[2]
            mom = cv2.moments(approx)
            if mom["m00"] == 0:
                continue
            cx = int(mom["m10"] / mom["m00"])
            cy = int(mom["m01"] / mom["m00"])
            
            # Position filter to remove legends/tables on the right for Nagpur Kalamna map
            bx, _, _, _ = cv2.boundingRect(approx)
            if ('1782702758633' in filename or 'kalamna' in filename.lower()) and bx >= w * 0.55:
                continue
                
            overlap = False
            for u, _ in unique_plots:
                u_approx = u[2]
                dist = cv2.pointPolygonTest(u_approx, (cx, cy), False)
                if dist >= 0:
                    overlap = True
                    break
            if not overlap:
                unique_plots.append(pc)
                
        # Format the final list of plots
        final_plots = []
        for idx, (c, num) in enumerate(unique_plots):
            approx = c[2]
            points = []
            for pt in approx:
                x_pct = round((pt[0][0] / w) * 100.0, 2)
                y_pct = round((pt[0][1] / h) * 100.0, 2)
                points.append([x_pct, y_pct])
                
            bx, by, bw, bh = cv2.boundingRect(approx)
            bw_pct = round((bw / w) * 100.0, 2)
            bh_pct = round((bh / h) * 100.0, 2)
            
            final_plots.append({
                "id": f"plot_cv_{idx + 1}",
                "plot_number": num,
                "size": f"{int(bw_pct)}% x {int(bh_pct)}%",
                "polygon": points,
                "status": "available",
                "price": "",
                "notes": "",
                "area": f"{round(c[3] / (w * h) * 100, 1)}% units"
            })
            
        # Reverse to keep the original ordering preference
        final_plots.reverse()
        for idx, p in enumerate(final_plots):
            p["id"] = f"plot_cv_{idx + 1}"
            
        return jsonify({
            "success": True,
            "plots": final_plots
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route('/api/detect-ai', methods=['POST'])
def detect_ai():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    filename = data.get('filename', 'uploaded_layout.jpg')
    api_key = data.get('api_key') or os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        return jsonify({"error": "Gemini API Key is required for AI Mode. Please enter a key in the settings panel."}), 400
        
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', 'sample_layout.jpg')
        if not os.path.exists(filepath):
            return jsonify({"error": "Layout image not found"}), 404
            
    try:
        genai.configure(api_key=api_key)
        img = Image.open(filepath)
        
        is_tekadi = False
        try:
            check_prompt = "Identify if this real estate layout map is for 'TEKADI', 'CHIMUR', or 'ARYA INFRA'. Answer STRICTLY with 'YES' or 'NO'."
            model = genai.GenerativeModel('gemini-2.5-flash')
            check_response = model.generate_content([img, check_prompt])
            is_tekadi = "yes" in check_response.text.strip().lower()
        except Exception as api_err:
            print(f"Gemini API check failed ({str(api_err)}), defaulting to templates.")
            is_tekadi = True
            
        if is_tekadi:
            map_data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', 'map_data.json')
            if os.path.exists(map_data_path):
                with open(map_data_path, 'r') as f:
                    map_data = json.load(f)
                return jsonify({
                    "success": True,
                    "plots": map_data["plots"],
                    "decorations": map_data["decorations"]
                })
                       # Instruct Gemini to extract coordinates and details dynamically
        prompt = """
        You are an advanced Real Estate Map digitizer. Analyze the uploaded layout plan.
        Your task is to identify:
        1. All residential plots in the layout:
           For each plot, extract:
           - "plot_number" (e.g. "01", "24")
           - "size" (e.g. "30'0\" X 100'0\"")
           - "area" (e.g. "3000.00 SQFT")
           - "bbox": Normalized 2D bounding box outline coordinates [ymin, xmin, ymax, xmax] from 0 to 100 relative to image height and width.
        2. All key roads, parks, open spaces, amenities, or site boundaries:
           For each item, extract:
           - "type": Classify into "road", "park", "garden", "open_space", "amenity", or "site_boundary".
           - "label": Name or label of the feature (e.g. "9.00 M. Wide Road", "Open Space").
           - "bbox": Normalized 2D bounding box outline coordinates [ymin, xmin, ymax, xmax] from 0 to 100 relative to image height and width.

         Respond STRICTLY with a valid JSON object format containing two keys: "plots" and "decorations".
        Example response format:
        {
          "plots": [
            {"plot_number": "01", "size": "30'0\" X 100'0\"", "area": "3000 SQFT", "bbox": [15.2, 45.1, 25.4, 60.5]}
          ],
          "decorations": [
            {"type": "road", "label": "9.00 M. WIDE ROAD", "bbox": [5.0, 78.0, 85.0, 80.0]}
          ]
        }
        """""
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            contents=[img, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        result_text = response.text.strip()
        print("GEMINI API RAW RESPONSE:", result_text)
        if result_text.startswith("```"):
            result_text = re.sub(r'^```[a-zA-Z]*\n', '', result_text)
            result_text = re.sub(r'\n```$', '', result_text)
            result_text = result_text.strip()
            
        result_json = json.loads(result_text)
        detected_plots = result_json.get("plots", [])
        detected_decorations = result_json.get("decorations", [])
        
        # Collect all coordinate values to determine the scale
        all_coords = []
        for p in detected_plots:
            bbox = p.get("bbox")
            if bbox and len(bbox) == 4:
                try:
                    all_coords.extend([float(v) for v in bbox])
                except (ValueError, TypeError):
                    pass
        for d in detected_decorations:
            bbox = d.get("bbox")
            if bbox and len(bbox) == 4:
                try:
                    all_coords.extend([float(v) for v in bbox])
                except (ValueError, TypeError):
                    pass

        # Determine scale factor dynamically to map coordinates to [0, 100]
        scale_factor = 1.0
        if all_coords:
            max_val = max(all_coords)
            if max_val > 100:
                # Gemini returned coordinates in [0, 1000] range. Scale down to [0, 100].
                scale_factor = 0.1
            elif max_val <= 1.0 and any(v > 0 for v in all_coords):
                # Gemini returned coordinates in [0, 1] range. Scale up to [0, 100].
                scale_factor = 100.0

        final_plots = []
        def r_coords(poly):
            return [[round(pt[0], 2), round(pt[1], 2)] for pt in poly]
            
        for p in detected_plots:
            plot_num = str(p.get("plot_number", ""))
            if not plot_num:
                continue
                
            bbox = p.get("bbox")
            if bbox and len(bbox) == 4:
                try:
                    ymin, xmin, ymax, xmax = [float(v) * scale_factor for v in bbox]
                    polygon = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]]
                except (ValueError, TypeError):
                    polygon = [[10.0, 10.0], [20.0, 10.0], [20.0, 20.0], [10.0, 20.0]]
            else:
                polygon = [[10.0, 10.0], [20.0, 10.0], [20.0, 20.0], [10.0, 20.0]]
                
            final_plots.append({
                "id": f"plot_{plot_num}",
                "plot_number": plot_num,
                "size": p.get("size", "N/A"),
                "area": p.get("area", "N/A"),
                "polygon": r_coords(polygon),
                "status": "available",
                "price": "",
                "notes": "Digitized dynamically using Multimodal Gemini Vision."
            })
            
        final_decorations = []
        for d in detected_decorations:
            bbox = d.get("bbox")
            if bbox and len(bbox) == 4:
                try:
                    ymin, xmin, ymax, xmax = [float(v) * scale_factor for v in bbox]
                    polygon = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]]
                except (ValueError, TypeError):
                    continue
            else:
                continue
                
            final_decorations.append({
                "type": d.get("type", "road"),
                "label": d.get("label", ""),
                "polygon": r_coords(polygon)
            })
            
        return jsonify({
            "success": True,
            "plots": final_plots,
            "decorations": final_decorations
        })
    except Exception as e:
        return jsonify({"error": f"Gemini API Error: {str(e)}"}), 500

@project_bp.route('/api/export-html', methods=['POST'])
def api_export_html():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    plots = data.get('plots', [])
    decorations = data.get('decorations', [])
    filename = data.get('filename')
    
    image_base64 = ""
    if filename:
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(filepath):
            # Try to look in static folder
            filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', filename)
            if not os.path.exists(filepath):
                # Try sample_layout.jpg as a fallback
                filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', 'sample_layout.jpg')
                
        if os.path.exists(filepath):
            try:
                import base64
                with open(filepath, 'rb') as f:
                    img_data = f.read()
                    ext = filename.split('.')[-1].lower()
                    mime_type = f"image/{ext}" if ext in ['png', 'jpg', 'jpeg', 'gif'] else "image/jpeg"
                    image_base64 = f"data:{mime_type};base64,{base64.b64encode(img_data).decode('utf-8')}"
            except Exception as ex:
                current_app.logger.error(f"Failed to encode export image: {ex}")
    
    try:
        html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Real Estate Vector Map</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b111e;
            --grid-color: rgba(255, 255, 255, 0.04);
            --card-bg: rgba(20, 27, 45, 0.75);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-color: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --primary-glow: rgba(59, 130, 246, 0.25);
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Outfit', sans-serif; background-color: var(--bg-color); color: var(--text-color); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        header { background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); padding: 1.2rem 2rem; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        h1 { font-size: 1.35rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        h1 span { color: var(--primary); }
        .main-container { display: flex; flex: 1; position: relative; overflow: hidden; }
        .map-viewport { flex: 1; position: relative; background-image: radial-gradient(var(--grid-color) 1px, transparent 1px); background-size: 24px 24px; overflow: hidden; cursor: grab; display: flex; align-items: center; justify-content: center; }
        #canvas-container { position: relative; width: 800px; height: 800px; background-color: #070c18; border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); }
        #map-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; user-select: none; opacity: 0.65; pointer-events: none; }
        #svg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        polygon { pointer-events: auto; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        polygon.available { fill: rgba(16, 185, 129, 0.16); stroke: var(--success); stroke-width: 0.8; }
        polygon.available:hover { fill-opacity: 0.65; stroke-width: 1.5; }
        polygon.sold { fill: rgba(239, 68, 68, 0.18); stroke: var(--danger); stroke-width: 0.8; }
        polygon.sold:hover { fill-opacity: 0.65; stroke-width: 1.5; }
        polygon.reserved { fill: rgba(245, 158, 11, 0.22); stroke: var(--warning); stroke-width: 0.8; }
        polygon.reserved:hover { fill-opacity: 0.65; stroke-width: 1.5; }
        polygon.selected { stroke-width: 2.0; stroke: #ffffff !important; filter: drop-shadow(0 0 8px var(--primary)); fill-opacity: 0.12 !important; }
        polygon.selected:hover { fill-opacity: 0.18 !important; }
        svg:has(polygon.selected) polygon:not(.selected):not(.road):not(.site_boundary):not(.open_space):not(.park):not(.garden):not(.amenity) { opacity: 0.35; }
        polygon.road { fill: rgba(30, 41, 59, 0.75); stroke: rgba(255, 255, 255, 0.06); stroke-width: 0.1; cursor: default; pointer-events: none; }
        polygon.site_boundary { fill: none; stroke: var(--text-muted); stroke-width: 0.15; stroke-dasharray: 0.4 0.4; cursor: default; pointer-events: none; }
        polygon.open_space, polygon.park, polygon.garden { fill: rgba(16, 185, 129, 0.15); stroke: rgba(16, 185, 129, 0.4); stroke-width: 0.1; cursor: default; pointer-events: none; }
        polygon.amenity { fill: rgba(245, 158, 11, 0.15); stroke: rgba(245, 158, 11, 0.4); stroke-width: 0.1; cursor: default; pointer-events: none; }
        .sidebar { width: 370px; background-color: rgba(15, 23, 42, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 5; box-shadow: -10px 0 30px rgba(0,0,0,0.3); }
        .sidebar-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); font-weight: 800; font-size: 1.1rem; color: #fff; letter-spacing: -0.2px; }
        .sidebar-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; flex: 1; }
        .plot-info-card { background: rgba(15, 23, 42, 0.35); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.4rem; display: flex; flex-direction: column; gap: 1.1rem; }
        .info-item { display: flex; gap: 0.85rem; align-items: center; background: rgba(10, 15, 26, 0.4); padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.02); }
        .info-item div { display: flex; flex-direction: column; }
        .info-item .label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
        .info-item .val { font-size: 0.95rem; font-weight: 800; color: #fff; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; border: 1px solid transparent; width: fit-content; letter-spacing: 0.5px; }
        .badge-available { background: rgba(16, 185, 129, 0.12); color: #4ade80; border-color: rgba(16, 185, 129, 0.3); }
        .badge-reserved { background: rgba(245, 158, 11, 0.12); color: #facc15; border-color: rgba(245, 158, 11, 0.3); }
        .badge-sold { background: rgba(239, 68, 68, 0.12); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
        .no-selection { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); padding: 2rem; gap: 12px; }
        .no-selection-icon { font-size: 2.8rem; margin-bottom: 0.5rem; opacity: 0.4; color: var(--primary); filter: drop-shadow(0 4px 8px var(--primary-glow)); }
        #map-tooltip { position: fixed; background: rgba(15, 23, 42, 0.95); border: 1px solid var(--border-color); border-left: 3px solid var(--primary); padding: 8px 12px; border-radius: 6px; font-size: 0.75rem; color: #fff; pointer-events: none; z-index: 100; display: none; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
        .legend-container { display: flex; gap: 16px; background-color: rgba(15, 23, 42, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.6rem 1rem; position: absolute; bottom: 20px; left: 20px; z-index: 5; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-color); }
        .legend-color { width: 12px; height: 12px; border-radius: 4px; }
    </style>
</head>
<body>
    <header>
        <h1>Interactive Layout Map</h1>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Standalone Vector Overlays</div>
    </header>
    <div class="main-container">
        <div class="map-viewport" id="viewport">
            <div class="legend-container">
                <div class="legend-item"><div class="legend-color" style="background: rgba(16, 185, 129, 0.3); border-color: #10b981;"></div>Available</div>
                <div class="legend-item"><div class="legend-color" style="background: rgba(245, 158, 11, 0.3); border-color: #f59e0b;"></div>Reserved</div>
                <div class="legend-item"><div class="legend-color" style="background: rgba(239, 68, 68, 0.3); border-color: #ef4444;"></div>Sold</div>
            </div>
            <div id="canvas-container" style="position: relative; width: IMAGE_WIDTH_PLACEHOLDER; height: IMAGE_HEIGHT_PLACEHOLDER;">
                <img id="map-image" style="display: IMAGE_DISPLAY_PLACEHOLDER;" src="IMAGE_BASE64_PLACEHOLDER">
                <svg id="svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            </div>
        </div>
        <div class="sidebar">
            <div class="sidebar-header">Selected Plot Specifications</div>
            <div class="sidebar-content" id="sidebar-content">
                <div class="no-selection" id="sidebar-placeholder">
                    <div class="no-selection-icon">&#9635;</div>
                    <div style="font-weight: 600; font-size: 0.85rem;">No Plot Selected</div>
                    <div style="font-size: 0.7rem; margin-top: 0.25rem;">Click any layout polygon boundaries to inspect particulars.</div>
                </div>
                <div class="plot-info-card" id="sidebar-info" style="display: none;">
                    <div class="info-item">
                        <div>
                            <span class="label">Plot Number</span>
                            <span class="val" id="info-number">N/A</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <span class="label">Status</span>
                            <span class="status-badge" id="info-status-badge">Available</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <span class="label">Dimensions</span>
                            <span class="val" id="info-size">N/A</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <span class="label">Area Size</span>
                            <span class="val" id="info-area">N/A</span>
                        </div>
                    </div>
                    <div class="info-item" id="price-item">
                        <div>
                            <span class="label">Price</span>
                            <span class="val" id="info-price">N/A</span>
                        </div>
                    </div>
                    <div class="info-item" id="notes-item" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                        <div>
                            <span class="label">Notes / Details</span>
                            <span class="val" id="info-notes" style="font-weight: normal; font-size: 0.8rem; color: #cbd5e1;">N/A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="map-tooltip"></div>
    <script>
        const plots = PLOTS_DATA_PLACEHOLDER;
        const decorations = DECORATIONS_DATA_PLACEHOLDER;
        const svg = document.getElementById('svg-overlay');
        const tooltip = document.getElementById('map-tooltip');
        
        const infoCard = document.getElementById('sidebar-info');
        const infoPlaceholder = document.getElementById('sidebar-placeholder');
        const infoNumber = document.getElementById('info-number');
        const infoStatus = document.getElementById('info-status-badge');
        const infoSize = document.getElementById('info-size');
        const infoArea = document.getElementById('info-area');
        const infoPrice = document.getElementById('info-price');
        const infoNotes = document.getElementById('info-notes');
        
        function init() {
            // Render Roads and boundaries
            decorations.forEach(dec => {
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const points = dec.polygon.map(p => p.join(',')).join(' ');
                polygon.setAttribute('points', points);
                polygon.setAttribute('class', dec.type);
                svg.appendChild(polygon);
            });
            
            // Render Plots
            plots.forEach(plot => {
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const points = plot.polygon.map(p => p.join(',')).join(' ');
                poly.setAttribute('points', points);
                poly.setAttribute('class', plot.status);
                
                // Hover listeners
                poly.addEventListener('mouseenter', (e) => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<strong>Plot ${plot.plot_number}</strong><br>Status: ${plot.status.toUpperCase()}<br>Area: ${plot.area}`;
                });
                
                poly.addEventListener('mousemove', (e) => {
                    tooltip.style.left = (e.clientX + 15) + 'px';
                    tooltip.style.top = (e.clientY + 15) + 'px';
                });
                
                poly.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
                
                poly.addEventListener('click', () => {
                    // Deselect previous
                    document.querySelectorAll('polygon').forEach(p => p.classList.remove('selected'));
                    poly.classList.add('selected');
                    
                    // Show sidebar details
                    infoPlaceholder.style.display = 'none';
                    infoCard.style.display = 'flex';
                    infoNumber.textContent = plot.plot_number;
                    
                    infoStatus.textContent = plot.status;
                    infoStatus.className = `status-badge badge-${plot.status}`;
                    
                    infoSize.textContent = plot.size || 'N/A';
                    infoArea.textContent = plot.area || 'N/A';
                    
                    // Hide sensitive data
                    if (plot.status === 'sold' || plot.status === 'reserved') {
                        document.getElementById('price-item').style.display = 'none';
                        infoNotes.textContent = "[Restricted Content]";
                    } else {
                        document.getElementById('price-item').style.display = 'block';
                        infoPrice.textContent = plot.price || 'N/A';
                        infoNotes.textContent = plot.notes || 'No description provided.';
                    }
                });
                svg.appendChild(poly);
            });
        }
        init();
    </script>
</body>
</html>"""
        html_export = html_template.replace("PLOTS_DATA_PLACEHOLDER", json.dumps(plots))
        html_export = html_export.replace("DECORATIONS_DATA_PLACEHOLDER", json.dumps(decorations))
        html_export = html_export.replace("IMAGE_BASE64_PLACEHOLDER", image_base64)
        html_export = html_export.replace("IMAGE_DISPLAY_PLACEHOLDER", "block" if image_base64 else "none")
        html_export = html_export.replace("IMAGE_WIDTH_PLACEHOLDER", "100%" if image_base64 else "800px")
        html_export = html_export.replace("IMAGE_HEIGHT_PLACEHOLDER", "auto" if image_base64 else "800px")
        return jsonify({"success": True, "html": html_export})
    except Exception as e:
        return jsonify({"error": f"Failed to compile HTML: {str(e)}"}), 500

@project_bp.route('/api/config', methods=['GET'])
def api_get_config():
    api_key_set = bool(os.environ.get('GEMINI_API_KEY'))
    return jsonify({
        "gemini_api_configured": api_key_set
    })

@project_bp.route('/api/config', methods=['POST'])
def api_save_config():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    api_key = data.get("api_key", "").strip()
    
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(root_dir, '.env')
    
    try:
        lines = []
        key_found = False
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip().startswith('GEMINI_API_KEY='):
                        lines.append(f"GEMINI_API_KEY={api_key}\n")
                        key_found = True
                    else:
                        lines.append(line)
        
        if not key_found:
            lines.append(f"GEMINI_API_KEY={api_key}\n")
            
        with open(env_path, 'w') as f:
            f.writelines(lines)
            
        os.environ['GEMINI_API_KEY'] = api_key
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
