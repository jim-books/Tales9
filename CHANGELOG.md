# CHANGELOG — display-app Build Log

Tracks implementation progress, decisions, and failed attempts for the Tales9 display app.

---

## Session: 2026-04-15

### Completed
- [x] `npm run build` rerun clean after moving coaster input off the app root and broadening panel press fallbacks (`tsc -b && vite build`; existing >500 kB chunk warning remains pre-existing)
- [x] `npm test` rerun clean after panel interaction routing + shared press fallback updates (`87/87` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/screens/GamePortalScreen.tsx` — switched game-launch cards and back navigation to the shared press helper so the in-panel game portal remains usable under multi-touch conditions
- [x] `display-app/src/screens/OrderStatusPanel.tsx` — switched orders-panel navigation actions to the shared press helper so empty-state and back navigation remain touchable with coasters present
- [x] `display-app/src/screens/QuizFlow.tsx` — moved quiz answer/back/result actions onto the shared press helper so the full quiz flow no longer depends on synthesized `click`
- [x] `display-app/src/screens/DrinkDetailModal.tsx` — switched detail-view back/order actions to the shared press helper so drink actions still fire when coaster touches are held on the table
- [x] `display-app/src/screens/AboutScreen.tsx` — switched the back action to the shared press helper so About remains navigable under persistent coaster touches
- [x] `display-app/src/screens/HomeScreen.tsx` — switched home-card navigation to the shared press helper so panel entry points no longer rely on synthesized `click`
- [x] `display-app/src/screens/usePressAction.ts` — added a shared pointer-press helper that falls back from unreliable multi-touch `click` synthesis while suppressing duplicate click activation
- [x] `display-app/src/components/UserNode.tsx` — expanded panel touch isolation: wrapper uses `pointerEvents: auto` + touch `stopPropagation`, and the inner panel surface still stops touch bubbling so UI gestures do not feed root-level tracking listeners
- [x] `display-app/src/App.tsx` — moved `InputAdapter` attachment from the top-level app root to the Pixi common-space surface, preventing panel touches from entering coaster tracking through the root bubble path
- [x] `display-app/src/pixi/PixiStage.tsx` — exposed the Pixi surface wrapper via `onTrackingSurfaceReady()` so coaster input can be attached to the common-space layer instead of the app root
- [x] `display-app/src/screens/MenuScreen.tsx` — added pointer-press fallback (`onPointerUp`) for category/details/order actions with short click-suppression window to prevent double-fire while keeping keyboard/mouse `onClick` support
- [x] `display-app/src/screens/screens.css` — hardened panel scrolling for Android WebView by adding `min-height: 0` and `touch-action: pan-y` on `.screen-body`
- [x] `npm test -- src/__tests__/` rerun clean after per-node game popup refactor (`87/87` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/GameOverlay.test.tsx` — added focused coverage ensuring per-node game popups render notifications for everyone but actions only for the chosen user
- [x] `display-app/src/screens/GameOverlay.tsx` — replaced center common-space game card with per-user popups rendered next to each node; only the chosen user receives action buttons while others see notification-only cards
- [x] `npm test -- src/__tests__/` rerun clean after correcting top/bottom side placement logic (`85/85` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/UserNode.test.tsx` — updated coverage for corrected top/bottom rotations and new side-by-side anchor behavior for top/bottom nodes
- [x] `display-app/src/components/UserNode.tsx` — reverted mistaken top/bottom rotation flip and changed top/bottom panel anchoring to side-by-side placement next to the node (matching left/right interaction logic)
- [x] `npm test -- src/__tests__/` rerun clean after autoplay + top/bottom orientation adjustments (`85/85` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/UserNode.test.tsx` — updated top/bottom rotation expectations to match revised edge-facing behavior
- [x] `display-app/src/screens/MenuScreen.tsx` + `display-app/src/screens/screens.css` — switched drink media from tap-to-play to default auto-play loop once in-view (lazy-loaded), and removed click-only media wrapper semantics
- [x] `display-app/src/components/UserNode.tsx` — swapped top/bottom edge rotation semantics (`top=0`, `bottom=180`) while keeping left/right unchanged based on live orientation feedback
- [x] `npm test -- src/__tests__/` rerun clean after UserNode UI expansion (`85/85` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/drinkMenuMedia.test.ts` — added coverage ensuring each catalog drink has a mapped `.mp4` menu animation asset
- [x] `display-app/src/screens/screens.css` — added Game portal styles and tap-to-play menu media styles/overlay state labels
- [x] `display-app/src/screens/MenuScreen.tsx` — added lazy menu media loader with viewport-triggered loading and explicit tap-to-play behavior per drink card
- [x] `display-app/src/data/drinkMenuMedia.ts` — added explicit drink-to-mp4 mapping for in-menu tap-to-play media, including `PisoColada.mp4` legacy filename normalization
- [x] `display-app/src/components/UserNode.tsx` — scaled expanded panel UI to 75% (including proportional inner content), and wired new `game` screen to existing `startGame()` flow
- [x] `display-app/src/screens/GamePortalScreen.tsx` — added in-panel Game portal screen with `Truth or Dare` and `King's Game` launch actions
- [x] `display-app/src/screens/HomeScreen.tsx` — added a new `Game` portal card on panel home
- [x] `display-app/src/components/PanelScreen.ts` — added `game` view route for in-panel Game portal navigation
- [x] `npm test -- src/__tests__/` rerun clean after UserNode regression fix (`84/84` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/UserNode.test.tsx` — updated rotation expectations to canonical edge mapping and added regression checks for non-rotated anchor wrapper + rotated panel-surface transform separation
- [x] `display-app/src/components/UserNode.tsx` — fixed flipped edge rotation mapping (`bottom=0`, `right=-90`, `top=180`, `left=90`) to match existing y-down edge convention
- [x] `display-app/src/components/UserNode.tsx` — split panel anchor wrapper from rotated panel surface and elevated node handle z-index so open panel no longer blocks node interaction
- [x] `npm test -- src/__tests__/` rerun clean after UserNode orientation upgrade (`82/82` passing; existing jsdom canvas warning remains pre-existing)
- [x] `display-app/src/__tests__/UserNode.test.tsx` — expanded to cover nearest-edge resolution, ambiguous-corner approach tie-breaks, previous/owner fallbacks, approach-vector extraction, and discrete edge rotation mapping
- [x] `display-app/src/__tests__/useAppStore.test.ts` — added coverage for spawn-derived owner/view edge defaults and orientation lock/unlock store actions
- [x] `display-app/src/components/UserNode.tsx` — replaced center-facing rotation with edge-based orientation resolver (`nearest-edge` + `approach` tie-break + previous/owner fallback), added panel-open orientation lock, and aligned badge/panel rendering to a shared edge source
- [x] `display-app/src/store/useAppStore.ts` — added spawn-derived edge defaults plus `setUserNodeViewEdge`, `lockUserNodeOrientation`, and `unlockUserNodeOrientation` actions for user-facing orientation state
- [x] `display-app/src/types/index.ts` — added `UserEdge` and extended `UserNode` with `ownerEdge`, `viewEdge`, and `lockedEdge` to support edge-based panel orientation + open-state lock
- [x] `npm run build` rerun clean after the `UserNode` interaction fix (`tsc -b && vite build`; bundle still emits the pre-existing >500 kB chunk-size warning only)
- [x] `display-app` test suite rerun clean after the `UserNode` interaction fix (`73/73` passing, including new gesture-classifier coverage)
- [x] `display-app/src/__tests__/UserNode.test.tsx` — simplified the new coverage to pure `isTapGesture()` unit tests, keeping the regression signal focused on noisy-tap vs drag classification instead of brittle jsdom event synthesis
- [x] `display-app/src/components/UserNode.tsx` — raised gesture tolerance from `4px` to `16px` and extracted `isTapGesture()` so noisy IR-touch taps are less likely to be misclassified as drags while still preserving deliberate drag behavior
- [x] `display-app/src/__tests__/UserNode.test.tsx` — normalized the new pointer tests onto direct pointer sequences with explicit coordinates, avoiding flaky jsdom touch emulation while still exercising the new `pointerup` tap path
- [x] `display-app/src/__tests__/UserNode.test.tsx` — added a `PointerEvent` test polyfill so Vitest/jsdom actually exercises the `UserNode` pointer handlers instead of silently skipping that interaction path
- [x] `display-app/src/__tests__/UserNode.test.tsx` — switched the new interaction test to a store-backed harness plus `@testing-library/user-event` pointer sequences so it exercises the same rerender path as `App.tsx`
- [x] `display-app/src/components/UserNode.tsx` — moved panel-open tap detection from `onClick` to `pointerup` tap classification so `UserNode` opening no longer depends on browser-synthesized click events during multi-touch/coaster-active states
- [x] `display-app/src/__tests__/UserNode.test.tsx` — added pointer-gesture coverage for the `UserNode` handle so tap-vs-drag behavior is now reproducible in tests without relying on browser-synthesized `click`
- [x] Started end-to-end implementation for upgraded coaster detection/tracking (PRD-aligned preview -> confirm flow)
- [x] Created implementation execution plan and began stepwise work across engine/store/render/test surfaces
- [x] `display-app/src/types/index.ts` — added explicit `CoasterDetectionState` (`preview`/`confirmed`/`inactive`) and extended `Coaster` shape to carry lifecycle state
- [x] `display-app/src/engine/CoasterTemplates.ts` — added known coaster template catalog, signature metrics helpers, and per-template ratio/size/area tolerances
- [x] `display-app/src/engine/TrackingEngine.ts` — refactored to template-based tracking with preview/confirmed lifecycle, frame transition events, and richer cluster diagnosis
- [x] `display-app/src/store/useAppStore.ts` — updated coaster upsert/remove semantics to preserve `detectionState` and only treat `confirmed` as fully detected
- [x] `display-app/src/App.tsx` — switched touch pipeline to consume tracking frame events, upsert preview vs confirmed state, and gate `AnimationDispatcher.onCoasterDetected()` on explicit confirmation events
- [x] `display-app/src/pixi/PixiStage.tsx` — added lightweight preview pulse rendering for candidate coasters and kept full drink/sprite effects gated to `confirmed` state only
- [x] `display-app/src/engine/AnimationDispatcher.ts` — introduced explicit `onCoasterConfirmed()` API and kept `onCoasterDetected()` as compatibility alias
- [x] `display-app/src/App.tsx` — updated runtime to trigger full animation dispatch only through `onCoasterConfirmed()`
- [x] `display-app/src/components/DebugPanel.tsx` — diagnostics now expose coaster lifecycle state (`preview`/`confirmed`/`inactive`) and template-selection metrics per cluster
- [x] `display-app/src/components/DiagnosticsOverlay.tsx` — updated coaster display to lifecycle-aware glyph/state output
- [x] `display-app/src/__tests__/TrackingEngine.test.ts` — rewritten for template-based preview/confirm lifecycle, rejection, and removal-event semantics
- [x] `display-app/src/__tests__/useAppStore.test.ts` — updated coaster upsert expectations for lifecycle state and added explicit preview-state assertion
- [x] `display-app/src/__tests__/AnimationDispatcher.test.ts` — shifted primary dispatch expectations to `onCoasterConfirmed()` and added alias-compatibility coverage
- [x] `display-app/src/engine/CoasterTemplates.ts` — switched templates to side-length specs (`C1: 60/60/60`, `C2: 55/45/45`) and added `COASTER_TEMPLATE_SPECS` + `setCoasterTemplateSpecs()` hook for future Firebase overrides
- [x] `display-app/src/engine/CoasterTemplates.ts` — added `COASTER_MM_TO_TOUCH_UNITS` + `setCoasterMmToTouchUnits()` calibration hook for future Firebase/runtime config
- [x] `display-app/src/engine/TrackingEngine.ts` — now reads templates through `getCoasterTemplates()` so runtime template specs can be replaced later (e.g. Firebase sync path)
- [x] `display-app/src/__tests__/TrackingEngine.test.ts` — fixtures now generate geometry from C1/C2 side lengths using `COASTER_MM_TO_TOUCH_UNITS`, keeping tests aligned with side-length templates
- [x] `display-app/src/engine/CoasterTemplates.ts` — updated C1/C2 default side lengths from actual debug-panel capture and set template-unit scale to `1/1900` (pixel-distance source)
- [x] `display-app/src/__tests__/TrackingEngine.test.ts` — generalized fixture generation from `DEFAULT_COASTER_TEMPLATE_SPECS` so tests stay aligned when template side lengths change
- [x] `display-app/src/engine/TrackingEngine.ts` — increased `CLUSTER_RADIUS` from `0.08` to `0.12` to support debug-observed coaster spreads (~180–202 px on 1900 canvas)
- [x] `display-app/src/engine/CoasterTemplates.ts` — tuned C1/C2 to fitted medians from full capture set and set explicit per-template `ratioTolerance`, `maxSideScaleRange`, and `areaScaleRange`
- [x] `display-app/src/engine/TrackingEngine.ts` — tuned `CLUSTER_RADIUS` from `0.12` to `0.13` based on full capture spread
- [x] `display-app/src/App.tsx` + `src/components/DebugPanel.tsx` — added temporary demo-layer dropdown overrides (empty by default) for Coaster 1/2 animation mapping, while leaving backend/Firebase assignment flow untouched
- [x] `display-app/src/App.tsx` — on real coaster confirmation (`coaster-1`/`coaster-2`), resolve animation drink as `existing assignment (Firebase/store)` first, otherwise debug dropdown override, then dispatch confirmed animation
- [x] `display-app/src/components/DebugPanel.tsx` — clarified dropdown labels to `Tracked Coaster 1/2 animation override`

### In Progress
- [x] Define coaster template catalog and shared detection lifecycle types
- [x] Refactor TrackingEngine to template-based preview/confirm state machine
- [x] Wire App + Zustand for preview vs confirmed coaster state
- [x] Add generic preview rendering and keep full animation gated on confirmed state
- [x] Update tests and diagnostics for new detection semantics

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        8 tests
✓ AnimationDispatcher.test.ts  10 tests
✓ useAppStore.test.ts          17 tests
✓ UserNode.test.tsx            11 tests
✓ SpriteRegistry.test.ts       25 tests
✓ drinkMenuMedia.test.ts        1 test
✓ GameOverlay.test.tsx          2 tests
Total: 87/87
```

- [x] `npm run build` clean (`tsc -b && vite build`)

### Failed Attempts
- Stopping touch propagation from the panel alone was not sufficient while coaster tracking was still attached to the app root; moving `InputAdapter` onto the Pixi common-space surface was needed to truly separate UI touches from coaster input.
- Tried to run an automated browser smoke test against `http://127.0.0.1:4173` via browser-use subagent for the 1/2-coaster interaction scenario, but it was unavailable in this environment due regional model restrictions; left a manual on-device QA checklist to execute on hardware.
- First `GameOverlay` test used exact-text lookups for `GREEN` / `ORANGE`, but the popup copy embeds those labels inside longer strings; relaxed the matcher to regex instead of treating the UI as broken.
- Full DOM-level pointer simulation for `UserNode` remained too brittle in Vitest/jsdom, so the regression test was reduced to the extracted gesture classifier that contains the actual tap-vs-drag decision logic.
- The original `4px` drag threshold was unrealistically tight for the IR overlay and likely treated tap jitter as drag; the fix was widened to a more touch-tolerant `16px` classifier.
- `user-event` touch-style sequences still were not a trustworthy signal in jsdom for this case, so the test was narrowed to direct pointer sequences with explicit coordinates.
- `UserNode` pointer tests initially no-op'd in Vitest because `jsdom` did not expose `PointerEvent`; added an explicit polyfill before using the failure signal.
- First `UserNode` test rendered the component with a static `node` prop snapshot, which did not mirror the real store-driven rerender path from `App.tsx`; replaced it with a store-backed harness before judging the fix.
- Suspected `TrackingEngine` confirmation regressions first, but the drag-only symptom isolated the issue to interaction semantics: the node already received pointer events, while `onClick` was the missing piece under multi-touch.
- `npm test` still prints a `jsdom` warning about `HTMLCanvasElement.prototype.getContext` from Pixi's canvas capability probe, but the suite itself remains green and this warning predates the `UserNode` fix.
- `display-app/src/App.tsx` briefly had duplicated `upsertCoaster()` in demo toggle branch while migrating to `detectionState`. Removed duplicate immediately to avoid double writes.
- Initial run after introducing mm-based template scaling failed in `TrackingEngine.test.ts` because old synthetic points were too small for new size windows; fixed by converting test fixtures to side-length-derived geometry.
- After switching templates to debug-sized geometry, clustering failed because points no longer fit the legacy `CLUSTER_RADIUS=0.08`; fixed by raising radius to `0.12`.

### Blocked
- None.

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

## Session: 2026-04-29

### Completed — MVP End-to-End Demo Flow

- [x] `Websocket Demo/demo-ws-server.js` — extended relay to broadcast all message types (was CONFIG_UPDATE + SUBMIT_ORDER only); now caches SESSION_START for new-connection replay; SUBMIT_ORDER remains sender-excluded
- [x] `display-app/package.json` — added `firebase` dependency
- [x] `display-app/src/services/firebaseService.ts` — NEW: lazy Firebase init; `writeOrderToFirestore()` writes orders to `venues/demo/orders/{id}`; `listenToSession()` subscribes to `venues/demo/session/current`; `listenToCoasterAssignments()` subscribes to `venues/demo/coasterAssignments/` collection
- [x] `display-app/src/store/useAppStore.ts` — `addOrder()` now fire-and-forgets `writeOrderToFirestore()` so orders appear on iOS; added `linkOrderToCoaster(drinkId, coasterId)` FIFO action that ties a pending order to its assigned coaster; added `arriveOrderByCoaster(coasterId)` action that advances the linked order to `arrived`
- [x] `display-app/src/App.tsx` — added Firestore listener `useEffect` for session control (start/end) and coaster assignments from iOS; COASTER_ASSIGN WebSocket handler also calls `linkOrderToCoaster`; confirmed coaster event now calls `arriveOrderByCoaster` so guest panel updates to "YOUR DRINK HAS ARRIVED"
- [x] `display-app/src/__tests__/useAppStore.test.ts` — added `vi.mock` for firebaseService; added 6 new tests covering `linkOrderToCoaster` (FIFO link, wrong-drink no-op, multiple orders) and `arriveOrderByCoaster` (success, idempotent, no-match no-op)
- [x] `SmartTableAI (Bartender)/SmartTableAI/Models.swift` — added `catalogId: String` to `Drink` struct; maps to display-app drinkCatalog.ts slugs (e.g. `"pisco-colada"`)
- [x] `SmartTableAI (Bartender)/SmartTableAI/MockAuraService.swift` — replaced mock drinks with the four Tales9 catalog drinks (pisco-colada, espresso-martini, momo-sour, apple-tart) including correct `catalogId`; replaced mock coasters with `coaster-1` / `coaster-2` codes matching display-app template IDs
- [x] `SmartTableAI (Bartender)/SmartTableAI/DemoSyncClient.swift` — added `assignedCoasters: [String: String]` UI state; added `sendSession(active:userCount:)` writing to `venues/demo/session/current`; added `sendCoasterAssignment(coasterId:drinkId:)` writing to `venues/demo/coasterAssignments/{coasterId}`; `clearOrders()` now also resets assignment state
- [x] `SmartTableAI (Bartender)/SmartTableAI/ContentView.swift` — `DemoSyncView`: added Table Session section (user count stepper + Start/End Session buttons); enhanced orders section with per-order coaster picker that calls `sendCoasterAssignment`; retained legacy config-send section for ambient control
- [x] `SmartTableAI (Bartender)/SmartTableAI/AppViewModel.swift` — `@MainActor` isolation for UI state; `restartTable()` uses `Task.sleep` instead of `DispatchQueue.main.asyncAfter`
- [x] `SmartTableAI (Bartender)/SmartTableAI/DemoSyncClient.swift` — `@MainActor` isolation; `ordersListener` stored as `nonisolated(unsafe)` so `deinit` can remove the Firestore listener off the main actor
- [x] `SmartTableAI (Bartender)/SmartTableAI/ContentView.swift` — removed duplicate `discoverTables()` from root `onAppear`; VoiceOver labels for icon-only refresh and destructive trash actions; dashboard telemetry `LazyVGrid` for Dynamic Type; preview simulation table `contentShape`, `accessibilityAction` for center placement, `addSimulatedCoaster`; `DrinkEditor` default drink + Basics field for `catalogId` (display-app slug)

### Test Results
```
✓ drinkCatalog.test.ts          7 tests
✓ CalibrationMapper.test.ts     6 tests
✓ TrackingEngine.test.ts        8 tests
✓ AnimationDispatcher.test.ts  10 tests
✓ useAppStore.test.ts          23 tests  (+6 new)
✓ UserNode.test.tsx            11 tests
✓ SpriteRegistry.test.ts       25 tests
✓ drinkMenuMedia.test.ts        1 test
✓ GameOverlay.test.tsx          2 tests
Total: 93/93
```

- [x] `npm run build` clean (`tsc -b && vite build`; pre-existing >500 kB chunk warning only)

### ID Alignment (single source of truth)
| Printed # | TrackingEngine ID | iOS Coaster.code | Firestore doc | drinkId slug |
|---|---|---|---|---|
| 1 | `coaster-1` | `coaster-1` | `coaster-1` | catalog slug |
| 2 | `coaster-2` | `coaster-2` | `coaster-2` | catalog slug |

### Firestore Paths Added
- `venues/demo/session/current` — `{ active, userCount, updatedAt }` written by iOS, listened by display app
- `venues/demo/coasterAssignments/{coasterId}` — `{ drinkId, updatedAt }` written by iOS, listened by display app
- `venues/demo/orders/{orderId}` — `{ drinkId, drinkName, userId, status, timestamp }` written by display app, listened by existing iOS `DemoSyncClient`

### Demo Rehearsal Checklist
1. Start WS server: `cd "Websocket Demo" && node demo-ws-server.js`
2. Start display app: `cd display-app && npm run dev`
3. iOS: Demo Sync tab → set user count → Start Session → User Nodes appear on display
4. Display: open a User Node panel → Menu → ORDER a drink → order appears in iOS orders list
5. iOS: tap order's coaster picker → select "Coaster 1" → `venues/demo/coasterAssignments/coaster-1` written
6. Place physical Coaster 1 on table → tracking confirms → correct drink animation plays → guest panel shows "YOUR DRINK HAS ARRIVED"

### Blocked
- None.

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
