# Changelog

## 2026-05-23
- [docs] Added root `requirements.txt` (Node primary + optional Week 11 MCP Python deps).
- [chore] Added grader-facing module comments on bridge, shared prompts, runtime stub, and authoring wireframe.
- [docs] Submission pack: include `.env` in course zip for live Poe demo (key expires ~3 days); `.env` remains gitignored.
- [docs] Trimmed `report/Salet6-Architecture-Report.md` to ~2-page target (merged sections, compact tables).
- [feat] Updated `packages/salet6/index.html` (Custom empty preset, uniform short brand descriptions, removed mock demo label; Concept starts blank).
- [fix] Plan-generation prompt hint: invoke authoring bridge synchronously when already loaded; keep hint visible on loader panel until navigation (was cleared same tick as API response).
- [feat] Apply page preview: coaster spots doubled in area (96px), drink photos stay 48px; removed perimeter ingredient sprite orbs.
- [fix] Poe `selectPlan`: merge partial LLM `themeConfig` (e.g. missing `motion`) from selected plan preview before Zod validation to avoid silent mock fallback.
- [chore] Removed debug instrumentation from `packages/bridge/src/providers/poe.ts`.
- [fix] Apply page: Runtime ready banner is grey/neutral with “press Apply to Table” instead of green success styling.
- [fix] Display-app-stub resets table (Pixi coasters/sprites, dispatcher, coaster counter) on each APPLY_THEME.
- [chore] Removed debug instrumentation from `packages/salet6/index.html` and `authoring-bridge.ts`.
- [feat] Added `packages/shared/src/promptBuilders.ts` and optional `promptUsed` on generate/select-plan responses; wired bridge providers.
- [feat] Added `packages/salet6/src/authoring-bridge.ts` (`@salet/shared` + Pixi.js module for prompt builders and preview coaster mount).

## 2026-05-22
- [fix] Display stub drink photos: Apply now merges `imageUrls` from `currentTheme.drinks[].drinkSprite.svg` (not only `currentDrinkProfiles.imageUrl`); stub loader accepts data URLs and bridge `/uploads` URLs.
- [feat] Updated `packages/display-app-stub` coaster visuals: drink photos at 2× scale, coaster animation at 3.5×, animation layered above drink image (fallback + LLM runtime).
- [fix] Coaster codegen dry-run `javascript is not defined`: Poe fence cleaner now uses shared `unfenceCoasterSource` (strips `javascript`/`js` fences and bare language-tag lines left when only backticks were removed).
- [chore] Removed debug instrumentation from display-app-stub (drink image load, theme apply, PLAY handler).
- [chore] Removed debug instrumentation from `poe.ts`, `drinkCharacter.ts`, and `packages/salet6/index.html`.
- [fix] Flux/Poe drink images: `extractImageUrlFromPoeContent`, bridge `cacheRemoteImageForUi` on `/generate-drink-character`, Salet6 `drinkImageDisplayUrl` + CSP `img-src` for localhost:8787 and poecdn.
- [fix] Updated `packages/bridge/src/loadEnv.ts` (`override: true` on root `.env` so shell-exported `POE_API_KEY` does not shadow the repo file; startup key fingerprint log).
- [fix] Updated `packages/bridge/src/loadEnv.ts` and `server.ts` (load repo root `.env` before workspace `.env`; log resolved Poe models at startup; `/api/health` exposes model names).
- [feat] Updated `packages/bridge/src/providers/poe.ts` and `.env.example` (`POE_IMAGE_MODEL` for drink previews and Imagen asset generation; default `imagen-4-fast`).
- [feat] Added `packages/bridge/src/coaster/` (standardized coaster codegen prompt, bridge dry-run validation, validate-and-retry service); updated Poe provider, coaster HTTP route, mock fallback, and Salet6 Apply workflow to pass drink profile metadata.
- [feat] Updated `packages/salet6/index.html` (Dark Forest preset prefills 2 drinks: Moss Grove, Firefly Fizz).
- [fix] Split `@salet/shared` coaster prep into `coaster-entrypoint-core` (browser-safe) and `coaster-entrypoint` (esbuild, bridge only); removed barrel export that pulled `esbuild` into the display stub and crashed React with `process is not defined`.
- [chore] Removed debug instrumentation from display-app-stub, bridge (`poe.ts`, `pixi.ts`, `router.ts`), and `packages/salet6/index.html`.
- [chore] Updated `packages/bridge/src/providers/poe.ts` and `.env.example` (NL edit `POE_EDIT_MODEL` and coaster codegen `POE_CODE_MODEL` default to `gemini-3.5-flash`).

- [debug] Updated `packages/salet6/index.html` (instrument Apply flow + bridgePost abort/WS ACK timing to diagnose “Fetch is aborted” on Apply).
- [fix] Updated `packages/bridge/src/compile/pixi.ts` and `packages/display-app-stub/src/pixi/PixiRuntime.ts` (make compiled coaster artifacts return `{ container, destroy, tick }` and normalize `export default` outputs so runtime can execute generated PixiJS coaster code instead of falling back).
- [fix] Added `packages/shared/src/coasterEntrypoint.ts` (TS→JS sanitizer + dynamic factory resolver for `mountCoaster`/`create*` names); wired into bridge compile, `PixiRuntime`, Poe coaster prompt, and mock codegen.
- [fix] Updated `packages/shared/src/coasterEntrypoint.ts` (esbuild TS transpile for Poe coaster code; per-drink codegen timeout 180s + continue-on-failure in Apply).

## 2026-05-21

- [feat] Updated `packages/shared/src/schemas.ts` (new Step A/B response schemas, `DesignPlan.name`, new asset types, Imagen assets response).
- [feat] Updated `packages/shared/src/types.ts` (export response/Imagen types; remove legacy `DesignPlanStatus`).
- [test] Updated `packages/shared/src/__tests__/schemas.test.ts` (DesignPlan now requires `name`).
- [feat] Updated `packages/bridge/src/providers/index.ts` (new select-plan/Imagen/coaster interfaces and response shapes).
- [feat] Updated `packages/bridge/src/providers/mock.ts` (Step A/B output shapes, coaster code stub, Imagen assets stub).
- [feat] Updated `packages/bridge/src/providers/poe.ts` (new Step A/B/C/D prompts, JSON validation, codegen + Imagen support).
- [feat] Updated `packages/bridge/src/http/selectPlan.ts` (accepts `selectedPlan`, returns Step B payload).
- [feat] Added `packages/bridge/src/http/coasterCodegen.ts` (`/api/generate-coaster-animation` endpoint).
- [feat] Added `packages/bridge/src/http/imagenAssets.ts` (`/api/generate-imagen-assets` endpoint + local caching).
- [feat] Updated `packages/bridge/src/app.ts` (mount new endpoints, serve `/uploads`).
- [feat] Updated `packages/bridge/src/http/compile.ts` (accept draft drinks + optional coaster artifacts).
- [feat] Updated `packages/bridge/src/compile/pixi.ts` (deterministic `DrinkProfile` build, optional artifact override).
- [feat] Updated `packages/display-app-stub/src/engine/AnimationDispatcher.ts` (pass runtime artifacts + themeConfig in PLAY).
- [feat] Updated `packages/display-app-stub/src/pixi/PixiRuntime.ts` (execute runtime coaster code when provided).
- [feat] Updated `packages/salet6/index.html` (new plan response shape, Step B payload, Imagen assets UI, coaster codegen on apply).
- [test] Updated `packages/bridge/src/__tests__/providers.test.ts` (new provider response shapes).
- [test] Updated `packages/bridge/src/__tests__/http.test.ts` (new endpoint payloads + compile body).
- [test] Removed `packages/bridge/src/__tests__/selectPlan.test.ts` (obsolete `withPlanId` helper).

## 2026-05-20

- [docs] Updated `CLAUDE.md` (wireframe authoring UI, display-app-stub, dev:all, HTTP/WS API table, Imagen/asset-proxy flow, archived React app).
- [chore] Removed debug instrumentation from `packages/salet6/index.html`, `packages/display-app-stub/src/pixi/CoasterAnimation.ts`, `AnimationDispatcher.ts`, and `App.tsx`.
- [fix] Updated `packages/bridge/src/http/selectPlan.ts` and `packages/bridge/src/providers/poe.ts` (ensure `plan.id` is always set from request `planId` when Poe JSON omits it — fixes “Plan undefined” and “Select a plan before applying”).
- [fix] Updated `packages/salet6/index.html` (fallback `selectedPlanId` from compare card / `planLabel`; apply uses `planIdForCompile`; draft restore sets plan id).
- [test] Created `packages/bridge/src/__tests__/selectPlan.test.ts` (`withPlanId` normalizes missing plan ids).
- [feat] Added `packages/bridge/src/http/assetProxy.ts` and registered `/api/asset-proxy` (server-side fetch of Imagen URLs with CORS headers for Pixi in the display stub).
- [fix] Updated `packages/display-app-stub/src/pixi/CoasterAnimation.ts` (load proxied drink images via `fetch` + `createImageBitmap` + `Texture.from` instead of `Assets.load`, which failed on extensionless `/api/asset-proxy?url=` URLs).
- [feat] Added `packages/display-app-stub/src/pixi/drinkImageUrl.ts` and updated `CoasterAnimation.ts` to load drink photos via the bridge proxy (avoids browser CORS blocking direct Poe CDN URLs).
- [feat] Updated `packages/display-app-stub/src/pixi/CoasterAnimation.ts` (loads optional Imagen `imageUrl` at coaster center; animation rings use local coords so they surround the photo).
- [feat] Updated `packages/display-app-stub/src/pixi/PixiRuntime.ts` and `packages/display-app-stub/src/engine/AnimationDispatcher.ts` (pass profile `imageUrl` into coaster PLAY; removed duplicate center-screen drink character spawn).
- [feat] Updated `packages/shared/src/schemas.ts` (`DrinkProfile.imageUrl` optional field for Imagen preview URLs).
- [feat] Updated `packages/salet6/index.html` (merge/sync `imageUrl` from NPC generation and theme drinks into compile/apply payload).
- [test] Updated `packages/display-app-stub/src/engine/AnimationDispatcher.test.ts` (coaster confirm emits PLAY only).
- [chore] Updated `packages/bridge/src/providers/poe.ts` (default `POE_TEXT_MODEL` / `TEXT_MODEL` changed from `gpt-5.5` to `gpt-5.2-instant`).
- [docs] Updated `.env.example`, `README-SUBMISSION.md`, `FINAL_PROJECT_SUBMISSION.md`, and `report/Salet6-Architecture-Report.md` to document `gpt-5.2-instant` as the default text model.

## 2026-05-15

- [fix] Updated `packages/bridge/src/providers/poe.ts` (`extractPoeResponseText` reads nested `output[].content[].text` when top-level `output_text` is empty, fixing silent mock fallback on HTTP 200; debug instrumentation removed after verification).
- [test] Created `packages/bridge/src/__tests__/poeResponse.test.ts` (unit tests for Poe response text extraction).
- [docs] Updated `Salet6PRD.md` stack table (admin UI now in-repo wireframe served from `packages/salet6/index.html`; testing row now reflects bridge/shared/runtime focus).
- [docs] Updated `report/Salet6-Architecture-Report.md` (wireframe now active app at `packages/salet6/index.html`; prior React app archived to `archive/salet6-react`).
- [docs] Updated `FINAL_PROJECT_SUBMISSION.md` (all wireframe references now point to `packages/salet6/index.html`; checklist text updated for wireframe-first migration).
- [docs] Updated `README-SUBMISSION.md` (documents wireframe as active `packages/salet6` app, archives old React path, and correct bridge endpoint names).
- [refactor] Archived old React Salet6 app to `archive/salet6-react/` (`src`, prior `package.json`, `tsconfig*.json`, and `vite.config.ts` moved out of active workspaces).
- [feat] Replaced `packages/salet6/index.html` with the in-repo wireframe app and converted `packages/salet6` into a static Vite workspace (`package.json`, `vite.config.ts` with `hmr:false`).
- [docs] Created `README-SUBMISSION.md` (grader quick-start: install, test, dev:all demo, env vars, API table, troubleshooting).
- [docs] Created `report/Salet6-Architecture-Report.md` (2–3 page system architecture report: pipeline, prompt engineering, RAG/function-calling framing, imagen/gpt models, design alignment).
- [docs] Updated `FINAL_PROJECT_SUBMISSION.md` (step-by-step submission checklist, project context, rubric mapping, architecture-report outline tied to packages/wireframe/PRD/Poe doc).
- [docs] Added `docs/Poe-Canvas-Salet6-Prototype-Interactions.md` (chronological log of Poe Canvas-Creator chat iterations, UX decisions, and screen-level mock interactions for the Salet6 prototype).
- [docs] Created `FINAL_PROJECT_SUBMISSION.md` (course final project deliverables and due date).

## 2026-05-11 (continued — stub apply fix + drink character generation)

### This repo

- [fix] Updated `packages/display-app-stub/src/ui/App.tsx` (fixed RUNTIME_READY timing race: Pixi init and WebSocket open now coordinated via two flags; RUNTIME_READY only sent after both are ready, preventing silent drop when Pixi finishes before WS opens).
- [fix] Updated `packages/display-app-stub/src/bridge/runtimeBridgeClient.ts` (added error ACK on APPLY_THEME schema validation failure: instead of silently dropping, extracts requestId and sends `APPLY_THEME_ACK { ok:false, errorCode:'SCHEMA' }` back to authoring, preventing ACK timeout).
- [feat] Updated `packages/bridge/src/providers/index.ts` (added `DrinkCharacterInput`, `DrinkCharacterResult` interfaces; added `generateDrinkCharacter` to `Provider` interface).
- [feat] Updated `packages/bridge/src/providers/mock.ts` (implemented `generateDrinkCharacter`: deterministic description, animationFamily, colorPalette, spriteCharacter from drink name hash; imageUrl always null in mock).
- [feat] Updated `packages/bridge/src/providers/poe.ts` (implemented `generateDrinkCharacter`: GPT-5.5 text call for characterData JSON; imagen-4-fast image call for visual preview; added `generateImage` private method with multi-format URL extraction).
- [feat] Created `packages/bridge/src/http/drinkCharacter.ts` (`POST /api/generate-drink-character` route with Zod body validation).
- [feat] Updated `packages/bridge/src/app.ts` (mounted `drinkCharacterRouter`).
- [feat] Updated `packages/salet6/src/api/bridge.ts` (added `DrinkCharacterResult` type + `generateDrinkCharacter` API function).
- [feat] Updated `packages/salet6/src/components/DrinkPreviewCard.tsx` (added optional `imageUrl` prop: shows AI-generated image instead of emoji when available; shows drink description below name).
- [feat] Updated `packages/salet6/src/components/DrinkPreviewCard.css` (added `.character-generated-img`, `.drink-card-description` styles).
- [feat] Updated `packages/salet6/src/screens/Edit.tsx` (added `charLoading/charImages/charError` per-drink state; `handleGenerateCharacter` calls `/api/generate-drink-character`, stores imageUrl and applies AI characterData back to DrinkProfile in store; added `✦ Generate` button per drink alongside Adjust).



Format: newest first. One bullet per file edit. Phase tags in brackets, e.g. `[P0]`.

## 2026-05-11 (continued — Poe Responses API)

### This repo

- [fix] Updated `packages/bridge/src/providers/poe.ts` (switched from `/v1/chat/completions` + `messages[]` to `/v1/responses` + `input` string; parse `output_text` from response; default model updated to `gpt-5.5`).

## 2026-05-11 (continued — Poe provider fixes)

### This repo

- [fix] Updated `packages/bridge/src/server.ts` (added `import 'dotenv/config'` so `packages/bridge/.env` is loaded at startup — was silently ignoring the env file, causing `POE_API_KEY` to be undefined at runtime).
- [fix] Updated `packages/bridge/src/providers/poe.ts` (changed default `TEXT_MODEL` from `GPT-5.2` to `Claude-Sonnet-4.6` — GPT-5.2 does not exist on Poe's platform).

## 2026-05-11 (continued — wireframe live bridge demo)

### This repo

- [fix] Updated `packages/bridge/src/providers/poe.ts` image generation path (`generateImage` now uses Poe `chat/completions` with `imagen-4-fast` and extracts image URLs from assistant content, replacing unsupported `responses` call that returned 400 and caused persistent NPC fallback visuals).
- [feat] Updated `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/wireframe.html` Edit flow to call real drink NPC image generation (`POST /api/generate-drink-character`) using the brand concept as `themeHint`; added `Generate NPC Images (Imagen)` control + status text and auto-trigger after plan selection, while preserving local fallback visuals when image generation fails.
- [fix] Updated `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/wireframe.html` apply pipeline robustness (normalizes provider-returned `ThemeConfig` and `drinkProfiles` to shared schema-safe enums/fields before `/api/select-plan` and `/api/compile-runtime`, preventing compile/apply failures in Poe mode due to non-canonical values).
- [feat] Updated `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/wireframe.html` preset list (added `BARCODE` chip and mapped it to the same Barcode description + catalog-style drinks used in `packages/salet6/src/screens/Concept.tsx` / `packages/salet6/src/data/catalogDrinks.ts`; selecting preset now also refreshes drink gallery).
- [fix] Updated `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/wireframe.html` CSP (removed `upgrade-insecure-requests` and `block-all-mixed-content` so local bridge calls to `http://localhost:8787` / `ws://localhost:8787` are not auto-upgraded and blocked as "Load failed").
- [docs] Integrated `/Users/jimbook/Library/Mobile Documents/com~apple~CloudDocs/收件箱/wireframe.html` with live bridge APIs and authoring WebSocket apply flow (`/api/generate-plans`, `/api/select-plan`, `/api/nl-edit`, `/api/compile-runtime`, `APPLY_THEME`).
- [chore] Updated `CHANGELOG.md` (recorded wireframe live bridge demo integration and verification).

## 2026-05-11 (continued — DrinkPreviewCard)

### This repo

- [feat] Created `packages/salet6/src/components/DrinkPreviewCard.css` (CSS keyframe animations for four animationFamily variants: Radial Pulse / Ring Glow / Orbit Ring / Beam Burst; coaster ring and CHARACTER block layout).
- [feat] Created `packages/salet6/src/components/DrinkPreviewCard.tsx` (DrinkProfile preview card: animated coaster ring by animationFamily with colorPalette[0] tint, family label, emoji CHARACTER avatar from spriteCharacter, drink name + ingredients).
- [feat] Updated `packages/salet6/src/screens/Edit.tsx` (replaced plain name/ingredients drink row with DrinkPreviewCard + Adjust button per drink).

## 2026-05-11 (continued — display-app stub clone)

### This repo

- [feat] Updated `package.json` (added `dev:stub` and `dev:all` scripts to run the new runtime stub alongside bridge + salet6).
- [chore] Updated `package-lock.json` (installed dependencies for the new `@salet/display-app-stub` workspace).
- [docs] Updated `Salet6PRD.md` (documented `packages/display-app-stub` fallback runtime and its reduced coaster-dispatch-only behavior in the two-tab dev model).
- [feat] Created `packages/display-app-stub/package.json` (new workspace package with React/Vite/Pixi/Zustand + Vitest scripts).
- [feat] Created `packages/display-app-stub/tsconfig.json` (workspace TS config for browser source and composite build).
- [feat] Created `packages/display-app-stub/tsconfig.node.json` (Vite config type-check setup).
- [feat] Created `packages/display-app-stub/vite.config.ts` (Vite + React config, stub dev port, jsdom test environment).
- [feat] Created `packages/display-app-stub/index.html` (SPA host shell for the runtime stub).
- [feat] Created `packages/display-app-stub/src/main.tsx` (stub app entrypoint and stylesheet wiring).
- [feat] Created `packages/display-app-stub/src/styles.css` (fullscreen runtime canvas + HUD styling).
- [feat] Created `packages/display-app-stub/src/engine/constants.ts` (`CANVAS_SIZE` constant aligned with Tales9 runtime coordinate space).
- [feat] Created `packages/display-app-stub/src/engine/random.ts` (deterministic-friendly random picker utility for per-placement drink assignment).
- [feat] Created `packages/display-app-stub/src/engine/AnimationDispatcher.ts` (command dispatcher for PLAY/STOP/SPAWN/DESPAWN driven by assigned drinks).
- [feat] Created `packages/display-app-stub/src/engine/random.test.ts` (unit tests for random picker behavior).
- [feat] Created `packages/display-app-stub/src/engine/AnimationDispatcher.test.ts` (unit tests for dispatcher command emission order).
- [feat] Created `packages/display-app-stub/src/state/themeStore.ts` (Zustand store for applied `ThemePackage` state and drink lookup).
- [feat] Created `packages/display-app-stub/src/types/fallbackDrinks.ts` (minimal local drink catalog fallback when no theme is applied yet).
- [feat] Created `packages/display-app-stub/src/bridge/runtimeBridgeClient.ts` (bridge runtime websocket client handling `CLIENT_HELLO`, `APPLY_THEME`, and `APPLY_THEME_ACK`).
- [feat] Created `packages/display-app-stub/src/pixi/CoasterAnimation.ts` (drink-family-driven coaster animation renderer).
- [feat] Created `packages/display-app-stub/src/pixi/IngredientSprite.ts` (procedural ingredient sprite with drop-to-edge and perimeter-walk behavior).
- [feat] Created `packages/display-app-stub/src/pixi/PixiRuntime.ts` (single PixiJS app lifecycle, dispatcher subscription, animation/sprite mount management).
- [feat] Created `packages/display-app-stub/src/ui/App.tsx` (click-to-place/remove coaster simulator with random drink assignment and runtime status HUD).
- [feat] Created `packages/display-app-stub/src/vite-env.d.ts` (Vite type declarations).

## 2026-05-11 (continued — mock mode fix)

### This repo

- [fix] Updated `packages/bridge/src/providers/index.ts` (made `themeConfig` optional in `SelectPlanInput` interface to match the HTTP body schema).
- [fix] Updated `packages/bridge/src/providers/mock.ts` (`generateAssets` now falls back to a deterministic `buildPlan()` preview when `themeConfig` is absent — fixes "Cannot read properties of undefined (reading 'palette')" crash in mock mode).

## 2026-05-11 (continued — catalog + preset drinks)

### This repo

- [feat] Updated `packages/salet6/src/store/useDraftStore.ts` (added `setDrinks` action to replace entire drinks array at once).
- [feat] Created `packages/salet6/src/data/catalogDrinks.ts` (CATALOG_DRINKS: 6 DraftDrink[] entries mirroring Tales9 defaultDrinkCatalog).
- [feat] Updated `packages/salet6/src/screens/Concept.tsx` (Cyberpunk + Retro Arcade presets now include pre-filled drinks; added "Import from Catalog" toggle showing Tales9 drinks with per-row Add buttons; Add disabled when drink already in menu).

## 2026-05-11 (continued — repo reorganization)

### This repo

- [chore] Moved course materials (`AIforDesign_CourseFiles/`), media samples (`Sample/`), and Tales9 reference docs into `ExternalReference/`; dropped tracked `.DS_Store` under moved trees; added `ExternalReference/display-app替身`.

## 2026-05-11 (continued — bugfix)

### This repo (select-plan null themeConfig fix)

- [fix] Updated `packages/bridge/src/http/selectPlan.ts` (made `themeConfig` optional in Zod body schema; prevents 400 when called from Compare before theme is configured).
- [fix] Updated `packages/salet6/src/api/bridge.ts` (omit `themeConfig` from request body when null; avoids sending JSON null to bridge).
- [fix] Updated `packages/salet6/src/screens/Compare.tsx` (initialize `themeConfig` from `result.plan.preview` on plan selection; also store `drinkProfiles` from result; Edit screen now pre-populated).

## 2026-05-11 (continued — Phase 13)

### This repo (Phase 13 — dev launcher)

- [P13] Updated `package.json` (added concurrently devDependency; added `dev` script running bridge + salet6 concurrently with color prefixes).

## 2026-05-11 (continued)

### This repo (Salet6 + bridge)

- [P0] Created `package.json` (npm workspaces root).
- [P0] Created `tsconfig.base.json` (TS strict baseline).
- [P0] Created `.gitignore`.
- [P0] Created `.env.example` (PROVIDER, POE_API_KEY, BRIDGE_PORT).
- [P0] Created `CLAUDE.md` (coding standards + Ralph Loop discipline).
- [P0] Created `CHANGELOG.md` (this file).
- [P0] Appended §K Implementation Decisions to `Salet6PRD.md` (stack, AI provider abstraction, Tales9 integration model, two-tab dev, resolved open questions, deferred items).
- [P1] Created `packages/shared/package.json` (@salet/shared workspace; zod + vitest).
- [P1] Created `packages/shared/tsconfig.json` (extends base; strict).
- [P1] Created `packages/shared/src/schemas.ts` (Zod schemas: Palette, ThemeConfig, DrinkProfile, DraftDrink, DesignPlan, ThemePackage, Asset, Draft + validators).
- [P1] Created `packages/shared/src/messages.ts` (WS message discriminated union with Zod).
- [P1] Created `packages/shared/src/types.ts` (TS types inferred from Zod schemas).
- [P1] Created `packages/shared/src/index.ts` (barrel export).
- [P1] Created `packages/shared/src/__tests__/schemas.test.ts` (17 tests covering schemas + messages).
- [P2] Created `packages/bridge/package.json` (Express, ws, multer, cors, supertest, tsx).
- [P2] Created `packages/bridge/tsconfig.json`.
- [P2] Created `packages/bridge/src/providers/index.ts` (Provider interface + selectProvider env switch).
- [P2] Created `packages/bridge/src/providers/mock.ts` (deterministic fixtures from sha256 input hash).
- [P2] Created `packages/bridge/src/providers/poe.ts` (OpenAI-compat adapter for api.poe.com/v1 with mock fallback on errors).
- [P2] Created `packages/bridge/src/compile/pixi.ts` (stub PixiJS source per drink + sha256 checksum, valid ThemePackage output).
- [P2] Created `packages/bridge/src/http/_utils.ts` (okJson/errJson helpers).
- [P2] Created `packages/bridge/src/http/generate.ts` (POST /api/generate-plans).
- [P2] Created `packages/bridge/src/http/selectPlan.ts` (POST /api/select-plan).
- [P2] Created `packages/bridge/src/http/nlEdit.ts` (POST /api/nl-edit).
- [P2] Created `packages/bridge/src/http/compile.ts` (POST /api/compile-runtime).
- [P2] Created `packages/bridge/src/http/assets.ts` (POST /api/assets; multer memory storage; PNG/JPEG/SVG MIME + magic-bytes check; ≤5 MB).
- [P2] Created `packages/bridge/src/app.ts` (createApp DI of provider + uploadsDir; /api/health).
- [P2] Created `packages/bridge/src/ws/router.ts` (authoring↔runtime forwarding; NO_PEER and INVALID_JSON BRIDGE_ERROR replies).
- [P2] Created `packages/bridge/src/server.ts` (HTTP + WebSocketServer bootstrap on BRIDGE_PORT).
- [P2] Created bridge tests: `providers.test.ts` (9), `http.test.ts` (14 supertest cases), `wsRouter.test.ts` (4 real-socket forwarding cases). 27 bridge + 17 shared = 44 passing.

- [P3] Created `packages/salet6/package.json` (@salet/salet6 workspace; react, zustand, react-router-dom, vite, vitest/jsdom).
- [P3] Created `packages/salet6/tsconfig.json` (extends base; jsx=react-jsx; bundler moduleResolution).
- [P3] Created `packages/salet6/tsconfig.node.json` (vite.config.ts compilation).
- [P3] Created `packages/salet6/vite.config.ts` (Vite 5 + React plugin; port 5173; vitest jsdom env).
- [P3] Created `packages/salet6/index.html` (SPA shell with #root).
- [P3] Created `packages/salet6/src/main.tsx` (StrictMode + BrowserRouter root).
- [P3] Created `packages/salet6/src/App.tsx` (React Router 6 routes: /, /new/*, /drafts, /assets; NewDraftLayout with Stepper).
- [P3] Created `packages/salet6/src/store/useDraftStore.ts` (Zustand: step, brandDescription, drinks, plans, themeConfig; canAdvanceTo guard).
- [P3] Created `packages/salet6/src/store/useConnectionStore.ts` (Zustand: status disconnected/connecting/connected/error).
- [P3] Created `packages/salet6/src/components/Nav.tsx` (left nav with status indicator).
- [P3] Created `packages/salet6/src/components/Stepper.tsx` (5-step stepper; respects canAdvanceTo guards).
- [P3] Created `packages/salet6/src/screens/Concept.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/Generate.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/Compare.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/Edit.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/Apply.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/Drafts.tsx` (placeholder).
- [P3] Created `packages/salet6/src/screens/AssetLibrary.tsx` (placeholder).
- [P3] Created `packages/salet6/src/__tests__/setup.ts` (@testing-library/jest-dom setup).
- [P3] Created `packages/salet6/src/__tests__/stores.test.ts` (20 tests: useDraftStore CRUD + canAdvanceTo guards + useConnectionStore).
- [P4] Updated `packages/salet6/src/screens/Concept.tsx` (brand description textarea, 6 preset buttons, drink list, Add Drink modal integration, Next guard).
- [P4] Created `packages/salet6/src/components/AddDrinkModal.tsx` (name + ingredients; Enter-key add; per-field validation; onAdd/onClose callbacks).
- [P4] Created `packages/salet6/src/__tests__/concept.test.tsx` (17 tests: ConceptScreen interactions + AddDrinkModal lifecycle/validation).
- [P5] Created `packages/salet6/src/api/bridge.ts` (fetch wrappers: generatePlans, selectPlan, nlEdit, compileRuntime).
- [P5] Updated `packages/salet6/src/screens/Generate.tsx` (state machine idle→loading→ready|error; retry; Next guard).
- [P5] Created `packages/salet6/src/__tests__/generate.test.tsx` (7 tests: status transitions, loading disable, success, 500 error, retry).
- [P6] Updated `packages/salet6/src/screens/Compare.tsx` (plan cards with palette swatches; selectPlan API call; assetsReady unlocks Edit).
- [P6] Created `packages/salet6/src/__tests__/compare.test.tsx` (6 tests: empty state, plan cards render, API success/error, Next guard).
- [P7] Updated `packages/salet6/src/store/useDraftStore.ts` (added drinkProfiles, saveDraft/loadDraft with localStorage persistence, SavedDraft type).
- [P7] Updated `packages/salet6/src/screens/Edit.tsx` (palette hex inputs, motion dropdown/radios, lighting radios, NL edit form, Save as Draft, EditComponentModal per-drink).
- [P7] Created `packages/salet6/src/components/EditComponentModal.tsx` (per-drink NL prompt modal).
- [P7] Created `packages/salet6/src/__tests__/edit.test.tsx` (12 tests: palette/motion/lighting/NL controls, draft save/restore, EditComponentModal open).
- [P8] Created `packages/salet6/src/api/ws.ts` (WS authoring client: connectWs, applyTheme with 5s ACK timeout, disconnectWs; integrates with useConnectionStore).
- [P8] Updated `packages/salet6/src/screens/Apply.tsx` (compile→connect→send flow; step labels; error paths).
- [P8] Created `packages/salet6/src/__tests__/apply.test.tsx` (8 tests: success, compile error, connect error, ACK timeout, ok:false, disable while working).
- [P9] Updated `packages/salet6/src/screens/Drafts.tsx` (localStorage-backed list, Resume→loadDraft+navigate, Delete, empty state).
- [P9] Created `packages/salet6/src/__tests__/drafts.test.tsx` (5 tests: empty state, list render, resume, delete, persist+restore round-trip).
- [P10] Updated `packages/salet6/src/screens/AssetLibrary.tsx` (file upload with PNG/JPEG/SVG+5MB validation, POST /api/assets, asset list).
- [P10] Updated `packages/salet6/src/api/bridge.ts` (added uploadAsset function).
- [P10] Created `packages/salet6/src/__tests__/assetLibrary.test.tsx` (7 tests: empty state, valid PNG/JPEG upload, bad MIME rejection, oversized rejection, server error).

### Tales9 display-app (Phase 11)

- [P11] Created `display-app/src/types/themePackage.ts` (ThemePackage type snapshot from @salet/shared + THEME_PACKAGE_SHAPE_VERSION).
- [P11] Created `display-app/src/store/useThemeStore.ts` (Zustand: applyTheme, clearTheme, getDrinkProfileById).
- [P11] Modified `display-app/src/data/drinkCatalog.ts` (added defaultDrinkCatalog; getDrinkById prefers useThemeStore runtime override).
- [P11] Created `display-app/src/services/themeBridgeClient.ts` (WS role:runtime; CLIENT_HELLO; APPLY_THEME with schema validation + ACK).
- [P11] Modified `display-app/src/main.tsx` (initThemeBridgeClient behind VITE_SALET_BRIDGE_URL).
- [P11] Created 3 new test files in Tales9 (useThemeStore 6t, themeBridgeClient 5t, themePackageSnapshot 2t); all 12 suites pass (113 tests).

### Tales9 display-app (Phase 12)

- [P12] Created `display-app/src/pixi/ThemeOverlay.ts` (PIXI layer: glow tint overlay rect via Graphics, ColorMatrixFilter saturation boost, speedScalar property; subscribes to useThemeStore).
- [P12] Modified `display-app/src/pixi/PixiStage.tsx` (import + mount ThemeOverlay after GameLayer; destroy in init effect cleanup).
- [P12] Created `display-app/src/__tests__/ThemeOverlay.test.ts` (11 tests: SPEED_SCALAR map, syncTheme param mapping for speed/intensity/glow, mount/subscribe/destroy); all 13 suites pass (124 tests).

## Failed attempts

- (none yet)
