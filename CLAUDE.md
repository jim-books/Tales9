# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Tales9** is an interactive smart bar table system that detects drink placement (via capacitive touch coasters) and responds with branded animations on a display surface. Designed for high-end hospitality venues.

## Codebase Components

Three separate, independently-runnable components:

1. **[SmartTableAI (Bartender)/](SmartTableAI%20(Bartender)/)** — iOS Swift/SwiftUI app for bar staff to configure the table, assign brands/drinks, and monitor system status. Uses Firebase Firestore for persistence.
2. **[display-app/](display-app/)** — Guest-facing React+TypeScript+PixiJS kiosk app. Runs fullscreen on the 33.2-inch 1900×1900 Android table display. Core build target.
3. **[Websocket Demo/](Websocket%20Demo/)** — Node.js WebSocket bridge server running locally on Mac. Relays real-time config/order events between iOS and web.

---

## Primary Build Target: `display-app/`

### Commands

```bash
cd display-app
npm install
npm run dev      # Vite dev server
npm test         # Vitest unit tests (MUST PASS before every commit)
npm run build    # Production build
```

**Test-driven workflow:** Before every `git commit`, run `npm test`. If tests fail, fix them before committing.

### Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| State Management | Zustand |
| Routing | React Router v6 |
| Real-Time Visuals | PixiJS v8 |
| Testing | Vitest + @testing-library/react |
| Target Platform | Android 8.1 WebView, 1900×1900px |

### File Structure

```
display-app/
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component + router
│   ├── store/
│   │   └── useAppStore.ts        # Zustand global state
│   ├── engine/                   # Core non-UI logic
│   │   ├── InputAdapter.ts       # Abstracts touch input sources
│   │   ├── TrackingEngine.ts     # Groups/tracks 3-point coaster signatures
│   │   ├── CalibrationMapper.ts  # Touch coords → display pixel coords
│   │   └── AnimationDispatcher.ts# Maps coaster+drink profile → PixiJS visuals
│   ├── pixi/                     # PixiJS rendering layer
│   │   ├── PixiStage.tsx         # React wrapper for PixiJS Application
│   │   ├── StandbyLayer.ts       # Ambient idle animation
│   │   ├── CoasterAnimation.ts   # Per-drink visual effects
│   │   └── IngredientSprite.ts   # Perimeter characters
│   ├── screens/                  # React UI screens (inside User Node panels)
│   │   ├── HomeScreen.tsx
│   │   ├── AboutScreen.tsx
│   │   ├── MenuScreen.tsx
│   │   ├── DrinkDetailModal.tsx
│   │   ├── QuizFlow.tsx
│   │   └── OrderStatusPanel.tsx
│   ├── components/
│   │   └── UserNode.tsx          # Draggable node that expands into panel
│   ├── data/
│   │   └── drinkCatalog.ts       # Static drink data + quiz logic
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── src/__tests__/                # Vitest test files mirror src structure
├── index.html
├── vite.config.ts
└── package.json
```

### Coding Standards

- **TypeScript strict mode** — no `any` unless absolutely unavoidable
- **No hardcoded drink IDs or animation logic** — use `drinkCatalog.ts` + configurable drink profiles
- **Engine modules are pure TS** — no React imports in `engine/` or `pixi/`
- **PixiJS runs in a single Application instance** — do not create multiple PIXI.Application objects
- **60fps target** — animations use `PIXI.Ticker`, not `setInterval`
- **No memory growth** — destroy PixiJS objects when removed; no listeners that accumulate
- **1900×1900 canvas** — all layout math uses this as the coordinate space
- **Centroid utility** — use `CalibrationMapper.ts` for all coordinate transforms; never inline raw pixel math
- **Tests required for:** TrackingEngine, CalibrationMapper, AnimationDispatcher, quiz logic, store actions
- **No test mocking of PixiJS internals** — test logic modules independently from the renderer

### Architecture Notes

#### Session State (Zustand)
The global store manages:
- `sessionActive: boolean`
- `userCount: number` (1–4)
- `userNodes: UserNode[]` — position, owner, open/closed
- `coasters: Coaster[]` — id, position, drinkId, detected
- `orders: Order[]` — userId, drinkId, status
- `gameState: GameState | null` — Truth/Dare or King's Game

#### WebSocket Events (from backend)
```ts
SESSION_START   { userCount: number }
SESSION_END     {}
ORDER_UPDATE    { orderId, status }
COASTER_ASSIGN  { coasterId, drinkId }
```

#### Drink Profile Shape
```ts
interface DrinkProfile {
  id: string
  name: string
  category: 'CLASSICS' | 'COFFEE_BASED' | 'DESSERT_INSPIRED'
  price: number
  flavorProfile: string
  ingredients: string[]
  animationFamily: 'energetic' | 'elegant' | 'tropical' | 'bold'
  colorPalette: [string, string, string]  // hex
  spriteCharacter: string                 // asset key
  description: string
}
```

### Performance Constraints

- **<100ms** coaster placement → animation start
- **60 fps** sustained during full session
- **No memory growth** over 8-hour session (destroy all PixiJS objects on removal)
- **Offline-capable** — no required internet calls during session

---

## Other Components

### WebSocket Demo Server

```bash
cd "Websocket Demo"
npm install
node demo-ws-server.js   # starts on port 8080
```

### iOS App

Open `SmartTableAI (Bartender)/SmartTableAI.xcodeproj` in Xcode. Run/test via Xcode UI.

---

## Key Constraints

- **Display:** 33.2-inch square, 1900×1900px, Android 8.1 WebView
- **Latency target:** <100ms from coaster placement to animation start
- **Memory stability:** No growth over 8-hour sessions
- **Offline mode required** for code freeze (May 2026)
- **WebSocket server is local-only:** No auth layer; trusted local network assumed
