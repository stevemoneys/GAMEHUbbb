const Connect4Themes = (() => {
    const STORAGE_KEY = "connect4_theme_v2";

    const COLOR_THEMES = [
        {
            id: "classic",
            name: "Red vs Yellow",
            description: "Default rivalry palette.",
            p1: { key: "red", name: "Red", hex: "#EF4444" },
            p2: { key: "yellow", name: "Yellow", hex: "#FACC15" },
        },
        {
            id: "electric",
            name: "Electric Blue vs Neon Orange",
            description: "Arcade voltage and bright fire.",
            p1: { key: "electric_blue", name: "Electric Blue", hex: "#2563EB" },
            p2: { key: "neon_orange", name: "Neon Orange", hex: "#F97316" },
        },
        {
            id: "royal",
            name: "Royal Purple vs Emerald Green",
            description: "High-contrast premium duel.",
            p1: { key: "royal_purple", name: "Royal Purple", hex: "#7C3AED" },
            p2: { key: "emerald_green", name: "Emerald Green", hex: "#10B981" },
        },
        {
            id: "obsidian",
            name: "Obsidian Black vs Molten Gold",
            description: "Dark elite against metallic shine.",
            p1: { key: "obsidian_black", name: "Obsidian Black", hex: "#111827" },
            p2: { key: "molten_gold", name: "Molten Gold", hex: "#FACC15" },
        },
        {
            id: "neon",
            name: "Cyan Glow vs Magenta Glow",
            description: "Cyber neon battle style.",
            p1: { key: "cyan_glow", name: "Cyan Glow", hex: "#06B6D4" },
            p2: { key: "magenta_glow", name: "Magenta Glow", hex: "#D946EF" },
        },
    ];

    const BACKGROUND_THEMES = [
        { id: "bg01", name: "Ocean Majesty", file: "bg1_result.webp" },
        { id: "bg02", name: "Golden Sunset Cliff", file: "bg2_result.webp" },
        { id: "bg03", name: "Celestial Dream Sky", file: "bg3_result.webp" },
        { id: "bg04", name: "Frost Kingdom", file: "bg4_result.webp" },
        { id: "bg05", name: "Emerald Forest Temple", file: "bg5_result.webp" },
        { id: "bg06", name: "Obsidian Volcano Realm", file: "bg6_result.webp" },
        { id: "bg07", name: "Royal Marble Palace", file: "bg7_result.webp" },
        { id: "bg08", name: "Neon Skyline Elite", file: "bg8_result.webp" },
        { id: "bg09", name: "Astral Galaxy Realm", file: "bg9_result.webp" },
        { id: "bg10", name: "Sakura Heaven", file: "bg10_result.webp" },
        { id: "bg11", name: "Crystal Lagoon Sanctuary", file: "bg11_result.webp" },
        { id: "bg12", name: "Aurora Crown Sky", file: "bg12_result.webp" },
        { id: "bg13", name: "Paradise Infinity", file: "bg13_result.webp" },
        { id: "bg14", name: "Golden Bridge of Legends", file: "bg14_result.webp" },
        { id: "bg15", name: "Desert Mirage Kingdom", file: "bg15_result.webp" },
        { id: "bg16", name: "Ocean of Stars", file: "bg16_result.webp" },
        { id: "bg17", name: "Ember Throne Realm", file: "bg17_result.webp" },
        { id: "bg18", name: "Sky Citadel Above Clouds", file: "bg18_result.webp" },
        { id: "bg19", name: "Frozen Crystal Cavern", file: "bg19_result.webp" },
        { id: "bg20", name: "Divine Light Horizon", file: "bg20_result.webp" },
        { id: "bg21", name: "Emperor's Celestial Garden", file: "bg21_result.webp" },
        { id: "bg22", name: "Phoenix Ascension Realm", file: "bg22_result.webp" },
        { id: "bg23", name: "Atlantis Sovereign Rise", file: "bg23_result.webp" },
        { id: "bg24", name: "Infinity Void Nexus", file: "bg24_result.webp" },
        { id: "bg25", name: "Genesis of Creation", file: "bg25_result.webp" },
    ];

    const BOARD_TEXTURE_THEMES = [
        { id: "board01", name: "Texture 1", preview: "boardskin1_result.webp", texture: "bgtexture1_result.webp" },
        { id: "board02", name: "Texture 2", preview: "boardskin2_result.webp", texture: "bgtexture2_result.webp" },
        { id: "board03", name: "Texture 3", preview: "boardskin3_result.webp", texture: "bgtexture3_result.webp" },
        { id: "board04", name: "Texture 4", preview: "boardskin4_result.webp", texture: "bgtexture4_result.webp" },
        { id: "board05", name: "Texture 5", preview: "boardskin5_result.webp", texture: "bgtexture5_result.webp" },
        { id: "board06", name: "Texture 6", preview: "boardskin6_result.webp", texture: "bgtexture6_result.webp" },
        { id: "board07", name: "Texture 7", preview: "boardskin7_result.webp", texture: "bgtexture7_result.webp" },
        { id: "board08", name: "Texture 8", preview: "boardskin8_result.webp", texture: "bgtexture8_result.webp" },
        { id: "board09", name: "Texture 9", preview: "boardskin9_result.webp", texture: "bgtexture9_result.webp" },
        { id: "board10", name: "Texture 10", preview: "boardskin10_result.webp", texture: "bgtexture10_result.webp" },
    ];

    const PIECE_SKINS = [
        { id: "skin01", index: 1, name: "Core Ring", price: 0 },
        { id: "skin02", index: 2, name: "Nova Edge", price: 470 },
        { id: "skin03", index: 3, name: "Titan Groove", price: 530 },
        { id: "skin04", index: 4, name: "Neon Trim", price: 620 },
        { id: "skin05", index: 5, name: "Royal Crest", price: 710 },
        { id: "skin06", index: 6, name: "Solar Seal", price: 780 },
        { id: "skin07", index: 7, name: "Aether Wheel", price: 860 },
        { id: "skin08", index: 8, name: "Obsidian Halo", price: 940 },
        { id: "skin09", index: 9, name: "Prism Core", price: 1020 },
        { id: "skin10", index: 10, name: "Genesis Crown", price: 1150 },
    ];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function hexToRgb(hex) {
        const normalized = hex.replace("#", "");
        const safeHex = normalized.length === 3
            ? normalized.split("").map((part) => part + part).join("")
            : normalized;
        const intValue = Number.parseInt(safeHex, 16);
        if (Number.isNaN(intValue)) {
            return { r: 255, g: 255, b: 255 };
        }
        return {
            r: (intValue >> 16) & 255,
            g: (intValue >> 8) & 255,
            b: intValue & 255,
        };
    }

    function rgbToHex(r, g, b) {
        const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function tint(hex, amount) {
        const { r, g, b } = hexToRgb(hex);
        const weight = clamp(amount, -1, 1);
        if (weight >= 0) {
            return rgbToHex(r + (255 - r) * weight, g + (255 - g) * weight, b + (255 - b) * weight);
        }
        return rgbToHex(r * (1 + weight), g * (1 + weight), b * (1 + weight));
    }

    function toRgba(hex, alpha) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function getColorThemeById(themeId) {
        const found = COLOR_THEMES.find((theme) => theme.id === themeId);
        return found || COLOR_THEMES[0];
    }

    function getBackgroundById(backgroundId) {
        const found = BACKGROUND_THEMES.find((theme) => theme.id === backgroundId);
        return found || BACKGROUND_THEMES[0];
    }

    function getBoardTextureById(textureId) {
        const found = BOARD_TEXTURE_THEMES.find((theme) => theme.id === textureId);
        return found || BOARD_TEXTURE_THEMES[0];
    }

    function getPieceSkinById(pieceSkinId) {
        const found = PIECE_SKINS.find((skin) => skin.id === pieceSkinId);
        return found || PIECE_SKINS[0];
    }

    function getColorThemes() {
        return COLOR_THEMES.slice();
    }

    function getBackgroundThemes() {
        return BACKGROUND_THEMES.slice();
    }

    function getBoardTextureThemes() {
        return BOARD_TEXTURE_THEMES.slice();
    }

    function getPieceSkins() {
        return PIECE_SKINS.slice();
    }

    function getDefaultSelection() {
        return {
            colorThemeId: COLOR_THEMES[0].id,
            humanPlayer: 1,
            backgroundId: BACKGROUND_THEMES[0].id,
            boardTextureId: BOARD_TEXTURE_THEMES[0].id,
            pieceSkinId: PIECE_SKINS[0].id,
        };
    }

    function normalizeSelection(selection) {
        const colorTheme = getColorThemeById(selection.colorThemeId || selection.themeId);
        const humanPlayer = selection.humanPlayer === 2 ? 2 : 1;
        const background = getBackgroundById(selection.backgroundId || BACKGROUND_THEMES[0].id);
        const boardTexture = getBoardTextureById(selection.boardTextureId || BOARD_TEXTURE_THEMES[0].id);
        const pieceSkin = getPieceSkinById(selection.pieceSkinId || PIECE_SKINS[0].id);
        return {
            colorThemeId: colorTheme.id,
            humanPlayer,
            backgroundId: background.id,
            boardTextureId: boardTexture.id,
            pieceSkinId: pieceSkin.id,
        };
    }

    function loadSelection() {
        const fallback = getDefaultSelection();
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return fallback;
            }
            const parsed = JSON.parse(raw);
            return normalizeSelection(parsed);
        } catch (error) {
            return fallback;
        }
    }

    function saveSelection(selection) {
        const normalized = normalizeSelection(selection);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (error) {
            return normalized;
        }
        return normalized;
    }

    function getUnlockedBackgroundCount(highestUnlockedStageIndex) {
        const safeStage = Math.max(1, Number(highestUnlockedStageIndex) || 1);
        const wins = Math.max(0, safeStage - 1);
        const unlocked = 1 + Math.floor(wins / 4);
        return clamp(unlocked, 1, BACKGROUND_THEMES.length);
    }

    function isBackgroundUnlocked(backgroundId, highestUnlockedStageIndex) {
        const index = BACKGROUND_THEMES.findIndex((bg) => bg.id === backgroundId);
        if (index < 0) {
            return false;
        }
        return index < getUnlockedBackgroundCount(highestUnlockedStageIndex);
    }

    function getBackgroundUnlockThreshold(index) {
        const clamped = clamp(index, 0, BACKGROUND_THEMES.length - 1);
        const requiredWins = clamped * 4;
        const requiredStage = requiredWins + 1;
        const requiredLevel = Math.floor((requiredStage - 1) / 10) + 1;
        const requiredLevelStage = ((requiredStage - 1) % 10) + 1;
        return {
            stageIndex: requiredStage,
            level: requiredLevel,
            stage: requiredLevelStage,
        };
    }

    function getUnlockedBoardTextureCount(highestUnlockedStageIndex) {
        if (typeof Connect4Progression === "undefined") {
            return BOARD_TEXTURE_THEMES.length;
        }
        const safeStage = Math.max(1, Number(highestUnlockedStageIndex) || 1);
        const levelReached = Connect4Progression.fromStageIndex(safeStage).level;
        return clamp(levelReached, 1, BOARD_TEXTURE_THEMES.length);
    }

    function isBoardTextureUnlocked(textureId, highestUnlockedStageIndex) {
        const index = BOARD_TEXTURE_THEMES.findIndex((texture) => texture.id === textureId);
        if (index < 0) {
            return false;
        }
        return index < getUnlockedBoardTextureCount(highestUnlockedStageIndex);
    }

    function getBoardTextureUnlockThreshold(index) {
        const clamped = clamp(index, 0, BOARD_TEXTURE_THEMES.length - 1);
        return {
            level: clamped + 1,
        };
    }

    function getBackgroundImageUrl(background) {
        return `./assets/backgrounds/${background.file}`;
    }

    function getBoardTextureImageUrl(texture) {
        return `./assets/board-textures/${texture.texture}`;
    }

    function getBoardTexturePreviewUrl(texture) {
        return `./assets/board-themes/${texture.preview}`;
    }

    function getPieceSkinImageUrl(pieceSkin, colorKey) {
        const safeColorKey = String(colorKey || "red").trim().toLowerCase();
        const safeIndex = String(pieceSkin.index || 1).padStart(2, "0");
        return `./assets/piece-skins/skin${safeIndex}_${safeColorKey}.webp`;
    }

    function applyColorTheme(theme) {
        const target = document.documentElement;
        const p1Main = theme.p1.hex;
        const p2Main = theme.p2.hex;
        const p1Light = tint(p1Main, 0.35);
        const p2Light = tint(p2Main, 0.35);
        const p1Dark = tint(p1Main, -0.35);
        const p2Dark = tint(p2Main, -0.35);

        target.style.setProperty("--p1-main", p1Main);
        target.style.setProperty("--p1-light", p1Light);
        target.style.setProperty("--p1-dark", p1Dark);
        target.style.setProperty("--p1-glow", toRgba(p1Main, 0.72));
        target.style.setProperty("--p1-preview", toRgba(p1Main, 0.64));

        target.style.setProperty("--p2-main", p2Main);
        target.style.setProperty("--p2-light", p2Light);
        target.style.setProperty("--p2-dark", p2Dark);
        target.style.setProperty("--p2-glow", toRgba(p2Main, 0.72));
        target.style.setProperty("--p2-preview", toRgba(p2Main, 0.64));
    }

    function applyBackgroundTheme(background) {
        const target = document.documentElement;
        target.style.setProperty("--play-bg-image", `url("${getBackgroundImageUrl(background)}")`);
    }

    function applyBoardTextureTheme(texture) {
        const target = document.documentElement;
        target.style.setProperty("--board-texture-image", `url("${getBoardTextureImageUrl(texture)}")`);
    }

    function applyPieceSkinTheme(pieceSkin, colorTheme) {
        const target = document.documentElement;
        const p1SkinUrl = `url("${getPieceSkinImageUrl(pieceSkin, colorTheme.p1.key)}")`;
        const p2SkinUrl = `url("${getPieceSkinImageUrl(pieceSkin, colorTheme.p2.key)}")`;
        target.style.setProperty("--p1-skin-image", p1SkinUrl);
        target.style.setProperty("--p2-skin-image", p2SkinUrl);
    }

    function applySelection(selection) {
        const normalized = normalizeSelection(selection);
        if (typeof Connect4Progression !== "undefined") {
            const highestUnlocked = Connect4Progression.loadProgress();
            if (!isBackgroundUnlocked(normalized.backgroundId, highestUnlocked)) {
                normalized.backgroundId = BACKGROUND_THEMES[0].id;
            }
            if (!isBoardTextureUnlocked(normalized.boardTextureId, highestUnlocked)) {
                normalized.boardTextureId = BOARD_TEXTURE_THEMES[0].id;
            }
        }
        if (typeof Connect4Economy !== "undefined" && !Connect4Economy.isPieceSkinOwned(normalized.pieceSkinId)) {
            normalized.pieceSkinId = PIECE_SKINS[0].id;
        }
        const colorTheme = getColorThemeById(normalized.colorThemeId);
        const background = getBackgroundById(normalized.backgroundId);
        const boardTexture = getBoardTextureById(normalized.boardTextureId);
        const pieceSkin = getPieceSkinById(normalized.pieceSkinId);
        applyColorTheme(colorTheme);
        applyBackgroundTheme(background);
        applyBoardTextureTheme(boardTexture);
        applyPieceSkinTheme(pieceSkin, colorTheme);
        return normalized;
    }

    return {
        getColorThemes,
        getColorThemeById,
        getBackgroundThemes,
        getBackgroundById,
        getBoardTextureThemes,
        getBoardTextureById,
        getPieceSkins,
        getPieceSkinById,
        getBackgroundUnlockThreshold,
        getBoardTextureUnlockThreshold,
        getBackgroundImageUrl,
        getBoardTextureImageUrl,
        getBoardTexturePreviewUrl,
        getPieceSkinImageUrl,
        getUnlockedBackgroundCount,
        getUnlockedBoardTextureCount,
        isBackgroundUnlocked,
        isBoardTextureUnlocked,
        getDefaultSelection,
        loadSelection,
        saveSelection,
        applySelection,
    };
})();
