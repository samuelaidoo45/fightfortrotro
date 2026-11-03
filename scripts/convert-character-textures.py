"""Convert downloaded Rocketbox textures to local web assets. Requires Pillow."""
from pathlib import Path
from PIL import Image

output = Path(__file__).resolve().parent.parent / 'dist/assets/characters'
for source in Path('/private/tmp/trotro-source-textures').glob('*.tga'):
    image = Image.open(source)
    image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    if 'opacity' in source.name:
        image.save(output / (source.stem + '.png'))
    else:
        image.convert('RGB').save(output / (source.stem + '.jpg'), quality=90, optimize=True)
