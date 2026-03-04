const Connect4Settings = (() => {
    const STORAGE_KEY = "connect4_settings_v1";

    function getDefaults() {
        return {
            musicEnabled: true,
            sfxEnabled: true,
            musicVolume: 0.42,
        };
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalize(input) {
        const data = input && typeof input === "object" ? input : {};
        return {
            musicEnabled: data.musicEnabled !== false,
            sfxEnabled: data.sfxEnabled !== false,
            musicVolume: clamp(Number(data.musicVolume) || 0.42, 0, 1),
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return getDefaults();
            }
            return normalize(JSON.parse(raw));
        } catch (error) {
            return getDefaults();
        }
    }

    function save(partial) {
        const merged = normalize({ ...load(), ...(partial || {}) });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (error) {
            return merged;
        }
        return merged;
    }

    function isMusicEnabled() {
        return load().musicEnabled;
    }

    function isSfxEnabled() {
        return load().sfxEnabled;
    }

    return {
        load,
        save,
        isMusicEnabled,
        isSfxEnabled,
    };
})();
