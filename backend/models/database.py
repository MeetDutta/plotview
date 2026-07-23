import os
import json
import sqlite3
import hashlib
import psycopg2
import psycopg2.extras

# Locate database inside uploads folder at root workspace
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
DB_PATH = os.path.join(UPLOAD_FOLDER, 'realestate.db')

DATABASE_URL = os.environ.get("DATABASE_URL")

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

class PostgresCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        # Translate SQLite-style '?' placeholders to PostgreSQL-style '%s'
        translated_query = query.replace('?', '%s')
        if params is not None:
            self._cursor.execute(translated_query, params)
        else:
            self._cursor.execute(translated_query)
        return self

    def executemany(self, query, seq_of_params):
        translated_query = query.replace('?', '%s')
        self._cursor.executemany(translated_query, seq_of_params)
        return self

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is not None:
            return dict(row)
        return None

    def fetchall(self):
        rows = self._cursor.fetchall()
        return [dict(r) for r in rows]

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def close(self):
        self._cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class PostgresConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, *args, **kwargs):
        # Use RealDictCursor to automatically get dict-like rows
        pg_cursor = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return PostgresCursorWrapper(pg_cursor)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self.close()

def get_db():
    if DATABASE_URL:
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url)
        return PostgresConnectionWrapper(conn)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        name TEXT,
        role TEXT,
        active INTEGER DEFAULT 1
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_requests (
        id TEXT PRIMARY KEY,
        username TEXT,
        password_hash TEXT,
        name TEXT,
        requested_at TEXT,
        status TEXT DEFAULT 'pending'
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        image_filename TEXT,
        plots TEXT,
        decorations TEXT,
        activity_log TEXT
    )
    """)
    conn.commit()
    
    # 2. Seed default users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        default_users = [
            ("user_admin", "admin", hash_password("admin123"), "System Administrator", "admin", 1),
            ("user_agent_1", "rahul", hash_password("agent123"), "Rahul Sharma", "agent", 1),
            ("user_agent_2", "priya", hash_password("agent123"), "Priya Patel", "agent", 1)
        ]
        cursor.executemany("INSERT INTO users (id, username, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?, ?)", default_users)
        conn.commit()
        
    # 3. Seed default projects (migrating from projects.json first, then map_data.json)
    cursor.execute("SELECT COUNT(*) as count FROM projects")
    if cursor.fetchone()["count"] == 0:
        seeded_projects = []
        old_db_path = os.path.join(UPLOAD_FOLDER, 'projects.json')
        if os.path.exists(old_db_path):
            try:
                with open(old_db_path, 'r') as f:
                    old_db = json.load(f)
                    for p in old_db.get("projects", []):
                        seeded_projects.append((
                            p["id"],
                            p["name"],
                            p.get("image_filename"),
                            json.dumps(p.get("plots", [])),
                            json.dumps(p.get("decorations", [])),
                            json.dumps(p.get("activity_log", []))
                        ))
            except Exception as e:
                print("Error reading old projects.json during MVC init:", e)
                
        if not seeded_projects:
            # Fallback to static/map_data.json
            map_data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'static', 'map_data.json')
            plots = []
            decorations = []
            if os.path.exists(map_data_path):
                try:
                    with open(map_data_path, 'r') as f:
                        map_data = json.load(f)
                        plots = map_data.get("plots", [])
                        decorations = map_data.get("decorations", [])
                except Exception as e:
                    print("Error reading map_data.json sample:", e)
            seeded_projects.append((
                "plan_tekadi",
                "Mouza Tekadi Layout",
                "uploaded_layout.jpg",
                json.dumps(plots),
                json.dumps(decorations),
                json.dumps([])
            ))
            
        cursor.executemany("INSERT INTO projects (id, name, image_filename, plots, decorations, activity_log) VALUES (?, ?, ?, ?, ?, ?)", seeded_projects)
        conn.commit()
        
    conn.close()
