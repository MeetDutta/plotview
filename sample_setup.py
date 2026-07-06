import os
import shutil

def setup_sample():
    src_dir = "/Users/meet/.gemini/antigravity-ide/brain/15f212ac-322c-43eb-9b8f-19e7d8bfe993"
    dest_dir = "/Users/meet/Desktop/proj 1.1/static"
    
    # Create static directory if it doesn't exist
    os.makedirs(dest_dir, exist_ok=True)
    os.makedirs("/Users/meet/Desktop/proj 1.1/uploads", exist_ok=True)
    
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
