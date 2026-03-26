# CHANGELOG — display-app Build Log

Tracks implementation progress, decisions, and failed attempts for the Tales9 display app.

---

## Session: 2026-03-27

### Setup Complete
- [x] CLAUDE.md written with React+TypeScript+PixiJS standards
- [x] CHANGELOG.md created
- [x] Vite 5 + React 18 + TypeScript scaffolded in `display-app/`
- [x] PixiJS 8, Zustand 5, React Router 7, Vitest 1, jsdom 22 installed
- [x] `npm test` wired up — `vitest run` required before every commit
- [x] `src/types/index.ts` — all domain types (DrinkProfile, Coaster, UserNode, Order, GameState, WsMessage)
- [x] `src/data/drinkCatalog.ts` — 4 drinks + quiz questions + `recommendDrink()` rule engine
- [x] `src/engine/CalibrationMapper.ts` — coordinate transform + centroid utility
- [x] `src/engine/TrackingEngine.ts` — 3-point coaster detection + lifecycle + debounce removal
- [x] `src/engine/InputAdapter.ts` — touch/mouse/websocket input abstraction
- [x] `src/engine/AnimationDispatcher.ts` — maps coaster → drink → animation command
- [x] `src/store/useAppStore.ts` — Zustand store (session, nodes, coasters, orders, game)
- [x] 28/28 tests passing

### Test Results
```
✓ drinkCatalog.test.ts     7 tests
✓ CalibrationMapper.test.ts  6 tests
✓ TrackingEngine.test.ts     6 tests
✓ useAppStore.test.ts        9 tests
Total: 28/28
```

### Next: React UI Layer
- [ ] `UserNode.tsx` — draggable node, auto-orientation, panel expand/collapse
- [ ] `HomeScreen.tsx`, `AboutScreen.tsx`, `MenuScreen.tsx`, `DrinkDetailModal.tsx`, `QuizFlow.tsx`, `OrderStatusPanel.tsx`
- [ ] `App.tsx` — router + session state wiring
- [ ] `PixiStage.tsx` — PixiJS Application wrapper
- [ ] `StandbyLayer.ts` — ambient idle animation
- [ ] `CoasterAnimation.ts` — per-drink visual effects
- [ ] `IngredientSprite.ts` — perimeter walking characters

---

## Session: 2026-03-27 (continued)

### React UI Layer + PixiJS Layer Complete

- [x] `src/types/index.ts` — added `coasterId: string | null` to `Order` interface
- [x] `src/__tests__/AnimationDispatcher.test.ts` — 9 new tests for subscribe/unsubscribe, detect/remove dispatch, multi-subscriber, re-assignment
- [x] `src/index.css` — full dark bar theme (CSS variables, user color classes, reset)
- [x] `index.html` — updated title to "Tales9 | Barcode"
- [x] `vite.config.ts` — added `/// <reference types="vitest/config" />` to fix tsc build
- [x] `src/engine/TrackingEngine.ts` — removed unused `Coaster` import (noUnusedLocals fix)
- [x] `src/pixi/StandbyLayer.ts` — 12 ambient drift blobs + touch-follow particle trail (PixiJS v8)
- [x] `src/pixi/CoasterAnimation.ts` — per-drink visual effects for all 4 animationFamily types
- [x] `src/pixi/IngredientSprite.ts` — spawn near coaster, drop to nearest edge, walk perimeter clockwise
- [x] `src/pixi/PixiStage.tsx` — single PIXI.Application owner, StrictMode-safe, reactive coaster sync
- [x] `src/components/PanelScreen.ts` — shared PanelScreen discriminated union type
- [x] `src/screens/screens.css` — full dark bar panel UI styles
- [x] `src/screens/HomeScreen.tsx` — Barcode logo, tagline, 3 nav cards (About/Quiz/Menu)
- [x] `src/screens/AboutScreen.tsx` — Our Story / Philosophy / What Makes Us Different
- [x] `src/screens/MenuScreen.tsx` — search, category filters, drink cards with DETAILS/ORDER
- [x] `src/screens/DrinkDetailModal.tsx` — full drink detail with hero image placeholder + ORDER
- [x] `src/screens/QuizFlow.tsx` — 4-question quiz with progress bar + result + ORDER/RETRY/MENU
- [x] `src/screens/OrderStatusPanel.tsx` — live order status (BEING PREPARED/ON THE WAY/HAS ARRIVED)
- [x] `src/components/UserNode.tsx` — draggable circle node, auto-orients toward canvas center, panel expand/collapse with counter-rotation
- [x] `src/App.tsx` — full rewrite: React Router, WebSocket SESSION/ORDER/COASTER events, PixiStage + UserNode overlay
- [x] 37/37 tests passing, `npm run build` clean

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        6 tests
✓ useAppStore.test.ts           9 tests
✓ AnimationDispatcher.test.ts   9 tests
Total: 37/37
```

### Failed Attempts
- `vite.config.ts` lacked `/// <reference types="vitest/config" />` — caused TS6133 error on `test` property during `tsc -b`. Fixed with triple-slash reference.
- Screen component `userColor` props unused by tsc strict mode (`noUnusedParameters`) — fixed with `_userColor` prefix convention.
- Unused `Coaster` import in `TrackingEngine.ts` flagged by `noUnusedLocals` — removed.

### Next: Integration Polish + Games Layer
- [ ] Wire `InputAdapter` to `TrackingEngine` in App.tsx for live touch → coaster tracking
- [ ] Connect `AnimationDispatcher` to store updates (COASTER_ASSIGN → assignDrink)
- [ ] `StandbyLayer.ts` — verify touch-follow works via PixiStage `onPointerMove` forwarding
- [ ] Truth or Dare game flow (CommonSpace spinning arrow → spotlight → broadcast)
- [ ] King's Game flow (crown selection → decree → roulette)
- [ ] Diagnostics overlay (touch points, coaster IDs, calibration values)
- [ ] Proximity detection for shared drink battle animations

---

<!-- New entries go here, newest first. Format:

## Session: YYYY-MM-DD

### Completed
- [x] Description of what was built
- [x] Test results: X/Y passing

### Failed Attempts
- Tried X, failed because Y. Used Z instead.

### Blocked
- Waiting on: [describe blocker]

-->
