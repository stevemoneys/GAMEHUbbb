# Neon Viper (GameHub) - Phase 1

This is the **Phase 1 foundation** for a premium, mobile-first Snake product.

## Phase 1 Scope
- Canvas board + neon grid
- Smooth snake movement (continuous, non-jumpy)
- Keyboard controls (`WASD` + arrow keys)
- Touch controls (buttons + swipe on canvas)
- Studio-grade modular architecture ready for expansion

## Current Structure
```text
snake2/
  index.html
  styles/main.css
  src/
    main.js
    config/gameConfig.js
    core/
      GameEngine.js
      GameState.js
      Vector2.js
    input/
      InputController.js
    rendering/
      CanvasRenderer.js
    systems/
      SnakeSystem.js
```

## Architecture Design (for scalability)
- `core/GameEngine.js`: own game loop, timing, pause state
- `systems/SnakeSystem.js`: own snake simulation and direction queue
- `rendering/CanvasRenderer.js`: own drawing only (no gameplay logic)
- `input/InputController.js`: own keyboard/touch input mapping
- `config/gameConfig.js`: tune speed, spacing, board size from one place

This keeps gameplay logic and UI/rendering decoupled, so we can cleanly add food, collisions, game modes, AI duel mode, progression, effects, and skins in later phases.

## Run
Open `index.html` in a browser.
