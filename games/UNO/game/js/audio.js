const AUDIO_PATHS = {
  music: new URL('../../assets/audio/game-music-loop.mp3', import.meta.url).href,
  cardPlay: new URL('../../assets/audio/sfx-card-play.mp3', import.meta.url).href,
  cardDraw: new URL('../../assets/audio/sfx-card-draw.mp3', import.meta.url).href,
  actionCard: new URL('../../assets/audio/sfx-action-card.mp3', import.meta.url).href,
  unoAlert: new URL('../../assets/audio/sfx-uno-alert.mp3', import.meta.url).href,
  win: new URL('../../assets/audio/sfx-win.mp3', import.meta.url).href,
  coinReward: new URL('../../assets/audio/sfx-coin-reward.mp3', import.meta.url).href
};

const SETTING_KEYS = {
  music: 'gamehub_uno_setting_music',
  sfx: 'gamehub_uno_setting_sfx'
};

const audioState = {
  unlocked: false,
  musicStarted: false,
  music: null,
  sfx: new Map()
};

function createAudio(src, { loop = false, volume = 1 } = {}) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.loop = loop;
  audio.volume = volume;
  return audio;
}

function isEnabled(key) {
  return localStorage.getItem(key) !== 'off';
}

function unlockAudio() {
  audioState.unlocked = true;
  if (!audioState.musicStarted) startBackgroundMusic();
}

function ensureGestureUnlock() {
  const unlock = () => {
    unlockAudio();
    document.body?.removeEventListener('pointerdown', unlock);
    document.body?.removeEventListener('touchstart', unlock);
    document.body?.removeEventListener('click', unlock);
  };
  document.body?.addEventListener('pointerdown', unlock, { once: true });
  document.body?.addEventListener('touchstart', unlock, { once: true, passive: true });
  document.body?.addEventListener('click', unlock, { once: true });
}

function initGameAudio() {
  if (!audioState.music) {
    audioState.music = createAudio(AUDIO_PATHS.music, { loop: true, volume: 0.32 });
  }
  ensureGestureUnlock();
}

function startBackgroundMusic() {
  if (!isEnabled(SETTING_KEYS.music)) return;
  if (!audioState.music) {
    audioState.music = createAudio(AUDIO_PATHS.music, { loop: true, volume: 0.32 });
  }
  audioState.musicStarted = true;
  audioState.music.currentTime = 0;
  audioState.music.play().catch(() => {
    audioState.musicStarted = false;
  });
}

function stopBackgroundMusic() {
  if (!audioState.music) return;
  audioState.music.pause();
  audioState.music.currentTime = 0;
  audioState.musicStarted = false;
}

function playSfx(name, volume = 1) {
  if (!isEnabled(SETTING_KEYS.sfx)) return;
  if (!audioState.unlocked) return;
  const path = AUDIO_PATHS[name];
  if (!path) return;

  let base = audioState.sfx.get(name);
  if (!base) {
    base = createAudio(path, { volume });
    audioState.sfx.set(name, base);
  }

  const sound = base.cloneNode();
  sound.volume = volume;
  sound.play().catch(() => {});
}

function getAudioPaths() {
  return { ...AUDIO_PATHS };
}

export {
  initGameAudio,
  unlockAudio,
  startBackgroundMusic,
  stopBackgroundMusic,
  playSfx,
  getAudioPaths
};
