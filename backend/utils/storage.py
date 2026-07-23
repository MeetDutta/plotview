import os
import uuid
import requests
import shutil
from flask import current_app
from supabase import create_client, Client

# Initialize supabase client from environment variables if present
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "layouts")

_supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print("Failed to initialize Supabase storage client:", e)

def get_supabase_client():
    return _supabase_client

def upload_file_to_storage(file_source, filename):
    """
    Uploads a file to Supabase Storage (if configured) or saves locally.
    Returns:
        (db_value, frontend_url): 
            db_value: The string to store in the database (URL or filename).
            frontend_url: The resolved URL to return to the client.
    """
    client = get_supabase_client()
    if client:
        try:
            # Prepare file data as bytes
            file_data = None
            if isinstance(file_source, str) and os.path.exists(file_source):
                with open(file_source, 'rb') as f:
                    file_data = f.read()
            elif hasattr(file_source, 'read'):
                # Flask FileStorage or BytesIO
                file_source.seek(0)
                file_data = file_source.read()
            elif isinstance(file_source, bytes):
                file_data = file_source
            
            if file_data is None:
                raise ValueError("Invalid file source provided to upload_file_to_storage")

            # Determine content type based on extension
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            mime_types = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'webp': 'image/webp',
                'csv': 'text/csv'
            }
            content_type = mime_types.get(ext, 'application/octet-stream')

            # Upload to Supabase bucket
            # x-upsert header allows overwriting existing files
            client.storage.from_(SUPABASE_BUCKET).upload(
                path=filename,
                file=file_data,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            
            # Get public URL
            public_url = client.storage.from_(SUPABASE_BUCKET).get_public_url(filename)
            return public_url, public_url
        except Exception as e:
            print(f"Supabase upload failed: {e}. Falling back to local storage.")
            # Fall through to local storage if upload fails

    # Local fallback
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = os.path.join(upload_folder, filename)
    
    if isinstance(file_source, str):
        if file_source != filepath:
            shutil.copy2(file_source, filepath)
    elif hasattr(file_source, 'save'):
        # Flask FileStorage
        file_source.save(filepath)
    elif hasattr(file_source, 'read'):
        # BytesIO
        file_source.seek(0)
        with open(filepath, 'wb') as f:
            f.write(file_source.read())
    elif isinstance(file_source, bytes):
        with open(filepath, 'wb') as f:
            f.write(file_source)
            
    return filename, f"/uploads/{filename}"

def get_local_filepath(filename_or_url):
    """
    Resolves a filename or URL to a local filepath.
    If it is a URL, downloads the file to a temporary location on disk.
    If it is a local filename, returns the path within UPLOAD_FOLDER.
    """
    if not filename_or_url:
        return None
        
    if filename_or_url.startswith("http://") or filename_or_url.startswith("https://"):
        upload_folder = current_app.config['UPLOAD_FOLDER']
        url_path = filename_or_url.split('?')[0]
        base_name = url_path.split('/')[-1]
        
        # Cache local name to avoid duplicate downloads
        temp_name = f"cached_{base_name}"
        temp_path = os.path.join(upload_folder, temp_name)
        
        if os.path.exists(temp_path):
            return temp_path
            
        try:
            response = requests.get(filename_or_url, timeout=30)
            response.raise_for_status()
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            return temp_path
        except Exception as e:
            print(f"Failed to download image from {filename_or_url}: {e}")
            raise e
            
    # Local file
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return os.path.join(upload_folder, filename_or_url)
