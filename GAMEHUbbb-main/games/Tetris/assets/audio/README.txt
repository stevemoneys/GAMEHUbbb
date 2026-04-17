Place your background music files in this folder with these names:

1. Normal gameplay loop:
Path: assets/audio/bgm-normal.mp3

2. Danger (about to lose) loop:
Path: assets/audio/bgm-danger.mp3

Optional fallback file:
Path: assets/audio/bgm.mp3
Used only if bgm-normal.mp3 fails to load.

Supported by browser: mp3/ogg/wav
If you use different names, update these constants in main.js:
NORMAL_MUSIC_SOURCE, DANGER_MUSIC_SOURCE, MUSIC_FALLBACK_SOURCE.
