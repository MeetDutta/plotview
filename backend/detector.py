import cv2
import numpy as np
from PIL import Image

def detect_layout_bbox(image_path):
    """
    Analyzes the image to detect potential layout bounding boxes.
    Also samples the background color.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image")

    h, w, c = img.shape

    # 1. Sample background color from corners
    corner_points = [
        img[10, 10],
        img[10, w - 10],
        img[h - 10, 10],
        img[h - 10, w - 10],
        img[5, 5],
        img[5, w - 5],
        img[h - 5, 5],
        img[h - 5, w - 5]
    ]
    bg_bgr = np.median(corner_points, axis=0).astype(int)
    bg_rgb = [int(bg_bgr[2]), int(bg_bgr[1]), int(bg_bgr[0])]

    # 2. Threshold the image based on background color distance
    img_f = img.astype(np.float32)
    bg_bgr_f = np.array(bg_bgr, dtype=np.float32)

    # Compute Euclidean distance in BGR space
    dist = np.linalg.norm(img_f - bg_bgr_f, axis=2)

    # Foreground mask: pixels that are different from background color
    fg_mask = (dist > 50).astype(np.uint8) * 255

    # 3. Morphological operations to group nearby components of the layout
    k_size = int(min(h, w) * 0.015)
    if k_size % 2 == 0:
        k_size += 1
    k_size = max(5, k_size)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
    
    # Close gaps (morphological closing)
    processed = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
    # Perform a light dilation (1 iteration) to connect roads and label elements
    processed = cv2.dilate(processed, kernel, iterations=1)

    # 4. Find contours
    contours, _ = cv2.findContours(processed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    min_area = (w * h) * 0.05  # ignore candidate components smaller than 5% of the image

    for contour in contours:
        x, y, cw, ch = cv2.boundingRect(contour)
        area = cw * ch
        if area >= min_area:
            if cw > w * 0.98 and ch > h * 0.98:
                continue
            
            candidates.append({
                'x': int(x),
                'y': int(y),
                'width': int(cw),
                'height': int(ch),
                'area': int(area),
                'label': f"Auto-Crop Area {len(candidates) + 1}"
            })

    # Sort candidates by area in descending order
    candidates = sorted(candidates, key=lambda c: c['area'], reverse=True)

    # Relabel sorted list
    for idx, c in enumerate(candidates):
        c['label'] = f"Auto-Crop Area {idx + 1}"

    # If no candidates found, fallback to a sensible crop box (center 70%)
    if not candidates:
        candidates.append({
            'x': int(w * 0.15),
            'y': int(h * 0.05),
            'width': int(w * 0.7),
            'height': int(h * 0.9),
            'area': int(w * h * 0.63),
            'label': 'Default Area'
        })

    return {
        'candidates': candidates,
        'suggested_bg_color': bg_rgb,
        'image_size': {'width': w, 'height': h}
    }


def extract_plot_map(image_path, x, y, width, height, bg_rgb, tolerance, 
                     brightness=0, contrast=0, sharpness=0, saturation=1.0, upscale=1.0,
                     output_format='png'):
    """
    Crops the image to the specified bounding box, applies enhancements (brightness, contrast,
    saturation, sharpening, and scaling), removes the background color, and returns a PIL Image.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image")

    h, w, c = img.shape

    # Constrain crop coordinates to image boundaries
    x1 = max(0, min(x, w - 1))
    y1 = max(0, min(y, h - 1))
    x2 = max(0, min(x + width, w))
    y2 = max(0, min(y + height, h))

    cropped = img[y1:y2, x1:x2]

    # 1. Background Mask Calculation (performed on original crop colors)
    cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    cropped_f = cropped_rgb.astype(np.float32)
    bg_rgb_f = np.array(bg_rgb, dtype=np.float32)
    dist = np.linalg.norm(cropped_f - bg_rgb_f, axis=2)
    bg_mask = dist < tolerance

    # Apply morphological opening to the mask to clean up tiny stray pixels/noise in the background
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    bg_mask = cv2.morphologyEx(bg_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel).astype(bool)

    # 2. Image Enhancements
    enhanced = cropped.copy()

    # A. Scale / Upscale Resolution
    if upscale > 1.0:
        new_w = int(enhanced.shape[1] * upscale)
        new_h = int(enhanced.shape[0] * upscale)
        # Lanczos interpolation yields very high quality upscaling for vector/plot shapes
        enhanced = cv2.resize(enhanced, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        # Scale background mask using nearest neighbor to preserve crisp edges
        bg_mask = cv2.resize(bg_mask.astype(np.uint8), (new_w, new_h), interpolation=cv2.INTER_NEAREST).astype(bool)

    # B. Brightness & Contrast
    alpha = 1.0 + (contrast / 100.0)
    beta = float(brightness)
    enhanced = cv2.convertScaleAbs(enhanced, alpha=alpha, beta=beta)

    # C. Saturation
    if abs(saturation - 1.0) > 0.01:
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = hsv[:, :, 1] * saturation
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
        enhanced = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    # D. Sharpening
    if sharpness > 0:
        # Standard sharpening filter kernel
        kernel_sharp = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]], dtype=np.float32)
        sharpened = cv2.filter2D(enhanced, -1, kernel_sharp)
        # Blend original and sharpened based on slider strength (0 to 10)
        weight = min(1.0, max(0.0, sharpness / 10.0))
        enhanced = cv2.addWeighted(enhanced, 1.0 - weight, sharpened, weight, 0)

    # Convert final enhanced image to RGB
    enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)

    # 3. Create output image with transparency or white background
    if output_format.lower() == 'png':
        # Create an RGBA image
        rgba = np.zeros((enhanced.shape[0], enhanced.shape[1], 4), dtype=np.uint8)
        rgba[:, :, :3] = enhanced_rgb
        rgba[:, :, 3] = 255  # fully opaque
        rgba[bg_mask, 3] = 0  # make background transparent
        rgba[bg_mask, :3] = 255  # set background pixels color to white for neat blending
        
        # Smooth alpha channel slightly along boundaries to reduce jaggedness
        alpha_ch = rgba[:, :, 3]
        blurred_alpha = cv2.GaussianBlur(alpha_ch, (3, 3), 0)
        rgba[:, :, 3] = np.where(blurred_alpha > 50, blurred_alpha, 0)
        
        return Image.fromarray(rgba, 'RGBA')
    else:
        # Create an RGB image with solid white background
        rgb_out = np.zeros_like(enhanced_rgb)
        rgb_out[:] = 255  # white background
        rgb_out[~bg_mask] = enhanced_rgb[~bg_mask]
        return Image.fromarray(rgb_out, 'RGB')
