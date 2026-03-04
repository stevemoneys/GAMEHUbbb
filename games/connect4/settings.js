(() => {
    const musicOnBtn = document.getElementById("musicOnBtn");
    const musicOffBtn = document.getElementById("musicOffBtn");
    const sfxOnBtn = document.getElementById("sfxOnBtn");
    const sfxOffBtn = document.getElementById("sfxOffBtn");

    if (
        !musicOnBtn ||
        !musicOffBtn ||
        !sfxOnBtn ||
        !sfxOffBtn ||
        typeof Connect4Settings === "undefined"
    ) {
        return;
    }

    function setPairState(onButton, offButton, isOn) {
        onButton.classList.toggle("toggle-btn--active", isOn);
        offButton.classList.toggle("toggle-btn--active", !isOn);
    }

    function render() {
        const settings = Connect4Settings.load();
        setPairState(musicOnBtn, musicOffBtn, settings.musicEnabled);
        setPairState(sfxOnBtn, sfxOffBtn, settings.sfxEnabled);
    }

    musicOnBtn.addEventListener("click", () => {
        Connect4Settings.save({ musicEnabled: true });
        render();
    });

    musicOffBtn.addEventListener("click", () => {
        Connect4Settings.save({ musicEnabled: false });
        render();
    });

    sfxOnBtn.addEventListener("click", () => {
        Connect4Settings.save({ sfxEnabled: true });
        render();
    });

    sfxOffBtn.addEventListener("click", () => {
        Connect4Settings.save({ sfxEnabled: false });
        render();
    });

    render();
})();
