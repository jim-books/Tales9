# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Salet6** is the admin / SDK UI that lets a venue owner design a branded theme (palette, motion, lighting, drink menu) and apply it to the Tales9 smart bar table. This monorepo hosts:

| Package | Role |
|---|---|
| `packages/shared/` | Shared TypeScript types + Zod schemas (canonical contract for HTTP, WS, `ThemePackage`) |
| `packages/bridge/` | Node 20 + Express + `ws` on `:8787`. Poe/mock AI, HTTP APIs, WebSocket routing between authoring and runtime |
| `packages/salet6/` | **Authoring UI** — single-page wireframe (`index.html`) served by Vite on `:5173`. Concept → Generate → Compare → Edit → Apply |
| `packages/display-app-stub/` | **Local runtime stand-in** — React + PixiJS on `:5174`. Receives `APPLY_THEME`, places coasters, plays coaster animations + Imagen drink photos |

The production Tales9 display-app lives in a **sibling iCloud folder** (not in this repo):

```
/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/Tales9/display-app/
```

Tales9 is modified in place to receive `APPLY_THEME` and override its static drink catalog at runtime. Use `display-app-stub` for local end-to-end demos without opening the Tales9 repo.

The former React admin app is archived at `archive/salet6-react/` (outside npm workspaces, reference only).

## Commands

```bash
npm install          # all workspaces
npm test             # vitest in shared, bridge, display-app-stub (must pass before commit)
npm run build        # all workspaces that define build
npm run dev          # bridge :8787 + salet6 :5173
npm run dev:stub     # display-app-stub :5174 only
npm run dev:all      # bridge + salet6 + display-app-stub (full demo)
```

Per-workspace:

```bash
npm test -w @salet/shared
npm test -w @salet/bridge
npm test -w @salet/display-app-stub
npm run dev -w @salet/bridge
npm run dev -w @salet/salet6
npm run dev -w @salet/display-app-stub
```

Copy `.env.example` to `.env` at repo root. Set `PROVIDER=poe` and `POE_API_KEY` for live AI; default is `PROVIDER=mock`.

## Authoring flow (`packages/salet6/index.html`)

Vanilla JS in one HTML file (no React). Talks to bridge at `http://localhost:8787/api` and `ws://localhost:8787/ws` with role `authoring`. Vite has **`hmr: false`** so CSP is not broken by HMR WebSocket.

1. **Concept** — brand description, drink gallery, presets  
2. **Generate** — `POST /api/generate-plans`  
3. **Compare** — pick plan A/B/C → `POST /api/select-plan` (fills `DrinkProfile`s; bridge normalizes `plan.id` via `withPlanId`)  
4. **Edit** — tune palette/motion/lighting; optional `POST /api/generate-drink-character` (Imagen previews → `drinkSprite.svg` + `DrinkProfile.imageUrl`)  
5. **Apply** — `POST /api/compile-runtime` then WS `APPLY_THEME` to runtime  

`selectedPlanId` must be set (from select-plan or `currentTheme.planLabel` fallback) before apply.

## Bridge HTTP API (`/api/...`)

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness + provider name |
| `POST /generate-plans` | Three `DesignPlan` variants |
| `POST /select-plan` | Asset-ready plan + `drinkProfiles` |
| `POST /nl-edit` | NL theme tweaks |
| `POST /compile-runtime` | Build `ThemePackage` + coaster Pixi stubs |
| `POST /generate-drink-character` | Text + Imagen drink character (`imageUrl`) |
| `POST /assets` | Logo/icon/drink photo upload |
| `GET /asset-proxy?url=` | Proxy external image URLs (CORS-safe for stub Pixi) |

## WebSocket (`/ws`)

- `CLIENT_HELLO` with `role: authoring | runtime`  
- Authoring → runtime: `APPLY_THEME` + `requestId`  
- Runtime → authoring: `APPLY_THEME_ACK`, `RUNTIME_READY`  

## Display stub runtime (`packages/display-app-stub`)

- Subscribes as `runtime`, applies `ThemePackage` to Zustand `themeStore`  
- Click table → random drink from `drinkProfiles` → `AnimationDispatcher` emits `PLAY`  
- `CoasterAnimation` draws family-specific rings; loads `DrinkProfile.imageUrl` via bridge **`/api/asset-proxy`** + `fetch` / `createImageBitmap` / `Texture.from` (not `Assets.load` on extensionless proxy URLs)  

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript strict (`shared`, `bridge`, `display-app-stub`) |
| Authoring UI | Static wireframe HTML + Vite 5 (`packages/salet6`) |
| Runtime stub | React 18 + PixiJS 8 + Zustand (`packages/display-app-stub`) |
| Bridge | Node 20 + Express + `ws` + multer uploads |
| Validation | Zod in `@salet/shared` at every boundary |
| Testing | Vitest; supertest (bridge); jsdom (stub engine tests) |
| AI | Mock default. Poe (`api.poe.com/v1`) when `PROVIDER=poe`. Default text model: `gpt-5.2-instant` (`POE_TEXT_MODEL`). NL edit + coaster Pixi codegen: `gemini-3.5-flash` (`POE_EDIT_MODEL`, `POE_CODE_MODEL`). Imagen via `imagen-4-fast` in drink-character flow. API key stays on bridge only. |

## Coding Standards

- **Schemas are the source of truth.** Infer types from Zod where practical.  
- **No React in `packages/salet6`** — authoring is the wireframe `index.html` only.  
- **Bridge and `shared` stay framework-agnostic.**  
- **No hardcoded drink IDs** — drinks flow from user menu / `ThemePackage.drinkProfiles`.  
- **Tests required** for: shared schemas, bridge HTTP routes, WS router, stub `AnimationDispatcher` / random helpers. The wireframe has no automated tests; verify via `dev:all` manually.  
- **Update `CHANGELOG.md` after every file edit** (newest-first under today's date).  
- **Run `npm test` before every commit.** Never commit red.  
- **One commit per phase** when doing phased work; otherwise follow the user's commit request.  
- Tales9 edits are committed in the Tales9 repo separately.

## Performance & runtime constraints

From the Tales9 PRD — anything Salet6 sends across the bridge must respect:

- `ThemePackage` runtime artifacts are **PixiJS-ready** (compiled on bridge before send); runtime does not call AI.  
- Display-app keeps a **single PixiJS Application**; theme apply must not re-instantiate it.  
- **Offline-capable** after theme apply (no required internet during a session).  
- **Schema validation** at the display-app boundary before apply.

## Reference paths

- Tales9 display-app: `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/Tales9/display-app/src/`  
- Tales9 PRD: `ExternalReference/Tales9 PRD.md`  
- Tales9 CLAUDE.md (snapshot): `ExternalReference/Tales9CLAUDE.md`  
- Salet6 PRD: `Salet6PRD.md`  
- Submission quick-start: `README-SUBMISSION.md`  
- Architecture report: `report/Salet6-Architecture-Report.md`  
- Poe Canvas prototype log: `docs/Poe-Canvas-Salet6-Prototype-Interactions.md`  
- Archived React admin: `archive/salet6-react/`
