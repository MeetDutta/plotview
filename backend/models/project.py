import json
from backend.models.database import get_db

def get_all_projects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, image_filename, plots FROM projects")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_project_by_id(project_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def count_projects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM projects")
    count = cursor.fetchone()["count"]
    conn.close()
    return count

def create_project(project_id, name, plots, decorations, activity_log):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO projects (id, name, image_filename, plots, decorations, activity_log) VALUES (?, ?, ?, ?, ?, ?)",
        (project_id, name, None, json.dumps(plots), json.dumps(decorations), json.dumps(activity_log))
    )
    conn.commit()
    conn.close()

def save_project(project_id, plots, decorations, image_filename, activity_log):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE projects SET plots = ?, decorations = ?, image_filename = ?, activity_log = ? WHERE id = ?",
        (json.dumps(plots), json.dumps(decorations), image_filename, json.dumps(activity_log), project_id)
    )
    conn.commit()
    conn.close()

def update_plots_and_logs(project_id, plots, activity_log):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE projects SET plots = ?, activity_log = ? WHERE id = ?",
        (json.dumps(plots), json.dumps(activity_log), project_id)
    )
    conn.commit()
    conn.close()

def delete_project(project_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()

def update_project_name(project_id, name, activity_log):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE projects SET name = ?, activity_log = ? WHERE id = ?",
        (name, json.dumps(activity_log), project_id)
    )
    conn.commit()
    conn.close()
