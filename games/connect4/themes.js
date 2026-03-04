(() => {
    const EFFECT_SHOP = [
        {
            id: "undo",
            name: "Undo",
            description: "Reverts last move.",
            price: 240,
            iconPath: "M7 7V3L2 8l5 5V9h5a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z",
        },
        {
            id: "hint",
            name: "Hint",
            description: "Highlights best move.",
            price: 180,
            iconPath: "M9 21h6v-1H9Zm3-19a7 7 0 0 0-4 12.75V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.25A7 7 0 0 0 12 2Z",
        },
        {
            id: "threat_alert",
            name: "Threat Alert",
            description: "Glows red if opponent can win next move.",
            price: 210,
            iconPath: "M1 21h22L12 2Zm12-3h-2v2h2Zm0-8h-2v6h2Z",
        },
        {
            id: "safe_move",
            name: "Safe Move",
            description: "Subtle glow on safe positions.",
            price: 195,
            iconPath: "M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10Z",
        },
    ];

    const colorViewport = document.getElementById("colorViewport");
    const bgViewport = document.getElementById("bgViewport");
    const boardViewport = document.getElementById("boardViewport");
    const skinViewport = document.getElementById("skinViewport");
    const colorPrevButton = document.getElementById("colorPrev");
    const colorNextButton = document.getElementById("colorNext");
    const bgPrevButton = document.getElementById("bgPrev");
    const bgNextButton = document.getElementById("bgNext");
    const boardPrevButton = document.getElementById("boardPrev");
    const boardNextButton = document.getElementById("boardNext");
    const skinPrevButton = document.getElementById("skinPrev");
    const skinNextButton = document.getElementById("skinNext");
    const fxViewport = document.getElementById("fxViewport");
    const fxPrevButton = document.getElementById("fxPrev");
    const fxNextButton = document.getElementById("fxNext");
    const progressBadge = document.getElementById("progressBadge");

    if (
        !colorViewport ||
        !bgViewport ||
        !boardViewport ||
        !skinViewport ||
        !fxViewport ||
        !colorPrevButton ||
        !colorNextButton ||
        !bgPrevButton ||
        !bgNextButton ||
        !boardPrevButton ||
        !boardNextButton ||
        !skinPrevButton ||
        !skinNextButton ||
        !fxPrevButton ||
        !fxNextButton ||
        !progressBadge ||
        typeof Connect4Themes === "undefined"
    ) {
        return;
    }

    let colorIndex = 0;
    let backgroundPage = 0;
    let boardTexturePage = 0;
    let pieceSkinPage = 0;
    let effectsPage = 0;

    function getHighestUnlockedStage() {
        if (typeof Connect4Progression === "undefined") {
            return 1;
        }
        return Connect4Progression.loadProgress();
    }

    function isPieceSkinOwned(skinId) {
        if (typeof Connect4Economy === "undefined") {
            return skinId === "skin01";
        }
        return Connect4Economy.isPieceSkinOwned(skinId);
    }

    function getCoins() {
        if (typeof Connect4Economy === "undefined") {
            return 0;
        }
        return Connect4Economy.getCoins();
    }

    function renderColorCarousel() {
        const themes = Connect4Themes.getColorThemes();
        const selection = Connect4Themes.loadSelection();
        const theme = themes[colorIndex];

        colorViewport.innerHTML = "";
        const card = document.createElement("article");
        card.className = "color-card";

        const isActive = selection.colorThemeId === theme.id;

        const head = document.createElement("header");
        head.className = "color-card__head";
        const left = document.createElement("div");
        left.innerHTML = `<h3>${theme.name}</h3><p>${theme.description}</p>`;
        const activeLabel = document.createElement("div");
        activeLabel.className = "active-label";
        activeLabel.textContent = isActive ? "Active Set" : "Set Preview";
        head.appendChild(left);
        head.appendChild(activeLabel);
        card.appendChild(head);

        const pair = document.createElement("div");
        pair.className = "color-pair";
        pair.appendChild(createColorSlot("Player 1", theme.p1.name, theme.p1.hex));
        pair.appendChild(createColorSlot("Player 2", theme.p2.name, theme.p2.hex));
        card.appendChild(pair);

        const actions = document.createElement("div");
        actions.className = "actions";

        const useButton = document.createElement("button");
        useButton.type = "button";
        useButton.className = "theme-btn theme-btn--use";
        useButton.textContent = "Use";
        useButton.addEventListener("click", () => {
            const current = Connect4Themes.loadSelection();
            Connect4Themes.saveSelection({
                colorThemeId: theme.id,
                humanPlayer: current.humanPlayer,
                backgroundId: current.backgroundId,
                boardTextureId: current.boardTextureId,
                pieceSkinId: current.pieceSkinId,
            });
            renderAll();
        });

        const playButton = document.createElement("button");
        playButton.type = "button";
        playButton.className = "theme-btn theme-btn--play";
        const activeSide = selection.colorThemeId === theme.id ? selection.humanPlayer : 1;
        playButton.textContent = `Play as ${activeSide === 1 ? theme.p1.name : theme.p2.name}`;
        playButton.addEventListener("click", () => {
            const current = Connect4Themes.loadSelection();
            const sameTheme = current.colorThemeId === theme.id;
            const nextSide = sameTheme ? (current.humanPlayer === 1 ? 2 : 1) : current.humanPlayer;
            Connect4Themes.saveSelection({
                colorThemeId: theme.id,
                humanPlayer: nextSide,
                backgroundId: current.backgroundId,
                boardTextureId: current.boardTextureId,
                pieceSkinId: current.pieceSkinId,
            });
            renderAll();
        });

        actions.appendChild(useButton);
        actions.appendChild(playButton);
        card.appendChild(actions);
        colorViewport.appendChild(card);
    }

    function createColorSlot(label, name, hex) {
        const slot = document.createElement("div");
        slot.className = "slot";

        const swatch = document.createElement("div");
        swatch.className = "slot__swatch";
        swatch.style.setProperty("--swatch", hex);

        const meta = document.createElement("div");
        meta.className = "slot__meta";
        meta.textContent = label;

        const value = document.createElement("div");
        value.className = "slot__value";
        value.textContent = `${name} ${hex}`;

        slot.appendChild(swatch);
        slot.appendChild(meta);
        slot.appendChild(value);
        return slot;
    }

    function renderBackgroundCarousel() {
        const backgrounds = Connect4Themes.getBackgroundThemes();
        const selection = Connect4Themes.loadSelection();
        const highestUnlockedStage = getHighestUnlockedStage();
        const totalPages = Math.ceil(backgrounds.length / 2);
        backgroundPage = Math.max(0, Math.min(backgroundPage, totalPages - 1));

        bgViewport.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "bg-grid";

        const start = backgroundPage * 2;
        const currentTwo = backgrounds.slice(start, start + 2);

        for (let i = 0; i < currentTwo.length; i += 1) {
            const bg = currentTwo[i];
            const index = start + i;
            const unlocked = Connect4Themes.isBackgroundUnlocked(bg.id, highestUnlockedStage);
            const unlockAt = Connect4Themes.getBackgroundUnlockThreshold(index);
            const isActive = selection.backgroundId === bg.id;

            const card = document.createElement("article");
            card.className = "bg-card";
            if (!unlocked) {
                card.classList.add("bg-card--locked");
            }
            if (isActive) {
                card.classList.add("bg-card--active");
            }

            const previewWrap = document.createElement("div");
            previewWrap.className = "bg-preview-wrap";

            const preview = document.createElement("img");
            preview.className = "bg-preview";
            preview.alt = bg.name;
            preview.src = Connect4Themes.getBackgroundImageUrl(bg);
            preview.loading = "lazy";
            previewWrap.appendChild(preview);

            if (!unlocked) {
                const lock = document.createElement("div");
                lock.className = "lock-overlay";
                lock.textContent = "\uD83D\uDD12";
                previewWrap.appendChild(lock);
            }

            const name = document.createElement("div");
            name.className = "bg-name";
            name.textContent = `${index + 1}. ${bg.name}`;

            const unlockMeta = document.createElement("div");
            unlockMeta.className = "unlock-meta";
            unlockMeta.textContent = unlocked
                ? "Unlocked"
                : `Unlock: Level ${unlockAt.level} Stage ${unlockAt.stage}`;

            const useButton = document.createElement("button");
            useButton.type = "button";
            useButton.className = "bg-use-btn";
            useButton.textContent = isActive ? "In Use" : "Use";
            useButton.disabled = !unlocked;
            useButton.addEventListener("click", () => {
                const current = Connect4Themes.loadSelection();
                Connect4Themes.saveSelection({
                    colorThemeId: current.colorThemeId,
                    humanPlayer: current.humanPlayer,
                    backgroundId: bg.id,
                    boardTextureId: current.boardTextureId,
                    pieceSkinId: current.pieceSkinId,
                });
                renderAll();
            });

            card.appendChild(previewWrap);
            card.appendChild(name);
            card.appendChild(unlockMeta);
            card.appendChild(useButton);
            grid.appendChild(card);
        }

        bgViewport.appendChild(grid);
    }

    function renderBoardTextureCarousel() {
        const textures = Connect4Themes.getBoardTextureThemes();
        const selection = Connect4Themes.loadSelection();
        const highestUnlockedStage = getHighestUnlockedStage();
        const totalPages = Math.ceil(textures.length / 2);
        boardTexturePage = Math.max(0, Math.min(boardTexturePage, totalPages - 1));

        boardViewport.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "bg-grid";

        const start = boardTexturePage * 2;
        const currentTwo = textures.slice(start, start + 2);

        for (let i = 0; i < currentTwo.length; i += 1) {
            const texture = currentTwo[i];
            const index = start + i;
            const unlocked = Connect4Themes.isBoardTextureUnlocked(texture.id, highestUnlockedStage);
            const unlockAt = Connect4Themes.getBoardTextureUnlockThreshold(index);
            const isActive = selection.boardTextureId === texture.id;

            const card = document.createElement("article");
            card.className = "bg-card";
            if (!unlocked) {
                card.classList.add("bg-card--locked");
            }
            if (isActive) {
                card.classList.add("bg-card--active");
            }

            const previewWrap = document.createElement("div");
            previewWrap.className = "bg-preview-wrap";

            const preview = document.createElement("img");
            preview.className = "bg-preview";
            preview.alt = texture.name;
            preview.src = Connect4Themes.getBoardTexturePreviewUrl(texture);
            preview.loading = "lazy";
            previewWrap.appendChild(preview);
            if (!unlocked) {
                const lock = document.createElement("div");
                lock.className = "lock-overlay";
                lock.textContent = "\uD83D\uDD12";
                previewWrap.appendChild(lock);
            }

            const name = document.createElement("div");
            name.className = "bg-name";
            name.textContent = `${index + 1}. ${texture.name}`;

            const unlockMeta = document.createElement("div");
            unlockMeta.className = "unlock-meta";
            unlockMeta.textContent = unlocked
                ? "Unlocked"
                : `Unlock: Reach Level ${unlockAt.level}`;

            const useButton = document.createElement("button");
            useButton.type = "button";
            useButton.className = "bg-use-btn";
            useButton.textContent = isActive ? "In Use" : "Use";
            useButton.disabled = !unlocked;
            useButton.addEventListener("click", () => {
                const current = Connect4Themes.loadSelection();
                Connect4Themes.saveSelection({
                    colorThemeId: current.colorThemeId,
                    humanPlayer: current.humanPlayer,
                    backgroundId: current.backgroundId,
                    boardTextureId: texture.id,
                    pieceSkinId: current.pieceSkinId,
                });
                renderAll();
            });

            card.appendChild(previewWrap);
            card.appendChild(name);
            card.appendChild(unlockMeta);
            card.appendChild(useButton);
            grid.appendChild(card);
        }

        boardViewport.appendChild(grid);
    }

    function createSkinDisc(skinUrl) {
        const disc = document.createElement("div");
        disc.className = "piece-preview-disc";
        disc.style.setProperty("--skin-image", `url("${skinUrl}")`);
        return disc;
    }

    function renderPieceSkinCarousel() {
        const skins = Connect4Themes.getPieceSkins();
        const selection = Connect4Themes.loadSelection();
        const colorTheme = Connect4Themes.getColorThemeById(selection.colorThemeId);
        const totalPages = Math.ceil(skins.length / 2);
        pieceSkinPage = Math.max(0, Math.min(pieceSkinPage, totalPages - 1));

        skinViewport.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "bg-grid";

        const start = pieceSkinPage * 2;
        const currentTwo = skins.slice(start, start + 2);

        for (let i = 0; i < currentTwo.length; i += 1) {
            const skin = currentTwo[i];
            const index = start + i;
            const owned = isPieceSkinOwned(skin.id);
            const isActive = selection.pieceSkinId === skin.id;

            const card = document.createElement("article");
            card.className = "bg-card";
            if (!owned) {
                card.classList.add("bg-card--locked");
            }
            if (isActive) {
                card.classList.add("bg-card--active");
            }

            const previewWrap = document.createElement("div");
            previewWrap.className = "piece-preview-wrap";
            if (!owned) {
                previewWrap.classList.add("piece-preview-wrap--locked");
            }

            const duo = document.createElement("div");
            duo.className = "piece-preview-duo";
            const p1SkinUrl = Connect4Themes.getPieceSkinImageUrl(skin, colorTheme.p1.key);
            const p2SkinUrl = Connect4Themes.getPieceSkinImageUrl(skin, colorTheme.p2.key);
            duo.appendChild(createSkinDisc(p1SkinUrl));
            duo.appendChild(createSkinDisc(p2SkinUrl));
            previewWrap.appendChild(duo);

            if (!owned) {
                const lock = document.createElement("div");
                lock.className = "lock-overlay";
                lock.textContent = "\uD83D\uDD12";
                previewWrap.appendChild(lock);
            }

            const name = document.createElement("div");
            name.className = "bg-name";
            name.textContent = `${index + 1}. ${skin.name}`;

            const unlockMeta = document.createElement("div");
            unlockMeta.className = "unlock-meta";
            unlockMeta.textContent = owned ? "Owned" : `Price: ${skin.price} coins`;

            const actions = document.createElement("div");
            actions.className = "piece-actions";

            const buyButton = document.createElement("button");
            buyButton.type = "button";
            buyButton.className = "skin-buy-btn";
            buyButton.textContent = owned ? "Owned" : `Buy ${skin.price}`;
            buyButton.disabled = owned;
            buyButton.addEventListener("click", () => {
                if (typeof Connect4Economy === "undefined") {
                    return;
                }
                const purchase = Connect4Economy.purchasePieceSkin(skin.id, skin.price);
                if (purchase.purchased) {
                    renderAll();
                    return;
                }
                unlockMeta.textContent = purchase.reason === "insufficient_coins"
                    ? "Not enough coins"
                    : "Purchase failed";
            });

            const useButton = document.createElement("button");
            useButton.type = "button";
            useButton.className = "skin-use-btn";
            useButton.textContent = isActive ? "In Use" : "Use";
            useButton.disabled = !owned;
            useButton.addEventListener("click", () => {
                if (!owned) {
                    return;
                }
                const current = Connect4Themes.loadSelection();
                Connect4Themes.saveSelection({
                    colorThemeId: current.colorThemeId,
                    humanPlayer: current.humanPlayer,
                    backgroundId: current.backgroundId,
                    boardTextureId: current.boardTextureId,
                    pieceSkinId: skin.id,
                });
                renderAll();
            });

            actions.appendChild(buyButton);
            actions.appendChild(useButton);

            card.appendChild(previewWrap);
            card.appendChild(name);
            card.appendChild(unlockMeta);
            card.appendChild(actions);
            grid.appendChild(card);
        }

        skinViewport.appendChild(grid);
    }

    function renderEffectsCarousel() {
        const totalPages = Math.ceil(EFFECT_SHOP.length / 2);
        effectsPage = Math.max(0, Math.min(effectsPage, totalPages - 1));
        const coins = getCoins();
        fxViewport.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "bg-grid";
        const start = effectsPage * 2;
        const currentTwo = EFFECT_SHOP.slice(start, start + 2);

        for (let i = 0; i < currentTwo.length; i += 1) {
            const effect = currentTwo[i];
            const count = typeof Connect4Economy === "undefined" ? 0 : Connect4Economy.getEffectCount(effect.id);
            const canAfford = coins >= effect.price;

            const card = document.createElement("article");
            card.className = "effect-card";

            const head = document.createElement("div");
            head.className = "effect-card__head";
            const name = document.createElement("div");
            name.className = "effect-name";
            name.textContent = effect.name;
            const countBadge = document.createElement("div");
            countBadge.className = "effect-count";
            countBadge.textContent = `Owned: ${count}`;
            head.appendChild(name);
            head.appendChild(countBadge);

            const iconWrap = document.createElement("div");
            iconWrap.className = "effect-icon-wrap";
            iconWrap.innerHTML = `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="${effect.iconPath}"></path></svg>`;

            const desc = document.createElement("div");
            desc.className = "effect-desc";
            desc.textContent = effect.description;

            const buyButton = document.createElement("button");
            buyButton.type = "button";
            buyButton.className = "effect-buy-btn";
            buyButton.textContent = `Buy ${effect.price}`;
            buyButton.disabled = typeof Connect4Economy === "undefined" || !canAfford;
            buyButton.addEventListener("click", () => {
                if (typeof Connect4Economy === "undefined") {
                    return;
                }
                Connect4Economy.purchaseEffect(effect.id, effect.price, 1);
                renderAll();
            });

            card.appendChild(head);
            card.appendChild(iconWrap);
            card.appendChild(desc);
            card.appendChild(buyButton);
            grid.appendChild(card);
        }

        fxViewport.appendChild(grid);
    }

    function bindEvents() {
        colorPrevButton.addEventListener("click", () => {
            const themes = Connect4Themes.getColorThemes();
            colorIndex = (colorIndex - 1 + themes.length) % themes.length;
            renderColorCarousel();
        });

        colorNextButton.addEventListener("click", () => {
            const themes = Connect4Themes.getColorThemes();
            colorIndex = (colorIndex + 1) % themes.length;
            renderColorCarousel();
        });

        bgPrevButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getBackgroundThemes().length / 2);
            backgroundPage = (backgroundPage - 1 + totalPages) % totalPages;
            renderBackgroundCarousel();
        });

        bgNextButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getBackgroundThemes().length / 2);
            backgroundPage = (backgroundPage + 1) % totalPages;
            renderBackgroundCarousel();
        });

        boardPrevButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getBoardTextureThemes().length / 2);
            boardTexturePage = (boardTexturePage - 1 + totalPages) % totalPages;
            renderBoardTextureCarousel();
        });

        boardNextButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getBoardTextureThemes().length / 2);
            boardTexturePage = (boardTexturePage + 1) % totalPages;
            renderBoardTextureCarousel();
        });

        skinPrevButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getPieceSkins().length / 2);
            pieceSkinPage = (pieceSkinPage - 1 + totalPages) % totalPages;
            renderPieceSkinCarousel();
        });

        skinNextButton.addEventListener("click", () => {
            const totalPages = Math.ceil(Connect4Themes.getPieceSkins().length / 2);
            pieceSkinPage = (pieceSkinPage + 1) % totalPages;
            renderPieceSkinCarousel();
        });

        fxPrevButton.addEventListener("click", () => {
            const totalPages = Math.ceil(EFFECT_SHOP.length / 2);
            effectsPage = (effectsPage - 1 + totalPages) % totalPages;
            renderEffectsCarousel();
        });

        fxNextButton.addEventListener("click", () => {
            const totalPages = Math.ceil(EFFECT_SHOP.length / 2);
            effectsPage = (effectsPage + 1) % totalPages;
            renderEffectsCarousel();
        });
    }

    function renderAll() {
        const highest = getHighestUnlockedStage();
        const total = typeof Connect4Progression === "undefined" ? 100 : Connect4Progression.TOTAL_STAGES;
        progressBadge.textContent = `${highest} / ${total}`;
        renderColorCarousel();
        renderBackgroundCarousel();
        renderBoardTextureCarousel();
        renderPieceSkinCarousel();
        renderEffectsCarousel();
    }

    bindEvents();
    renderAll();
})();
