from PIL import Image

def fix_image(path):
    print(f'Fixing {path}...')
    try:
        im = Image.open(path)
        im = im.convert('RGBA')
        im.save(path)
        print(f'Saved {path} as RGBA')
    except Exception as e:
        print(f'Error on {path}: {e}')

fix_image('public/logo.png')
fix_image('public/icon-192.png')
fix_image('public/icon-512.png')
fix_image('src/app/favicon.ico')
