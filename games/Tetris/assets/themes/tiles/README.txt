TETRIXA THEME ASSET GUIDE
=========================

You have 20 themes (one per level group of 5 stages).

Folder structure:
- assets/themes/backgrounds/
- assets/themes/tiles/

Save files with these exact names:

Backgrounds (20 files, .webp):
- theme-01.webp
- theme-02.webp
- ...
- theme-20.webp

Square tiles (20 files, 1:1 ratio, .png preferred):
- theme-01.png
- theme-02.png
- ...
- theme-20.png

Alternative supported tile naming:
- theme-01.webp ... theme-20.webp

Mapping:
- Stages 1-5   -> theme-01
- Stages 6-10  -> theme-02
- ...
- Stages 96-100 -> theme-20

Notes:
- Tile images are drawn into each occupied board cell and auto-scaled to fit.
- If a theme background is missing, the game falls back to assets/backgrounds/playingpg.webp.
- If a tile image is missing, blocks use neon color rendering fallback.
