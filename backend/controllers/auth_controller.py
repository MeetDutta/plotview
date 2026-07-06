from flask import request, jsonify, Blueprint
from backend.models.user import get_user_by_id, get_user_by_username, check_username_exists
from backend.models.database import hash_password
from backend.models.request import create_signup_request

auth_bp = Blueprint('auth', __name__)

def get_current_user():
    token = request.headers.get("X-User-Token")
    if not token:
        return None
    return get_user_by_id(token)


@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400
        
    user = get_user_by_username(username)
    if user and user["password_hash"] == hash_password(password):
        return jsonify({
            "success": True,
            "token": user["id"],
            "user": {
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
                "role": user["role"]
            }
        })
        
    return jsonify({"success": False, "error": "Invalid username or password"}), 401

@auth_bp.route('/api/register-request', methods=['POST'])
def api_register_request():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    
    if not username or not password or not name:
        return jsonify({"success": False, "error": "Username, password and name are required to submit request."}), 400
        
    if check_username_exists(username):
        return jsonify({"success": False, "error": "Username already exists or has a pending request"}), 400
        
    create_signup_request(username, password, name)
    return jsonify({"success": True, "message": "Agent account request submitted. Awaiting administrator approval."})
