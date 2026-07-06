from flask import request, jsonify, Blueprint
from backend.controllers.auth_controller import get_current_user
from backend.models.user import (
    get_all_users, create_user, update_user, delete_user,
    count_admins, check_username_exists
)

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/admin/agents', methods=['GET'])
def api_get_agents():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    users = get_all_users()
    formatted = []
    for u in users:
        formatted.append({
            "id": u["id"],
            "username": u["username"],
            "name": u["name"] + f" ({u['role'].upper()})",
            "role": u["role"],
            "active": bool(u["active"])
        })
    return jsonify(formatted)

@user_bp.route('/api/admin/agents/new', methods=['POST'])
def api_create_agent():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    role = data.get("role", "agent").strip().lower()
    
    if role not in ["admin", "agent"]:
        role = "agent"
        
    if not username or not password or not name:
        return jsonify({"success": False, "error": "Username, password and name are required"}), 400
        
    if check_username_exists(username):
        return jsonify({"success": False, "error": "Username already exists or has a pending request"}), 400
        
    if role == "admin":
        if count_admins() >= 2:
            return jsonify({"success": False, "error": "Maximum limit of 2 Admin accounts has been reached."}), 400
            
    create_user(username, password, name, role)
    return jsonify({"success": True})

@user_bp.route('/api/admin/agents/<agent_id>/update', methods=['POST'])
def api_update_agent(agent_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    password = data.get("password", "").strip()
    active = data.get("active", None)
    
    if agent_id == current_user["id"] and active is not None and not active:
        return jsonify({"success": False, "error": "You cannot deactivate your own logged-in admin account."}), 400
        
    update_user(agent_id, name, password, active)
    return jsonify({"success": True})

@user_bp.route('/api/admin/agents/<agent_id>/delete', methods=['POST'])
def api_delete_agent(agent_id):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    if agent_id == current_user["id"]:
        return jsonify({"success": False, "error": "You cannot delete your own logged-in admin account."}), 400
        
    delete_user(agent_id)
    return jsonify({"success": True})
