from PIL import Image

def process_logo():
    print('Opening logo.png...')
    im = Image.open('public/logo.png').convert('RGB')
    pixels = im.load()
    width, height = im.size
    
    threshold = 50
    
    min_x = width
    min_y = height
    max_x = 0
    max_y = 0
    
    for y in range(height):
        for x in range(width):
            # IGNORE AI WATERMARK IN TOP LEFT
            if x < 150 and y < 150:
                continue
                
            r, g, b = pixels[x, y]
            intensity = max(r, g, b)
            if intensity > threshold:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if min_x > max_x or min_y > max_y:
        print('Image is completely empty based on threshold.')
        return
        
    bbox = (min_x, min_y, max_x, max_y)
    print(f'Cropping to bounding box: {bbox}')
    trimmed = im.crop(bbox)
    
    tw, th = trimmed.size
    max_dim = max(tw, th)
    padding = int(max_dim * 0.05)
    new_size = max_dim + padding * 2
    
    new_im = Image.new('RGB', (new_size, new_size), (0, 0, 0))
    x_offset = (new_size - tw) // 2
    y_offset = (new_size - th) // 2
    new_im.paste(trimmed, (x_offset, y_offset))
    
    new_im.save('public/logo.png')
    new_im.resize((512, 512), Image.Resampling.LANCZOS).save('public/icon-512.png')
    new_im.resize((192, 192), Image.Resampling.LANCZOS).save('public/icon-192.png')
    new_im.resize((32, 32), Image.Resampling.LANCZOS).save('src/app/favicon.ico')
    
    print('Done!')

process_logo()
