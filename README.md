# Tales9 — Smart Bar Table System

**A 1900×1900px interactive bar table that detects drink placement via capacitive coasters and responds with synchronized animations. Pilot venue: Barcode, Central Hong Kong. MVP demo: End of May 2026.**

---

## What Is Tales9?

Tales9 transforms a tabletop into a shared interactive experience:

- **Guests** sit at the table, each gets a draggable **User Node** to browse menus, take drink quizzes, and place orders
- **Drinks arrive** on touch-enabled coasters — the system detects placement instantly via 3-point geometric signature
- **Animations trigger** in real-time: drink-specific visuals, ingredient characters walking the perimeter, proximity-based battle effects
- **Social games** (Truth or Dare, King's Game) create moments worth sharing

See the full **[Tales9 PRD](Tales9%20PRD.md)** for product vision and design principles.

---

## Quick Start

### 1. Display App (Primary Build Target)

The guest-facing React + PixiJS kiosk. Runs fullscreen on the table's Android 8.1 WebView.

```bash
cd display-app
npm install
npm run dev      # Vite dev server (localhost:5173)
npm test         # Vitest unit tests (must pass before commits)
npm run build    # Production build
```

**Stack:** React 18 + TypeScript + PixiJS 8 + Zustand + React Router
**Target:** 33.2-inch square display, 1900×1900px, Android 8.1

---

### 2. WebSocket Demo Server

Local Node.js bridge relaying real-time events between iOS and web.

```bash
cd "Websocket Demo"
npm install
node demo-ws-server.js   # Starts on port 8080
```

Emits `SESSION_START`, `COASTER_ASSIGN`, `ORDER_UPDATE` events for local testing.

---

### 3. iOS Bartender App

Staff tool for session control, order management, and NFC coaster assignment.

```bash
open SmartTableAI\ \(Bartender\)/SmartTableAI.xcodeproj
```

Run/test via Xcode. Connects to the table over local Wi-Fi for real-time order sync and NFC coaster assignment. Also connects to Firebase for remote order monitoring and menu/config management when off-network.

---

## Architecture

### display-app/ File Structure

```
display-app/
├── src/
│   ├── engine/              # Core TS logic (no React)
│   │   ├── InputAdapter.ts       # Touch input abstraction
│   │   ├── TrackingEngine.ts     # 3-point coaster detection
│   │   ├── CalibrationMapper.ts  # Pixel coordinate transforms
│   │   └── AnimationDispatcher.ts # Coaster → animation dispatch
│   ├── pixi/                # PixiJS rendering (no React)
│   │   ├── PixiStage.tsx         # React wrapper for PIXI.Application
│   │   ├── StandbyLayer.ts       # Ambient idle animation
│   │   ├── CoasterAnimation.ts   # Per-drink visual effects
│   │   ├── GameLayer.ts          # Truth/Dare & King's Game
│   │   └── ProximityBattle.ts    # Shared drink interactions
│   ├── screens/             # React UI screens (inside User Node panels)
│   │   ├── HomeScreen.tsx
│   │   ├── MenuScreen.tsx, DrinkDetailModal.tsx
│   │   ├── QuizFlow.tsx, OrderStatusPanel.tsx
│   │   └── GameOverlay.tsx
│   ├── components/
│   │   ├── UserNode.tsx          # Draggable node, expands to panel
│   │   └── DiagnosticsOverlay.tsx # Dev debug panel (D key)
│   ├── store/
│   │   └── useAppStore.ts        # Zustand global state
│   ├── data/
│   │   └── drinkCatalog.ts       # 4 drinks + quiz logic
│   └── types/
│       └── index.ts              # Shared domain types
├── src/__tests__/           # Vitest tests mirror src/
├── vite.config.ts
└── package.json
```

### Key Design Patterns

- **Engine modules are pure TypeScript** — no React, no PixiJS internals
- **Single PIXI.Application instance** — owned by PixiStage.tsx, never recreated
- **Zustand store** owns session, users, coasters, orders, game state
- **Centroid utility** in CalibrationMapper — all coordinate transforms go through this
- **Modular drink profiles** — animations driven by `animationFamily` + `colorPalette`, not hardcoded per drink

### Hybrid Architecture

The system uses a **local-first + Firebase sync** model:

| Data | Where |
|------|-------|
| Real-time tracking state | Local only (latency-critical) |
| Active session & orders | Local (primary) + Firebase (background sync) |
| Drink catalog & menu | Firebase → SQLite cache (startup pull) |
| Assets (logos, images, sprites) | Firebase Storage → local cache |
| Multi-table config | Firebase (central management) |
| Analytics | Firebase |

At startup, the table pulls the latest catalog, assets, and config from Firebase and caches to SQLite. During a session, all real-time operations use the local path exclusively. Firebase sync happens in the background and is non-blocking — the system operates fully offline if internet is unavailable.

---

## Coding Standards (display-app/)

✅ **TypeScript strict mode** — no `any` unless absolutely unavoidable
✅ **60fps target** — animations use `PIXI.Ticker`, never `setInterval`
✅ **No memory growth** — destroy PixiJS objects on removal
✅ **Tests required for:** TrackingEngine, CalibrationMapper, AnimationDispatcher, store actions
✅ **Before every commit:** `npm test` must pass

See **[CLAUDE.md](CLAUDE.md)** for full standards and architecture notes.

---

## WebSocket Events (Real-Time Sync)

The embedded backend broadcasts these events over WebSocket:

```ts
SESSION_START   { userCount: number }
SESSION_END     {}
COASTER_ASSIGN  { coasterId: string, drinkId: string }
ORDER_UPDATE    { orderId: string, status: 'BEING_PREPARED' | 'ON_THE_WAY' | 'HAS_ARRIVED' }
GAME_START      { gameType: 'TRUTH_OR_DARE' | 'KINGS_GAME' }
GAME_END        {}
```

---

## Current Status: 41/41 Tests Passing ✓

**React + PixiJS layer complete.** See **[CHANGELOG.md](CHANGELOG.md)** for session-by-session build log.

| Component                                                    | Status             |
| ------------------------------------------------------------ | ------------------ |
| Core engine (tracking, calibration, animation dispatch)      | ✅ Complete, tested |
| React UI (Home, Menu, Quiz, Orders, panels)                  | ✅ Complete, styled |
| PixiJS rendering (standby, coaster animations, ingredient sprites) | ✅ Complete         |
| Games layer (Truth/Dare, King's Game, proximity battles)     | ✅ Complete         |
| WebSocket integration (session, orders, coasters)            | ✅ Complete         |
| Diagnostics overlay (dev panel with D key)                   | ✅ Complete         |

### Build Metrics

```
✓ 41/41 tests passing (Vitest)
✓ npm run build clean (777 modules, 488 kB bundle)
✓ No TypeScript errors
✓ 1900×1900 canvas coordinate transforms verified
```

---

## Next Steps (Post-MVP)

- [ ] Implement Firebase startup sync: pull catalog, assets, and config into SQLite on boot
- [ ] Background order sync: push completed orders and session summaries to Firestore
- [ ] Bartender app: Firebase connection for remote order monitoring (off-venue Wi-Fi)
- [ ] iOS app: send `GAME_START` / `GAME_END` via Firestore → WebSocket bridge
- [ ] Swap 'D' key toggle for secret corner-tap gesture (Android WebView compatibility)
- [ ] Proximity battle: distinct animation per drink-pair (fiery vs icy collision)
- [ ] King's Game phase 2: king chooses decree via User Node panel

---

## Key Resources

| Document | Purpose |
|----------|---------|
| **[Tales9 PRD](Tales9%20PRD.md)** | Full product vision, user flows, scope, success metrics |
| **[CLAUDE.md](CLAUDE.md)** | Code standards, tech stack, architecture principles, constraints |
| **[CHANGELOG.md](CHANGELOG.md)** | Session-by-session build log, test results, failed attempts |

---

## Development Workflow

1. **Make changes** in `display-app/src/`
2. **Run tests** → `npm test` (must pass)
3. **Build** → `npm run build` (must be clean)
4. **Commit** → tests already passing, no surprises
5. **Check CHANGELOG** if you need context on why something is designed a certain way

---

## Performance Targets

- **<100ms** coaster placement → animation start
- **60 fps** sustained during full session
- **>99.5%** uptime (8-hour bar shift)
- **No memory growth** over session lifetime

---

**Questions? Check [CLAUDE.md](CLAUDE.md) for architecture deep-dives or [Tales9 PRD](Tales9%20PRD.md) for product context.**
