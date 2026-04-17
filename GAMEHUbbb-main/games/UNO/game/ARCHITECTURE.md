# UNO Game – Architecture

## Phase 1: Card Engine Foundation

- Card object: `color`, `value`, `type` (number | action | wild)
- Deck generation (108 cards)
- Shuffle algorithm
- Draw system
- Player hand array
- Turn state system

## Phase 2: Turn System & Rule Enforcement

- `isValidMove(card, topCard, context)` – rule gatekeeper
- Match by color, number, action; wild logic; +2 stacking
- Skip, Reverse, +2, +4 effects
- `getValidMoves()` – AI uses for legal plays only

## Phase 3: Game Flow System

- **TurnManager**: direction (clockwise/counter), current player, phase
- **Game phase**: `idle` | `playing` | `finished`
- **Win detection**: 0 cards left → game over, `winnerIndex` set
- **UNO call**: `callUno(playerIndex)`, `catchUno(byPlayerIndex)` – optional

## File Structure

```
game/
├── index.html
├── game.css
├── ARCHITECTURE.md
└── js/
    ├── card-engine.js   # Deck, shuffle, draw
    ├── rules.js         # isValidMove, getValidMoves
    ├── turn-manager.js  # Direction, current player, phase
    ├── game-state.js    # playCard, draw, win, UNO
    ├── ai.js            # getAIMove – only legal moves
    └── game.js          # Entry point
```

## Card Object

```js
{ id, color, value, type }
```

| Property | Values |
|----------|--------|
| `color` | `'red'` \| `'blue'` \| `'green'` \| `'yellow'` \| `null` (wild) |
| `value` | `"0"`-`"9"` \| `"skip"` \| `"reverse"` \| `"draw2"` \| `"wild"` \| `"wild4"` |
| `type` | `'number'` \| `'action'` \| `'wild'` |

## Deck (108 cards)

- 76 number (0×1 + 1–9×2 per color × 4)
- 24 action (Skip, Reverse, Draw Two × 2 each per color)
- 8 wild (4 Wild, 4 Wild Draw Four)

## Start Flow

Home page → **Start Match** → `game/index.html` (game starts)
