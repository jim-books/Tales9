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

## Session: 2026-03-27 (continued)

### Integration: TrackingEngine + InputAdapter wired into App.tsx

- [x] `src/App.tsx` — added `containerRef` on main container div; new `useEffect` creates `CalibrationMapper`, `TrackingEngine`, `AnimationDispatcher`, and `InputAdapter('touch', ...)` on mount
- [x] Touch frame callback: `tracker.processFrame(points)` → diffs active coaster IDs → calls `upsertCoaster` / `removeCoaster` on store + `dispatcher.onCoasterDetected` / `onCoasterRemoved` for animation events
- [x] `COASTER_ASSIGN` WS handler now also calls `dispatcherRef.current?.assignDrink()` so AnimationDispatcher stays in sync
- [x] 37/37 tests passing, `npm run build` clean (773 modules, 478kB bundle)

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        6 tests
✓ useAppStore.test.ts           9 tests
✓ AnimationDispatcher.test.ts   9 tests
Total: 37/37
```

### Next: Games Layer + Diagnostics
- [ ] Truth or Dare game flow (CommonSpace spinning arrow → spotlight → TRUTH/DARE broadcast)
- [ ] King's Game flow (crown selection → decree → roulette spotlight)
- [ ] Diagnostics overlay (touch points, coaster IDs, calibration values, animation states)
- [ ] Proximity detection for shared drink battle animations

---

## Session: 2026-03-27 (continued)

### Games Layer + Diagnostics + Proximity Detection Complete

- [x] `src/types/index.ts` — added `GAME_START { gameType }` and `GAME_END {}` to `WsMessage` union
- [x] `src/store/useAppStore.ts` — added `startGame(type)`, `advanceGame(phase, coasterId, userId)`, `endGame()` actions
- [x] `src/pixi/GameLayer.ts` — Truth or Dare: 4s ease-out spinning arrow; King's Game: crowns fly from centre to user positions, winner pulses; `showSpotlight()` / `hideSpotlight()` / `stop()`
- [x] `src/pixi/ProximityBattle.ts` — jagged lightning arc + midpoint glow between two coasters within 280 px; re-randomised every frame
- [x] `src/pixi/PixiStage.tsx` — GameLayer and ProximityBattle wired in; game state effect drives animation; proximity pairs tracked with `Map<pairKey, ProximityBattle>`
- [x] `src/screens/GameOverlay.tsx` — React overlay (z-10) shown at phase ≥ 1: TRUTH/DARE buttons for T&D, crown + decree for King's Game; calls `endGame()` on dismiss
- [x] `src/components/DiagnosticsOverlay.tsx` — dev panel (z-20) listing session, game state, coasters with centroids, user nodes, orders; toggle with 'D' key
- [x] `src/App.tsx` — handles `GAME_START` / `GAME_END` WS messages; 'D' key listener; renders `<GameOverlay />` and `<DiagnosticsOverlay />`
- [x] 41/41 tests passing, `npm run build` clean (777 modules, 488 kB bundle)

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        6 tests
✓ AnimationDispatcher.test.ts   9 tests
✓ useAppStore.test.ts          13 tests
Total: 41/41
```

### Next: Polish + Backend Integration
- [ ] iOS app: send `GAME_START` / `GAME_END` via Firestore → WebSocket bridge
- [ ] King's Game phase 2: king chooses a decree via their UserNode panel; roulette selects victim
- [ ] Swap 'D' key toggle for a secret corner-tap gesture (5 taps in top-right within 2s) for Android WebView
- [ ] Proximity battle: distinct animation per drink-pair (e.g. fiery vs icy collision)

---

## Session: 2026-04-10

### Frame-Based Ingredient Sprite System (Apple Tart)

- [x] `display-app/public/sprites/apple-tart/fall/Apple8bitFallSep{1..10}.png` — 10 fall keyframes copied from SpriteAnimation/AppleTart/
- [x] `display-app/public/sprites/apple-tart/walk/Apple8bitWalkSep{1..5}.png` — 5 walk keyframes copied
- [x] `src/pixi/SpriteAnimDef.ts` — `SpriteFrameSet` + `SpriteAnimDef` protocol interfaces; Apple Tart def (fall 10 frames ×2 loops, walk 5 frames ×∞); `spriteRegistry` Map; `getAllSpriteUrls()` for pre-loading
- [x] `src/pixi/FrameAnimPlayer.ts` — `AnimStateMachine` (pure TS, testable): FALL_ANIM → FALL_WAIT → WALK state machine with loop counting; `orientationForEdge()`: WalkEdge → scaleX/rotation for clockwise perimeter walk; `FrameAnimPlayer`: wraps two PixiJS `AnimatedSprite` instances (fall + walk), drives them via `autoUpdate=false` + manual `tick()`, swaps sprites on transition
- [x] `src/pixi/IngredientSprite.ts` — checks `spriteRegistry` at construction; uses `FrameAnimPlayer` when def found; `notifyPhysicsLanded()` called in `stepDrop()` on landing; `player.tick()` + `updateWalkOrientation()` called each frame; `body`/`label` made optional; procedural placeholder unchanged for unregistered characters
- [x] `src/pixi/PixiStage.tsx` — `.then()` made `async`; `await Assets.load(getAllSpriteUrls())` before rest of init; second `cancelled` guard added for StrictMode safety
- [x] `src/__tests__/SpriteRegistry.test.ts` — 25 tests: registry shape, frame counts, URL conventions, state machine transitions (FALL_ANIM/FALL_WAIT/WALK), orientation mapping for all 4 edges
- [x] 66/66 tests passing, `npm run build` clean (779 modules)

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        6 tests
✓ AnimationDispatcher.test.ts   9 tests
✓ useAppStore.test.ts          13 tests
✓ SpriteRegistry.test.ts       25 tests
Total: 66/66
```

### Next
- [ ] Manual QA: trigger apple-tart coaster via debug panel, verify fall animation plays 2× then walking begins
- [ ] Tune `animationSpeed` and `scale` values in `SpriteAnimDef.ts` after visual review
- [ ] Register remaining characters (peach, pineapple, coffee_bean) once assets are ready

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
