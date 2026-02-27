const STORAGE_KEYS = {
  profiles: "gamehub_profiles_v2",
  activeProfileId: "gamehub_active_profile_id_v2"
};

const state = {
  profiles: readProfiles(),
  activeProfileId: localStorage.getItem(STORAGE_KEYS.activeProfileId) || "",
  selectedGamePath: "",
  selectedGameName: "",
  toastTimer: null,
  profilePanelOpen: false
};

const el = {
  splash: document.getElementById("splashScreen"),
  enterHubBtn: document.getElementById("enterHubBtn"),
  gamesGrid: document.getElementById("gamesGrid"),
  modeModal: document.getElementById("modeModal"),
  modalTitle: document.getElementById("modalTitle"),
  offlineBtn: document.getElementById("offlineBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  toggleProfileBtn: document.getElementById("toggleProfileBtn"),
  profilePanel: document.getElementById("profilePanel"),
  profileForm: document.getElementById("profileForm"),
  profileName: document.getElementById("profileName"),
  profileAvatar: document.getElementById("profileAvatar"),
  profilePhoto: document.getElementById("profilePhoto"),
  photoPicker: document.getElementById("photoPicker"),
  photoHelp: document.getElementById("photoHelp"),
  activeProfile: document.getElementById("activeProfile"),
  profilesList: document.getElementById("profilesList"),
  profileCorner: document.getElementById("profileCorner"),
  toast: document.getElementById("toast")
};

init();

function init() {
  bindEvents();
  ensureActiveProfileValidity();
  applySplashPreference();
  renderProfiles();
}

function bindEvents() {
  el.enterHubBtn.addEventListener("click", () => {
    hideSplash();
  });

  el.gamesGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest(".play-btn");
    if (!trigger) {
      return;
    }

    const card = trigger.closest(".game-card");
    if (!card) {
      return;
    }

    const gamePath = card.dataset.gamePath || "";
    const gameName = card.dataset.gameName || "Game";
    openModal(gamePath, gameName);
  });

  el.offlineBtn.addEventListener("click", () => {
    if (!state.selectedGamePath) {
      showToast("No game selected.");
      return;
    }
    window.location.href = state.selectedGamePath;
  });

  el.closeModalBtn.addEventListener("click", closeModal);

  el.modeModal.addEventListener("click", (event) => {
    if (event.target === el.modeModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      if (state.profilePanelOpen) {
        setProfilePanelOpen(false);
      }
    }
  });

  el.toggleProfileBtn.addEventListener("click", () => {
    setProfilePanelOpen(!state.profilePanelOpen);
  });

  document.addEventListener("click", (event) => {
    if (!state.profilePanelOpen) {
      return;
    }

    const inside = el.profileCorner.contains(event.target);
    if (!inside) {
      setProfilePanelOpen(false);
    }
  });

  el.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createProfile();
  });

  el.profilePhoto.addEventListener("change", async () => {
    const file = el.profilePhoto.files && el.profilePhoto.files[0] ? el.profilePhoto.files[0] : null;
    if (!file) {
      setPhotoPickerPreview("");
      return;
    }

    const validType = typeof file.type === "string" && file.type.startsWith("image/");
    if (!validType) {
      showToast("Choose a valid image file.");
      el.profilePhoto.value = "";
      setPhotoPickerPreview("");
      return;
    }

    if (file.size > 1_500_000) {
      showToast("Image too large. Keep it under 1.5MB.");
      el.profilePhoto.value = "";
      setPhotoPickerPreview("");
      return;
    }

    try {
      const preview = await readFileAsDataUrl(file);
      setPhotoPickerPreview(preview);
    } catch (_) {
      showToast("Could not read selected image.");
      el.profilePhoto.value = "";
      setPhotoPickerPreview("");
    }
  });
}

function setProfilePanelOpen(open) {
  state.profilePanelOpen = open;
  el.profilePanel.classList.toggle("open", open);
  el.profilePanel.setAttribute("aria-hidden", open ? "false" : "true");
  el.toggleProfileBtn.textContent = open ? "Close Profile" : "Profile";
}

async function createProfile() {
  const name = el.profileName.value.trim();
  const avatar = el.profileAvatar.value || "🕹️";
  const file = el.profilePhoto.files && el.profilePhoto.files[0] ? el.profilePhoto.files[0] : null;

  if (!name) {
    showToast("Enter a profile name.");
    return;
  }

  const normalized = name.toLowerCase();
  const duplicate = state.profiles.some((profile) => profile.name.toLowerCase() === normalized);
  if (duplicate) {
    showToast("Profile name already exists.");
    return;
  }

  let photoData = "";
  if (file) {
    const validType = typeof file.type === "string" && file.type.startsWith("image/");
    if (!validType) {
      showToast("Choose a valid image file.");
      return;
    }

    if (file.size > 1_500_000) {
      showToast("Image too large. Keep it under 1.5MB.");
      return;
    }

    try {
      photoData = await readFileAsDataUrl(file);
    } catch (_) {
      showToast("Could not read selected image.");
      return;
    }
  }

  const profile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    avatar,
    photoData,
    createdAt: Date.now()
  };

  state.profiles.push(profile);
  state.activeProfileId = profile.id;

  const saved = persistProfiles();
  if (!saved) {
    state.profiles.pop();
    showToast("Could not save profile. Try a smaller image.");
    return;
  }

  persistActiveProfile();
  renderProfiles();

  el.profileForm.reset();
  el.profileAvatar.value = "🕹️";
  setPhotoPickerPreview("");
  showToast(`Profile ${name} saved.`);
}

function renderProfiles() {
  const active = getActiveProfile();

  if (!state.profiles.length) {
    el.activeProfile.classList.add("empty");
    el.activeProfile.textContent = "No active profile selected.";
    el.profilesList.innerHTML = "";
    return;
  }

  if (active) {
    el.activeProfile.classList.remove("empty");
    const avatarText = active.photoData ? "Photo" : active.avatar;
    el.activeProfile.textContent = `Active: ${avatarText} ${active.name}`;
  }

  const cards = state.profiles
    .map((profile) => {
      const escapedName = escapeHtml(profile.name);
      const isActive = profile.id === state.activeProfileId;
      const avatarHtml = profile.photoData
        ? `<span class="avatar"><img alt="${escapedName}" src="${profile.photoData}"></span>`
        : `<span class="avatar" aria-hidden="true">${profile.avatar}</span>`;

      return `
        <article class="profile-card" data-profile-id="${profile.id}">
          <div class="profile-meta">
            ${avatarHtml}
            <strong class="profile-name">${escapedName}${isActive ? " (Active)" : ""}</strong>
          </div>
          <div class="profile-actions">
            <button class="use-btn" type="button">Use</button>
            <button class="delete-btn" type="button">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");

  el.profilesList.innerHTML = cards;

  el.profilesList.querySelectorAll(".profile-card").forEach((card) => {
    const profileId = card.dataset.profileId;
    const useBtn = card.querySelector(".use-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    useBtn.addEventListener("click", () => setActiveProfile(profileId));
    deleteBtn.addEventListener("click", () => deleteProfile(profileId));
  });
}

function setActiveProfile(profileId) {
  state.activeProfileId = profileId;
  persistActiveProfile();
  renderProfiles();

  const profile = getActiveProfile();
  if (profile) {
    showToast(`Now playing as ${profile.name}.`);
  }
}

function deleteProfile(profileId) {
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (!profile) {
    return;
  }

  const confirmed = window.confirm(`Delete profile ${profile.name}?`);
  if (!confirmed) {
    return;
  }

  state.profiles = state.profiles.filter((entry) => entry.id !== profileId);

  if (state.activeProfileId === profileId) {
    state.activeProfileId = state.profiles[0]?.id || "";
  }

  persistProfiles();
  persistActiveProfile();
  renderProfiles();
  showToast(`Deleted profile ${profile.name}.`);
}

function openModal(gamePath, gameName) {
  const active = getActiveProfile();
  if (!active) {
    showToast("Create or select a profile first.");
    setProfilePanelOpen(true);
    el.profileName.focus();
    return;
  }

  state.selectedGamePath = gamePath;
  state.selectedGameName = gameName;
  el.modalTitle.textContent = `${gameName} - Select Mode`;
  el.modeModal.classList.add("show");
  el.modeModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  el.modeModal.classList.remove("show");
  el.modeModal.setAttribute("aria-hidden", "true");
}

function applySplashPreference() {
  showSplash();
}

function showSplash() {
  el.splash.classList.remove("hidden");
  el.splash.setAttribute("aria-hidden", "false");
}

function hideSplash(instant) {
  if (instant) {
    el.splash.classList.add("hidden");
    el.splash.setAttribute("aria-hidden", "true");
    return;
  }

  el.splash.classList.add("hidden");
  el.splash.setAttribute("aria-hidden", "true");
}

function readProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profiles);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => {
      return typeof entry?.id === "string" && typeof entry?.name === "string";
    });
  } catch (_) {
    return [];
  }
}

function persistProfiles() {
  try {
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(state.profiles));
    return true;
  } catch (_) {
    return false;
  }
}

function persistActiveProfile() {
  if (state.activeProfileId) {
    localStorage.setItem(STORAGE_KEYS.activeProfileId, state.activeProfileId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeProfileId);
  }
}

function ensureActiveProfileValidity() {
  if (!state.profiles.length) {
    state.activeProfileId = "";
    persistActiveProfile();
    return;
  }

  const exists = state.profiles.some((profile) => profile.id === state.activeProfileId);
  if (!exists) {
    state.activeProfileId = state.profiles[0].id;
    persistActiveProfile();
  }
}

function getActiveProfile() {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || null;
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");

  if (state.toastTimer) {
    clearTimeout(state.toastTimer);
  }

  state.toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("show");
  }, 1800);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function setPhotoPickerPreview(src) {
  if (!el.photoPicker) return;

  const old = el.photoPicker.querySelector("img");
  if (old) {
    old.remove();
  }

  if (!src) {
    el.photoPicker.classList.remove("has-preview");
    if (el.photoHelp) el.photoHelp.textContent = "Tap to upload photo";
    return;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Selected profile photo";
  el.photoPicker.appendChild(img);
  el.photoPicker.classList.add("has-preview");
  if (el.photoHelp) el.photoHelp.textContent = "Photo selected";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
