# README

This README shows how to install, test, and run the demo. The technical architecture report is in [`report/Salet6-Architecture-Report.pdf`](report/Salet6-Architecture-Report.pdf) 

---

## What this project does

Salet6 lets a venue owner design a branded table experience in five steps:

**Concept → Generate → Compare → Edit → Apply**

The admin UI (`packages/salet6`) talks to a local **bridge** server (`packages/bridge`) for AI generation and asset handling. On **Apply**, a compiled `ThemePackage` is sent over WebSocket to a **display runtime** (`packages/display-app-stub`, or the production Tales9 display-app in a sibling repo).

Design evolution: Poe Canvas prototype → in-repo wireframe app at [`packages/salet6/index.html`](packages/salet6/index.html) → bridge/runtime integration in this monorepo. See [`report/Poe-Canvas-Salet6-Prototype-Interactions.md`](report/Poe-Canvas-Salet6-Prototype-Interactions.md) and [`report/Salet6PRD.md`](report/Salet6PRD.md).

---

## Repository layout

| Path | Purpose |
|------|---------|
| `packages/shared/` | Zod schemas + WebSocket message types (shared contract) |
| `packages/bridge/` | Express HTTP API + WebSocket bridge (`:8787`) |
| `packages/salet6/` | Wireframe single-file authoring UI (Vite static serve, `:5173`) |
| `packages/display-app-stub/` | PixiJS table runtime stand-in (`:5174`) |
| `report/Salet6-Architecture-Report.pdf` | System architecture report (2 pages) |
| `report/Salet6PRD.md` | Product requirements |
| `report/Poe-Canvas-Salet6-Prototype-Interactions.md` | Prototype design history |
| `slides/` | Final presentation PDF |
| `requirements.txt` | Course dependency manifest (Node primary + optional Python MCP lab) |

---

## Requirements

| Requirement | Version |
|-------------|---------|
| **Node.js** | ≥ 20 |
| **npm** | Comes with Node (workspaces monorepo) |

**Dependencies:** Node packages are in `package.json` / `package-lock.json`. A root **`requirements.txt`** is included for the course rubric — it documents the Node stack and lists optional Python deps for the Week 11 MCP lab (`design_mcp_server.py`).

---

## Quick start (≈ 5 minutes)

### 1. Install

```bash
cd Salet6-AIforDesign-submission   # extracted zip folder name
npm install
```

**Live AI (included in submission zip):** A root **`.env`** file is bundled for grading with `PROVIDER=poe` and a Poe API key preconfigured. After `npm install`, skip manual env setup and run `npm run dev:all`.

> **Key expiry:** The bundled key is intended for grading only and **expires at 30 May**. If Poe calls fail after that date, copy `.env.example` → `.env`, set your own key, or switch `PROVIDER=mock` for offline demo.

### 2. Verify

```bash
npm test
npm run build
```

All workspace tests should pass.

### 3. Run the full demo

**One-liner (all three):**

```bash
npm run dev:all
```

### 4. Demo script

1. In Salet6 (**:5173**), go to **Concept**: enter a brand description (or pick a preset), add 1–2 drinks.
2. **Generate** → wait for Plans A/B/C.
3. **Compare** → select a plan (triggers full asset generation).
5. **Apply** → **Preview & Apply** → **Apply to Table** (requires runtime tab connected).
6. In the stub (**:5174**), click the table surface to place coasters; watch coaster animation and ingredient sprites.

**Health check:**

```bash
curl http://localhost:8787/api/health
```

Expected: `{"ok":true,"data":{"provider":"mock"|"poe",...}}`

---

## Environment variables (bridge only)

| Variable | Default | Description |
|----------|---------|-------------|
| `PROVIDER` | `mock` | `mock` = deterministic CI/demo; `poe` = live Poe API |
| `POE_API_KEY` | (Provided; Expire on 30 May) | Required when `PROVIDER=poe` |
| `POE_TEXT_MODEL` | `gemini-2.5-flash-lite` | Text/design model (Poe `/v1/responses`) |
| `POE_EDIT_MODEL` | `gemini-2.5-flash-lite` | NL theme edit (`/api/nl-edit`) |
| `POE_CODE_MODEL` | `claude-haiku-4.5` | Coaster Pixi codegen (`/api/generate-coaster-animation`) |
| `POE_IMAGE_MODEL` | `Flux-Schnell-T` | Drink preview images (or `Flux-Schnell-T` if set in `.env`) |
| `BRIDGE_PORT` | `8787` | HTTP + WebSocket port |

---

## HTTP API (bridge)

| Endpoint | Method | Role |
|----------|--------|------|
| `/api/health` | GET | Liveness + active provider |
| `/api/generate-plans` | POST | Plans A/B/C from brand + menu |
| `/api/select-plan` | POST | Full assets + `DrinkProfile[]` for chosen plan |
| `/api/nl-edit` | POST | Natural-language `ThemeConfig` adjustment |
| `/api/compile-runtime` | POST | Build `ThemePackage` (Pixi stub artifacts) |
| `/api/assets` | POST | Logo/icon upload (PNG/JPEG/SVG, persist-only in MVP) |
| `/api/generate-drink-character` | POST | Drink NPC metadata + imagen preview |

WebSocket: `ws://localhost:8787/ws` — roles `authoring` (Salet6) and `runtime` (display-app-stub).

---

## Salet6 authoring UI (wireframe)

[`packages/salet6/index.html`](packages/salet6/index.html) is the active single-file Poe Canvas app served at `http://localhost:5173` through Vite. With the bridge running, it calls live routes including `POST /api/generate-plans`, `POST /api/select-plan`, `POST /api/nl-edit`, `POST /api/compile-runtime`, and `POST /api/generate-drink-character`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Apply button disabled | Open display-app-stub tab; wait for “runtime ready” |
| `PROVIDER=poe` crashes on start | Check `.env` exists at repo root; if key expired, use `PROVIDER=mock` or a new `POE_API_KEY` |
| Port 5173 in use | Stop other Vite apps or change port in `packages/salet6/vite.config.ts` |
| Tests fail after extract | Run `npm install` at repo root (not inside a single package) |
