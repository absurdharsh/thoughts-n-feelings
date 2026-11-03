import os
import cv2
import numpy as np
from PIL import Image
import vtracer

def process():
    output_dir = "preview-build/assets"
    os.makedirs(output_dir, exist_ok=True)
    
    clean_png = os.path.join(output_dir, "illustration-clean.png")
    if not os.path.exists(clean_png):
        raise FileNotFoundError(f"{clean_png} not found")
        
    img = Image.open(clean_png)
    rgba = np.array(img)
    h, w = rgba.shape[:2]
    
    # --- 1. Clean SVG Vectorization ---
    print("Generating SVG vector...")
    # Create high-contrast grayscale for vtracer
    alpha = rgba[:, :, 3]
    gray_mask = np.ones((h, w), dtype=np.uint8) * 255
    gray_mask[alpha > 45] = 0
    
    temp_p = os.path.join(output_dir, "temp_for_vtracer.png")
    cv2.imwrite(temp_p, gray_mask)
    
    svg_hero_path = os.path.join(output_dir, "illustration-hero.svg")
    vtracer.convert_image_to_svg_py(temp_p, svg_hero_path)
    if os.path.exists(temp_p):
        os.remove(temp_p)
        
    # Remove the background rect/path from SVG if present
    with open(svg_hero_path, 'r', encoding='utf-8') as f:
        svg_lines = f.readlines()
        
    cleaned_lines = []
    for line in svg_lines:
        # Skip pure white/near-white background fill paths
        if ('fill="#FEFEFE"' in line or 'fill="#FFFFFF"' in line or 'fill="#FCFCFC"' in line) and ('0 0 C356' in line or '0 0 C' in line and '1080' in line):
            continue
        cleaned_lines.append(line)
        
    svg_str = "".join(cleaned_lines)
    svg_str = svg_str.replace('<svg ', '<svg class="hero-svg" viewBox="0 0 1080 1350" vector-effect="non-scaling-stroke" ')
    svg_str = svg_str.replace('<path ', '<path class="ink-stroke" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" ')
    
    with open(svg_hero_path, 'w', encoding='utf-8') as f:
        f.write(svg_str)
    print(f"Generated clean SVG: {svg_hero_path}")

    # --- 2. Generate 5 Interactive Pose / Contour Scrubbing Frames ---
    print("Generating frame-1.webp through frame-5.webp...")
    # Frame 1: Leftward tilt & subtle lean (-14px shift, -1.2 deg rotate)
    # Frame 2: Slight left (-7px shift, -0.6 deg rotate)
    # Frame 3: Neutral (0 shift, 0 deg rotate)
    # Frame 4: Slight right (+7px shift, +0.6 deg rotate)
    # Frame 5: Rightward tilt & embrace lean (+14px shift, +1.2 deg rotate)
    
    angles = [-1.5, -0.75, 0.0, 0.75, 1.5]
    shifts_x = [-16, -8, 0, 8, 16]
    
    center = (w / 2.0, h * 0.6)
    
    for i in range(5):
        angle = angles[i]
        shift = shifts_x[i]
        
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        rot_mat[0, 2] += shift
        
        warped = cv2.warpAffine(
            rgba, 
            rot_mat, 
            (w, h), 
            flags=cv2.INTER_LANCZOS4, 
            borderMode=cv2.BORDER_CONSTANT, 
            borderValue=[0, 0, 0, 0]
        )
        
        frame_out = os.path.join(output_dir, f"frame-{i+1}.webp")
        Image.fromarray(warped).save(frame_out, "WEBP", quality=92)
        print(f"Saved {frame_out}")
        
    # --- 3. Multi-Layer Parallax Separation ---
    # Layer 1: Skulls & head focal points (top ~46%)
    # Layer 2: Core skeleton arms & ribs (middle 40% to 75%)
    # Layer 3: Deep ink crosshatching background
    print("Generating parallax layers...")
    
    # Skulls layer
    skull_alpha = alpha.copy().astype(np.float32)
    cutoff_skull = int(h * 0.44)
    feather = int(h * 0.08)
    for y in range(h):
        if y > cutoff_skull + feather:
            skull_alpha[y, :] = 0
        elif y > cutoff_skull:
            t = (y - cutoff_skull) / float(feather)
            skull_alpha[y, :] *= (1.0 - t)
            
    rgba_skulls = rgba.copy()
    rgba_skulls[:, :, 3] = skull_alpha.astype(np.uint8)
    Image.fromarray(rgba_skulls).save(os.path.join(output_dir, "layer-skulls.png"), "PNG")
    
    # Body & ribs layer
    body_alpha = alpha.copy().astype(np.float32)
    for y in range(h):
        if y < cutoff_skull - feather:
            body_alpha[y, :] = 0
        elif y < cutoff_skull:
            t = (cutoff_skull - y) / float(feather)
            body_alpha[y, :] *= (1.0 - t)
            
    rgba_body = rgba.copy()
    rgba_body[:, :, 3] = body_alpha.astype(np.uint8)
    Image.fromarray(rgba_body).save(os.path.join(output_dir, "layer-body.png"), "PNG")
    
    # Also save illustration-clean.webp for optimal web performance
    img.save(os.path.join(output_dir, "illustration-clean.webp"), "WEBP", quality=92)
    print("All layers and frames generated successfully!")

if __name__ == "__main__":
    process()
