import os
import shutil

def setup_sample():
    # Use path relative to this script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = "/Users/meet/.gemini/antigravity-ide/brain/15f212ac-322c-43eb-9b8f-19e7d8bfe993"
    dest_dir = os.path.join(script_dir, "static")
    uploads_dir = os.path.join(script_dir, "uploads")
    
    # Create static & uploads directories if they don't exist
    os.makedirs(dest_dir, exist_ok=True)
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Find the media file
    media_file = "media__1782643434799.jpg"
    src_path = os.path.join(src_dir, media_file)
    dest_path = os.path.join(dest_dir, "sample_layout.jpg")
    
    if os.path.exists(src_path):
        shutil.copy(src_path, dest_path)
        print(f"Successfully copied sample map to {dest_path}")
    else:
        print(f"Source file {src_path} not found.")

if __name__ == "__main__":
    setup_sample()
