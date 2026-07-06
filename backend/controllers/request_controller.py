import time
from flask import Blueprint, request, jsonify
from backend.controllers.auth_controller import get_current_user
from backend.models.user import create_user, check_username_registered
from backend.models.request import (
    get_pending_requests, get_request_by_id,
    approve_request, reject_request
)

request_bp = Blueprint('request', __name__)

@request_bp.route('/api/admin/requests', methods=['GET'])
def api_get_requests():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    requests_list = get_pending_requests()
    return jsonify(requests_list)

@request_bp.route('/api/admin/requests/<req_id>/approve', methods=['POST'])
def api_approve_request(req_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    req = get_request_by_id(req_id)
    if not req:
        return jsonify({"success": False, "error": "Pending request not found"}), 404
        
    if check_username_registered(req["username"]):
        # Dismiss request if username taken
        reject_request(req_id)
        return jsonify({"success": False, "error": "Username has already been registered."}), 400
        
    # Create the user as agent
    user_id = create_user(req["username"], "placeholder", req["name"], "agent")
    
    # Update hash directly since create_user expects raw pass but we have hash
    from backend.models.user import update_user
    # Set correct hash directly in DB
    from backend.models.database import get_db
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (req["password_hash"], user_id))
    conn.commit()
    conn.close()
    
    # Mark request as approved
    approve_request(req_id, user_id)
    
    return jsonify({"success": True})

@request_bp.route('/api/admin/requests/<req_id>/reject', methods=['POST'])
def api_reject_request(req_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    reject_request(req_id)
    return jsonify({"success": True})
