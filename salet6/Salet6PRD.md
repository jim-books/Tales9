## A) MVP Scope

### In scope (MVP)

- **Primary flow (wireframe source of truth):** **Concept → Generate → Compare → Edit → Apply**
- **Concept: Define venue & drink menu**
  - Brand Description input
  - Quick Presets: Cyberpunk, Jazz Lounge, Dark Forest, Ocean Terrace, Retro Arcade, Luxury Hotel
  - Drink Menu list management
  - **Add Drink modal**
    - Drink Name
    - Photo upload (**mock**)
    - Ingredients list + “Add ingredient”
- **Generate**
  - “Generate Plans A/B/C”
  - Progress states: “Analyzing brand identity…” → “Generating directional plans”
  - **AI provider (MVP decision):** Poe OpenAI-compatible API (`https://api.poe.com/v1`)
- **Compare**
  - Compare/select plan A/B/C
  - Selecting a plan triggers “generate full assets including coaster animations and ingredient sprites”
- **Edit**
  - Color Palette: Primary / Secondary / Accent / Background / Text
  - Motion Profile: Animation (6 options), Speed (Slow/Moderate/Fast), Intensity (Low/Moderate/High)
  - Lighting: Glow Color + Glow Intensity (Very Low → Maximum)
  - Drinks — Coaster & Ingredient Sprites (per-drink section)
  - Natural Language Editing
  - Save as Draft; Back to Plans; Preview & Apply
- **Apply**
  - Preview & Apply screen + “Apply to Table”
  - Live preview messaging per wireframe (“coasters glow… ingredient sprites orbit…”)
  - **MVP deployment (decision):** SDK/admin UI and **display-app** run as **two browser tabs** on the same mini PC
  - **Apply transport (decision):** Send a resolved `ThemePackage` to display-app via a **local WebSocket bridge on localhost**
  - **Runtime compile (decision):** on apply, the app calls a backend/local API to convert generated coaster visual assets into **PixiJS code-based runtime artifacts** before sending the final package to `display-app`
- **Drafts**
  - Draft list + empty state (“No saved drafts yet”)
- **Asset Library**
  - **Upload logo or icon** (in scope)
  - **MVP decision:** uploaded logo/icon is **persisted only** and **not used** for generation, preview, or table runtime in MVP

### Out of scope (MVP)

- Drink photo upload processing beyond placeholder behavior (“Upload photo (mock)”)
- Any screens/flows not present in the wireframe (no extra setup wizards, no extra steps)
- Game/interaction-mode tuning UI (mentioned in Salet6; not in wireframe)
- Auth / role-based access control (trusted local network per CLAUDE.md + local-only bridge)

### MVP success criteria (implementation-aware)

- Applying a theme **does not** break Tales9 runtime constraints (CLAUDE.md):
  - <100ms coaster placement → animation start
  - 60fps sustained; no memory growth over 8-hour session
  - Single PixiJS Application instance; data-driven (no hardcoded drink IDs/animation logic)
  - Offline-capable during session (no required internet calls once theme is applied/loaded)
  - PixiJS runtime code for coaster animations is generated/compiled **before** handoff to `display-app`; runtime does not perform on-device AI/code generation during service
- Logo/icon upload:
  - Accepts **PNG, JPEG, SVG** (MVP decision)
  - Persists successfully (draft and/or asset records)
  - No required visible effect in preview/on-table in MVP

---

## B) Target Users & Primary Personas

- **Primary: Venue Owner / Brand Manager**
  - Goal: quickly generate branded Tales9 table themes from a brand description and menu
  - Note (MVP): logo upload does not affect output yet
- **Secondary: Venue operator / bartender**
  - Goal: reliably apply an approved theme to the table before service
- **Secondary: Tales9 pilot operator**
  - Goal: seed demo data (e.g., BARCODE), generate plans fast, run pilots smoothly

---

## C) Core User Journey(s)

### Journey 1: Create a theme → apply to table (MVP)

1. **(Optional) Asset Library**
  - Upload logo/icon (persist-only; no effect in MVP)
2. **New Design → Concept**
  - Enter Brand Description and/or select preset
  - Build Drink Menu via Add Drink modal
3. **Generate**
  - Generate Plans A/B/C (shows progress messaging)
  - Backed by Poe API (server-side/local orchestration; key not in browser)
4. **Compare**
  - Review and select a plan (A/B/C)
  - Selection triggers generation of “full assets” for that plan
5. **Edit**
  - Adjust palette/motion/lighting
  - Optionally submit Natural Language Editing
  - Save as Draft (optional)
6. **Apply**
  - SDK/admin tab calls a **runtime compile API** that converts selected/generated coaster visual assets into **PixiJS code-based runtime artifacts**
  - SDK/admin tab sends the compiled `ThemePackage` over **localhost WebSocket bridge**
  - display-app tab loads the package and ACKs success/failure

### Journey 2: Iterate between plans and edits

- From **Edit → Back to Plans → Compare**
- Select a different plan → regenerate full assets → continue editing

### Journey 3: Resume from Drafts

- Open a saved draft → restore prior Concept/Plan/Edits state
- Exact re-entry step after resuming a draft: **Edit page**

---

## D) UI Components List

### Global / Navigation

- Left nav: **New Design**, **Drafts**, **Asset Library**
- Stepper: **1 Concept / 2 Generate / 3 Compare / 4 Edit / 5 Apply**

### Concept

- Brand Description input
- Quick Presets buttons
- Drink Menu list + “Add Drink”

### Add Drink modal

- Drink Name
- Photo upload (mock)
- Ingredients list + “Add ingredient”
- Cancel / Save

### Generate

- “Generate Plans A/B/C”
- Status/progress text states

### Compare

- Plan cards/list (A/B/C)
- Select plan → generate full assets
- Back button

### Edit

- Color Palette controls (5 fields)
- Motion Profile controls (animation/speed/intensity)
- Lighting controls (glow color/intensity)
- Drinks — Coaster & Ingredient Sprites section
- Natural Language Editing text area
- Back to Plans / Save as Draft / Preview & Apply

### Edit Component modal

- Free-text adjustment prompt for a selected component (sprite/coaster/etc.)

### Apply

- Smart Bar Table preview container + status (“awaiting theme”)
- Back to Edit
- Apply to Table

### Drafts

- Draft list + empty state

### Asset Library

- Upload control (“Upload logo or icon”)
- Asset listing UI not shown in wireframe → **[needs decision]**

---

## E) App Behavior & State Machine

### Core states (screen + async jobs)

- **Concept**
  - Local edits mark draft “dirty”
  - Add Drink modal: idle → open → save/cancel
- **Generate (plans)**
  - idle → generatingPlans → plansReady | error
- **Compare**
  - idle → selectingPlan → generatingAssets → assetsReady | error
- **Edit**
  - idle/editing
  - naturalLanguageEdit: idle → submitting → applied | error
  - saveDraft: idle → saving → saved | error
- **Apply**
  - connection: disconnected → connecting → connected | error
  - applyTheme: idle → compilingRuntimePackage → sending → awaitingAck → applied | error

### Logo/icon upload behavior (Asset Library)

- idle → uploading → uploaded | error
- Validation (MVP decision):
  - Accept only PNG/JPEG/SVG
  - No additional size/dimension caps specified yet (flag as risk; see Open Questions)
- Persistence:
  - Store `Asset` record + attach to draft (optional) for continuity/future use
  - **MVP:** do not reference logo/icon in generator inputs, preview packaging, or runtime renderer

### Apply-to-table behavior (two-tab MVP)

- SDK/admin UI requests a **runtime compile API** to transform generated coaster visual assets into **PixiJS code-based runtime artifacts**
- Runtime compile API returns a **resolved `ThemePackage`**
- SDK/admin UI sends package over localhost WebSocket bridge
- display-app validates + loads into existing single Pixi instance
- display-app returns ACK:
  - success: show “applied”
  - failure: show error + allow retry

---

## F) Backend / State Contract Draft

### High-level topology (MVP decision)

- **Two browser tabs** on same mini PC:
  - Tab A: SDK/admin UI (this PRD)
  - Tab B: `display-app` fullscreen runtime (PixiJS)
- **Local WebSocket bridge** on `localhost` routes messages between the two clients
- **No auth** on bridge (trusted local network; aligns with CLAUDE.md “local-only” note)

### Entities (contracts; implementation-agnostic)

#### Draft

- id: string
- createdAt, updatedAt: ISO string
- step: `CONCEPT | GENERATE | COMPARE | EDIT | APPLY`
- brandDescription: string
- preset?: string
- drinks: DraftDrink[]
- plans?: DesignPlan[] (A/B/C)
- selectedPlanId?: string
- themeConfig?: ThemeConfig
- assets?: { status: `none|generating|ready|error`, error?: string }
- assetIds?: string[] (e.g., uploaded logo/icon references)

#### DraftDrink (authoring-facing; mapped into runtime DrinkProfile)

- id: string
- name: string
- ingredients: string[]
- photoAssetId?: string (**mock** UX; likely unused in MVP)

#### DesignPlan

- id: string (`A|B|C` or UUID)
- summary: string (short rationale)
- preview:
  - palette, motion, lighting (same shapes as ThemeConfig)
- status: `ready|generatingAssets|assetsReady|error`

#### ThemeConfig (wireframe-driven controls)

- palette:
  - primary, secondary, accent, background, text: string (hex)
- motion:
  - animation: `Pulse Glitch | Slow Drift | Wave Ripple | Firefly Float | Shimmer Drift | Scanline Scroll`
  - speed: `Slow | Moderate | Fast`
  - intensity: `Low | Moderate | High`
- lighting:
  - glowColor: string (hex)
  - glowIntensity: `VeryLow | Low | Moderate | High | Maximum`
- perDrinkOverrides?: Record<drinkId, { spriteCharacter?; coasterAnimationRef?; palette?; motion?; lighting? }>

#### ThemePackage (apply-time artifact; consumed by display-app)

- packageVersion: string
- themeConfig: ThemeConfig
- drinkProfiles: DrinkProfile[] (must align with CLAUDE.md `DrinkProfile` shape)
- assetRefs?: string[] (generated sprite sheets/textures for runtime)
- runtimeArtifacts?:
  - coasterAnimations?: Record<drinkId, {
      artifactType: `pixiCode`,
      entrypoint: string,
      sourceRef?: string,
      checksum?: string
    }>
- checksum?: string
- createdAt: ISO string

#### Asset (logo/icon persistence only in MVP)

- id: string
- type: `logo | icon | drinkPhoto`
- mimeType: string
- bytes?: number
- width?: number, height?: number
- storageRef: string (**[needs decision]**: local path vs blob key vs cloud ref)
- createdAt: ISO string

### WebSocket message contract (bridge protocol)

#### Handshake

- `CLIENT_HELLO` → `{ role: 'authoring'|'runtime', clientId?: string }`
- Optional `RUNTIME_READY` → `{ pixiReady: boolean }`

#### Theme delivery (required for MVP Apply)

- `APPLY_THEME` → `{ requestId: string, themePackage: ThemePackage }`
- `APPLY_THEME_ACK` → `{ requestId: string, ok: boolean, errorCode?: string, message?: string }`

#### Runtime compile API (required before MVP Apply)

- `COMPILE_THEME_RUNTIME` → internal API call from SDK/admin UI orchestration layer to backend/local compile service
- Request (conceptual):
  - `{ draftId?: string, selectedPlanId: string, themeConfig: ThemeConfig, generatedVisualAssets: { coasterAnimations: unknown[] }, drinkProfiles: DraftDrink[] }`
- Response (conceptual):
  - `{ ok: boolean, themePackage?: ThemePackage, errorCode?: string, message?: string }`
- Responsibility:
  - Convert generated coaster visual assets into **PixiJS code-based runtime artifacts**
  - Return a validated, versioned `ThemePackage` ready for `APPLY_THEME`

#### Optional preview (only if wired)

- `PREVIEW_THEME` / `PREVIEW_THEME_ACK` with same structure as apply

### AI integration contract (Poe; MVP decision)

- Poe base URL: `https://api.poe.com/v1`
- **Key constraint:** `POE_API_KEY` must not ship to browser; calls occur in a server-side/local orchestration layer
- Model routing (as specified in the updated doc):
  - Text/design/plans: `GPT-5.2`
  - Images: `imagen-4-fast`
  - Video: `wan-2.6`
- API surface:
  - Prefer Chat Completions for compatibility; use Responses only if absolutely necessary.

### Alignment to Tales9 display-app constraints (CLAUDE.md)

- ThemePackage must support data-driven mapping into:
  - `AnimationDispatcher` inputs (no hardcoded IDs/logic)
  - Single PixiJS Application instance lifecycle
  - Offline runtime operation after apply (no fetch requirement during session)
- `display-app` consumes **compiled PixiJS-ready runtime artifacts**; it does not call AI models or generate PixiJS code at runtime

---

## G) Open Questions for Refinement

### Wireframe gaps / UX decisions

- **Asset Library UI behavior**
  - Is there an asset list/thumbnail view? Replace/delete actions?
  - Are assets global or per-draft?

- **Validation rules**
  - Minimum fields for Add Drink (name required? at least 1 ingredient?)
  - Any constraints on number of drinks/ingredients for performance?

### Storage & offline decisions (logo + future generated assets)

- Pick storage approach for `Asset.storageRef`:
  - Local-only, bundled in ThemePackage, cloud-backed, or hybrid (A–D from the updated doc)
- Confirm offline expectations:
  - Generation can require internet during authoring, but **runtime session** must not

### Apply protocol and display-app integration

- Should the runtime support both `PREVIEW_THEME` and `APPLY_THEME`, or only apply?
- What validation does display-app perform before ACK (schema versioning, asset availability, checksum)?
- What format should the compiled coaster animation artifact use in practice:
  - raw PixiJS source string
  - prebuilt module/chunk
  - restricted animation DSL compiled to PixiJS-compatible code?

### Data model mapping (authoring drinks → runtime DrinkProfile)

- Add Drink modal doesn’t collect `category/price/flavorProfile/description` required by `DrinkProfile`
  - Decision: use defaults, infer via AI, or extend UI (wireframe doesn’t show extra fields)

### AI API specifics (Poe)

- Confirm Chat Completions vs Responses usage for MVP
- Confirm exact Poe model identifiers are valid at integration time (catalog may differ by casing/availability)
- Retry/backoff policy and rate-limit UX (progress + error copy)
- If AI is used to help generate coaster animation logic, define where the **compile step** ends and where deterministic validation/build begins

### Explicit MVP decision to reaffirm

- Logo/icon upload is **in scope** but has **no effect** on generation/preview/runtime in MVP  
  - Confirm this is acceptable for pilot expectations and demos.

---

## K) Implementation Decisions (locked 2026-05-11)

This section records the implementation-level decisions made before any code was written. It is the source of truth for stack, integration model, and resolved open questions; future PRD revisions should update here rather than diverging silently.

### Stack

| Layer | Choice |
|---|---|
| Admin UI | Single-file wireframe (`packages/salet6/index.html`) served by Vite on `:5173` |
| Bridge server | Node 20 + Express + `ws` |
| Validation | Zod (shared between UI and bridge) |
| Testing | Vitest (bridge/shared/runtime), supertest for bridge HTTP routes |
| Repo layout | npm workspaces under `packages/*` (`shared`, `bridge`, `salet6`) |

### AI integration

- Provider abstraction with two adapters:
  - `mock` (default, `PROVIDER=mock`): deterministic fixtures derived from input hash. Used in CI and during early development.
  - `poe` (`PROVIDER=poe`, requires `POE_API_KEY`): calls `https://api.poe.com/v1/chat/completions` (OpenAI-compatible). Models per Section F: `GPT-5.2` (text/design), `imagen-4-fast` (images), `wan-2.6` (video).
- `POE_API_KEY` is **only** ever present in the bridge process environment. The browser never sees it.

### Tales9 display-app integration

- The existing Tales9 display-app at `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/Tales9/display-app/` is **modified in place**. Salet6 does not stub or fork it.
- Modifications add a new WebSocket client connecting to the Salet6 bridge on `ws://localhost:8787/ws` as `role: 'runtime'`, a Zustand `useThemeStore` that holds the active `ThemePackage`, a refactor of `drinkCatalog.ts` so `getDrinkById` consults the runtime override before falling back to the static `defaultDrinkCatalog`, and a new `ThemeOverlay` PixiJS layer that applies palette / motion / lighting.
- Tales9's existing `Websocket Demo` server on `:8080` (used for iOS↔display-app `CONFIG_UPDATE` / `SESSION_START`) is **untouched**. Salet6 ships its own bridge on `:8787` for `APPLY_THEME` traffic. The display-app maintains two independent WebSocket clients.

### Apply effect

- `ThemePackage.drinkProfiles` fully replaces the static `defaultDrinkCatalog` at runtime. Drink IDs from Salet6 take precedence over the BARCODE-hardcoded set.
- `ThemeConfig.palette / motion / lighting` drive a global Pixi overlay (tint, animation speed/intensity scalars, glow color/intensity uniforms).
- Tales9's single PixiJS Application instance invariant and offline-after-apply requirement are honored.

### Two-tab dev model

- Salet6 admin UI runs on `localhost:5173` (Vite default).
- Tales9 display-app runs on its own Vite dev port (default `5174` if `5173` is taken, or whatever the Tales9 repo configures).
- This repo also provides a local fallback runtime at `packages/display-app-stub` for development when the sibling Tales9 repo is unavailable. The stub keeps only coaster placement dispatch: click to place/remove coaster, random drink assignment per placement, coaster animation + ingredient sprite rendering, and bridge `APPLY_THEME` ACK semantics.
- Bridge runs on `localhost:8787`.
- Both browser tabs run on the same dev machine in development; on production hardware (MOREFINE mini PC) the same two-tab arrangement applies.

### Resolved Open Questions (from Section G)

| Question | Resolution |
|---|---|
| Logo/icon file types | PNG, JPEG, SVG only |
| Logo/icon size cap | ≤ 5 MB (configurable; flagged as risk in PRD) |
| `Asset.storageRef` format | Absolute filesystem path on the bridge host (`packages/bridge/uploads/<id>.<ext>`) |
| Compiled coaster artifact format | PixiJS source string (`artifactType: 'pixiCode'`). MVP returns a stub source string with deterministic checksum; real codegen is deferred. |
| Display-app validation before ACK | Zod schema validation + `packageVersion` check. On failure, ACK with `ok:false, errorCode:'SCHEMA'`. |
| Preview vs Apply protocol | MVP implements `APPLY_THEME` only; `PREVIEW_THEME` is schema-defined but not wired in the UI. |
| Resume from Drafts re-entry step | Edit page (already specified in PRD §C Journey 3; reaffirmed) |
| Logo upload visible effect | None in MVP (persist-only). Confirmed acceptable. |

### Explicitly deferred (post-MVP)

- Real PixiJS coaster animation codegen from AI-generated visual assets (currently a stub source string)
- AI generation of `DrinkProfile.category` / `price` / `flavorProfile` / `description` from a `DraftDrink` (UI does not yet collect these)
- Drink photo upload processing beyond filename capture
- Ingredient sprite library curation / sprite generation
- Asset Library list / replace / delete UI (only upload is in scope)
- Authentication on the bridge (local-only trust assumed)
