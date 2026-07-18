import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.models.database import init_db
from backend.controllers.auth_controller import auth_bp
from backend.controllers.user_controller import user_bp
from backend.controllers.request_controller import request_bp
from backend.controllers.project_controller import project_bp

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize SQLite database schema and seed defaults
init_db()

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(request_bp)
app.register_blueprint(project_bp)

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
