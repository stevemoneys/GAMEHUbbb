(() => {
  const THEME_SKINS = [
    { id: "minimal", name: "Minimal Bronze", className: "theme-minimal", image: "images/card-skins/1.webp" },
    { id: "wood", name: "Royal Wood", className: "theme-wood", image: "images/card-skins/2.webp" },
    { id: "leather", name: "Dark Leather", className: "theme-leather", image: "images/card-skins/3.webp" },
    { id: "tribal", name: "Tribal Gold", className: "theme-tribal", image: "images/card-skins/4.webp" },
    { id: "gold", name: "Gold Crest", className: "theme-gold", image: "images/card-skins/5.webp" },
    { id: "royal", name: "Royal Court", className: "theme-royal", image: "images/card-skins/6.webp" },
    { id: "neon", name: "Neon Pulse", className: "theme-neon", image: "images/card-skins/7.webp" },
    { id: "magic", name: "Arcane Magic", className: "theme-magic", image: "images/card-skins/8.webp" },
    { id: "glass", name: "Crystal Glass", className: "theme-glass", image: "images/card-skins/9.webp" },
    { id: "fire", name: "Firestorm", className: "theme-fire", image: "images/card-skins/10.webp" },
    { id: "galaxy", name: "Galaxy Core", className: "theme-galaxy", image: "images/card-skins/11.webp" },
    { id: "shadow", name: "Shadow Void", className: "theme-shadow", image: "images/card-skins/12.webp" },
    { id: "diamond", name: "Diamond Elite", className: "theme-diamond", image: "images/card-skins/13.webp" },
    { id: "hypnotic", name: "Hypnotic", className: "theme-hypnotic", image: "images/card-skins/14.webp" },
    { id: "ancient", name: "Ancient Rune", className: "theme-ancient", image: "images/card-skins/15.webp" },
    { id: "energy", name: "Energy Flux", className: "theme-energy", image: "images/card-skins/16.png" },
    { id: "esports", name: "Esports Pro", className: "theme-esports", image: "images/card-skins/17.webp" },
    { id: "metal", name: "Forged Metal", className: "theme-metal", image: "images/card-skins/18.webp" },
    { id: "mythic", name: "Mythic Relic", className: "theme-mythic", image: "images/card-skins/19.webp" },
    { id: "god", name: "God Tier", className: "theme-god", image: "images/card-skins/20.webp" }
  ];

  window.WHThemeSkins = THEME_SKINS;
  window.WHPowerUps = [
    { id: "second-chance", name: "Second Chance", icon: "\u21BB", description: "Play 2 cards in one turn.", price: 380 },
    { id: "peek-ai", name: "Peek AI Cards", icon: "\u2315", description: "See one AI card briefly.", price: 320 },
    { id: "shield", name: "Shield", icon: "\u26E8", description: "Blocks Pick 2 / Pick 3 / Market.", price: 460 },
    { id: "magnet-draw", name: "Magnet Draw", icon: "\u{1F9F2}", description: "Draws guaranteed valid card.", price: 420 },
    { id: "destroy-card", name: "Destroy Card", icon: "\u2736", description: "Remove one bad card.", price: 520 },
    { id: "freeze-ai", name: "Freeze AI", icon: "\u23F8", description: "AI skips next turn.", price: 480 },
    { id: "double-effect", name: "Double Effect", icon: "\u{1F525}", description: "Next special effect x2.", price: 620 }
  ];
})();
