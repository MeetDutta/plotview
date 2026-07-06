import time
from datetime import datetime
from backend.models.database import get_db, hash_password

def create_signup_request(username, password, name):
    conn = get_db()
    cursor = conn.cursor()
    req_id = f"req_{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO agent_requests (id, username, password_hash, name, requested_at, status) VALUES (?, ?, ?, ?, ?, 'pending')",
        (req_id, username, hash_password(password), name, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return req_id

def get_pending_requests():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, requested_at FROM agent_requests WHERE status = 'pending'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_request_by_id(req_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agent_requests WHERE id = ? AND status = 'pending'", (req_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def approve_request(req_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE agent_requests SET status = 'approved' WHERE id = ?", (req_id,))
    conn.commit()
    conn.close()

def reject_request(req_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE agent_requests SET status = 'rejected' WHERE id = ?", (req_id,))
    conn.commit()
    conn.close()
