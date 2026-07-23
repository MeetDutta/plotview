import time
from backend.models.database import get_db, hash_password

def get_user_by_id(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ? AND active = 1", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_username(username):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND active = 1", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role, active FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def count_admins():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    count = cursor.fetchone()["count"]
    conn.close()
    return count

def check_username_exists(username):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?)", (username,))
    u_count = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM agent_requests WHERE LOWER(username) = LOWER(?) AND status = 'pending'", (username,))
    r_count = cursor.fetchone()["count"]
    conn.close()
    return u_count > 0 or r_count > 0

def check_username_registered(username):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?)", (username,))
    count = cursor.fetchone()["count"]
    conn.close()
    return count > 0


def create_user(username, password, name, role):
    conn = get_db()
    cursor = conn.cursor()
    user_id = f"user_{role}_{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO users (id, username, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?, 1)",
        (user_id, username, hash_password(password), name, role)
    )
    conn.commit()
    conn.close()
    return user_id

def update_user(user_id, name=None, password=None, active=None):
    conn = get_db()
    cursor = conn.cursor()
    if name:
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
    if password:
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(password), user_id))
    if active is not None:
        cursor.execute("UPDATE users SET active = ? WHERE id = ?", (int(active), user_id))
    conn.commit()
    conn.close()

def delete_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
