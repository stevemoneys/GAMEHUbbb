# Phase 02 - Unified Gameplay Flow & Mode Presentation

## 1. Status

**COMPLETE** for the approved implementation scope. Runtime verification is blocked by the existing browser GPU-process limitation and is documented below.

## 2. Summary

Phase 02 makes the existing experiences read as one game journey without adding any new gameplay. The home screen now signals a deliberate choice of experience, each destination has a distinct visual cue, hub transitions actively hide all other screens, and configured Competition/Experiment matches retain a temporary return destination. Exiting such a match or using its result return action now returns to the originating experience instead of always sending the player to Home.

## 3. Files Changed

| File | What changed | Why it was necessary |
| --- | --- | --- |
| `tic-tac-toe.html` | Added a non-interactive experience label and a distinct class for Two Players. | Clarifies the existing mode composition without adding a menu or mode. |
| `tic-tac-toe.css` | Added visual identity treatments for Local, Learn, Compete, and existing Experiment; refined shared hub cues. | Supports visual discovery over repeated identical card presentation. |
| `tic-tac-toe.js` | Added temporary return-destination lookup/control labels and parent-aware exit routing. | Makes configured-match exit/result return predictable while preserving normal Home return. |
| `tic-tac-toe-learning.js` | Expanded its local screen helper to hide Competition and Experiment too. | Prevents stale hub overlap on cross-experience entry. |
| `tic-tac-toe-competition.js` | Expanded its screen helper and sends `returnScreen: "competition"` to configured matches. | Keeps Competition as the logical parent after exit/result. |
| `tic-tac-toe-experimentation.js` | Sends `returnScreen: "experiment"` to its existing configured matches. | Contains existing cancelled 11.5E navigation without expanding it. |
| `PHASE-02-UNIFIED-GAMEPLAY-FLOW-REPORT.md` | This report. | Required Phase 02 deliverable. |

## 4. Existing Flow Before

- Home exposed all destinations but secondary experiences shared nearly identical card treatment.
- Learning and Competition each maintained a partial list of screens to hide; the lists did not consistently include every hub.
- The engine’s Phase 01 screen list hid all known screens before match entry, but runtime verification was unavailable.
- Configured Competition and Experiment matches had no parent-return context. `backToMenu()` therefore returned to Home even when the player had just entered from a closer experience.
- The existing Experiment hub remained reachable and data-backed, but should not become a primary discovery destination because its proposal is cancelled.

## 5. New Flow

```text
HOME
  -> AI Challenge -> Levels -> Symbol -> Match -> Result -> Replay / Home
  -> Two Players -> Match -> Result -> Replay / Home
  -> Learn -> Existing practice or review -> Back -> Home
  -> Compete -> Existing configured match -> Result / Exit -> Compete
  -> Experiment (existing, contained) -> Existing configured match -> Result / Exit -> Experiment
```

- Normal campaign and local matches keep their existing Home destination.
- Competition and Experiment return routing exists only in temporary match context; it is never persisted.
- Restart uses the existing fresh-board path. That path rebuilds match context, so stale parent context is not carried into a later fresh normal match.

## 6. Visual Communication Improvements

- Added a compact “Choose your experience” divider instead of explanatory copy or another screen.
- Gave Local, Learn, Compete, and Experiment distinct color/motif treatments while retaining one Phase 01 visual language.
- Replaced the visual reliance of three secondary action icons on text glyphs with CSS-built symbols.
- Kept AI Challenge as the hero action and visually subdued the existing cancelled Experiment destination without hiding it.
- Added matching accent rails/headings to existing Learning, Competition, and Experiment surfaces so destinations read as related but distinct spaces.

## 7. Navigation Fixes

| Area | Change |
| --- | --- |
| Back/Hub entry | Learning and Competition now toggle all eight known screen IDs, preventing another hub from remaining active. |
| Match entry | Existing central `hideAllScreens()` remains the sole engine entry helper and already hides all hubs. |
| Configured match exit | Competition/Experiment attach a temporary `returnScreen`; engine exit invokes that existing hub opener. |
| Result return | The existing result Home button changes its label/accessibility label to the active parent when applicable. |
| In-match exit | The existing Menu control changes to a parent-aware return label when applicable. |
| Replay | Existing engine restart behavior is retained; it resets board/timer/match context and does not persist a navigation stack. |
| Normal return | When no valid parent exists, existing Home/Menu behavior remains unchanged. |

## 8. Phase 00 Issues

The Phase 00 screen-transition issue is **partially verified**.

- **Static verification:** `hideAllScreens()` includes menu, levels, avatars, symbolSelect, game, learning, competition, and experiment. Learning/Competition local helpers now use the same full set. Configured match contexts are added after board reset and before presentation.
- **Runtime verification:** unavailable. Actual visual overlap/touch interception must still be checked in a working browser/device runtime.

## 9. Phase 01 Regression Results

| Area | Result | Evidence / limitation |
| --- | --- | --- |
| Premium homepage | PARTIAL | Phase 01 styling retained; Phase 02 adds visual grouping. No browser render. |
| AI Challenge setup | PARTIAL | Existing handlers and setup route unchanged by code review. |
| Gameplay/board/result | PARTIAL | No gameplay logic or result outcome logic changed; no runtime test. |
| Play Again / Next | PARTIAL | Existing functions retained; restart source path resets board/timer/context. |
| Learning entry | PARTIAL | Handler remains and screen helper is more complete. |
| Competition entry | PARTIAL | Handler remains and return context added. |
| Configured match transition | PARTIAL | Static state path checked; runtime blocked. |
| Mobile/responsive/reduced motion | PARTIAL | Existing Phase 01 breakpoints/rules retained; new CSS has narrow-screen rules. |

## 10. Runtime Verification

### Static verification

- Inspected all changed navigation code paths.
- Confirmed all screen helpers contain the same eight actual screen IDs.
- Confirmed configured Competition and Experiment starts attach only temporary return context.
- Confirmed `resetBoard()` calls `beginMatchContext()`, clearing stale context during restart.
- Confirmed no save-manager, save-schema, AI, timer, win/draw, or progression code was modified.
- `git diff --check` completed without patch errors.

### Runtime verification

**RUNTIME VERIFICATION BLOCKED.** Chrome and Edge headless attempts from Phase 01 fail before rendering with an unusable GPU process. Per the project’s verification rule, the same browser setup was not repeatedly run without new evidence. No game flow is claimed as browser-tested.

## 11. Save/Data Safety

- No storage key, schema, migration, normalizer, or save-manager file was changed.
- Return destination lives only in `gameState.match.context` during an active configured match.
- Progression, records, Learning data, Competition data, replay data, settings, and Experiment data were preserved.

## 12. Scope Audit

- Phase 03 was **not** implemented.
- No future roadmap feature, mode, AI behavior, rule, reward, or save system was implemented.
- Cancelled 11.5E was **not** revived or expanded; only its existing match return was contained.
- The game engine and navigation architecture were not rewritten; only narrow connection-level changes were made.
- No existing feature or data was deleted.

## 13. Known Limitations

1. Actual browser/device confirmation is still required for screen ownership, parent return, result return, replay, mobile portrait, desktop, landscape, focus, and rapid taps.
2. Existing Experiment functionality remains cancelled/unverified and is visually contained rather than removed.
3. The application still uses simple per-module screen helper arrays; they are now aligned, but a broader router is out of scope and was intentionally not added.

## 14. Phase 03 Readiness

Phase 02 implementation is complete. **Phase 03 readiness requires runtime verification** of the core normal, Learning, Competition, configured-match, return, and replay flows in a usable browser environment before a new gameplay system is introduced.
