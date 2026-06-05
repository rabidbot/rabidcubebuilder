# STATE.md — Session Log & SOPs for Rabid Cube Builder

## Current state (2026-06-05)

- **Repo:** https://github.com/rabidbot/rabidcubebuilder
- **Branch:** `main` (clean, up to date with origin)
- **Commits:** 2 (bootstrap + bugfix)
- **Last version:** `0.1.0` in package.json
- **Build status:** GitHub Actions queued after each push, builds Windows .exe + publishes release
- **CI/CD:** `.github/workflows/build.yml` — runs on push to main, `windows-latest`, Node 22, `npm ci && npm run electron:build`
- **Sibling project:** `/home/rabid/edh-deckbuilder/` — Commander deck builder (same stack, mature at v0.1.51)

## What we've built

- Full Electron + React 19 + Vite 8 + TypeScript 6 + Tailwind 4 + Zustand 5 + SQL.js stack
- 9-phase cube-building engine (`src/lib/cube-engine.ts`, ~710 lines)
- 10 canonical archetype matcher with keyword scoring (`src/lib/archetype-matcher.ts`)
- 100+ known cube staples, 60 signpost uncommons, 4-tier fixing lands (`src/lib/cube-seeds.ts`)
- Scryfall API client with batch `/cards/collection`, `/cards/search`, single-card fetch, rate limiting (`src/lib/scryfall.ts`)
- SQLite schema: `cards`, `collection`, `cubes`, `cube_cards` (with `locked` column pre-wired for Mode 2)
- 7-step cube wizard (type → size → archetypes → power → format → budget → themes/bans)
- Cube analysis view (curves, color balance, archetype coverage, power histogram, gaps)
- Card browser (grid/list toggle, filter by color/CMC/archetype, sort)
- Archetype dashboard (payoffs, enablers, synergy density, missing pieces)
- Export to CubeCobra / ManaBox / plain text formats
- 3 stubbed modes (1/2/3) with TODO placeholders
- All views wired in router, all stores working

## Mode 4 workflow (the complete mode)

1. `HomeView.tsx` → click "Theme-First Build" → routes to `/wizard`
2. `CubeWizard.tsx` — 7-step form collects: cube type, size, archetypes (multi-select), power level (slider 1-10), format restrictions, budget ceiling, theme keywords + banned cards
3. "Build Cube" triggers `cubeStore.build()` which:
   a. Searches Scryfall for card pool matching theme + format
   b. Runs 9-phase algorithm with progress callbacks
   c. Stores result in `cube` + `analysis` state
4. Auto-navigates to `/analysis` — full dashboard
5. From there: browse cards, per-archetype deep dive, export

## How to run

```bash
cd /home/rabid/cube-builder

# Browser dev server (no Electron, just Vite)
npm run dev                    # → http://localhost:5173

# Electron dev mode (Vite + Electron)
npm run electron:dev

# Build for production + publish (Windows only via GitHub Actions)
npm run electron:build
```

## SOPs — ALWAYS DO THIS AFTER CHANGES

1. **Lint:** `npx eslint .`
2. **Type check:** `npx tsc --noEmit`
3. **Commit:** `git add -A && git commit -m "prefix: description"`
4. **Push:** `git push`
5. **Version bump:** bump patch in `package.json` before every feature/fix commit
6. **Commit prefixes:** `feat:` for features, `fix:` for bugs, `chore:` for version-only

## Bugs we've fixed

| # | Commit | Issue |
|---|---|---|
| 1 | `5ecbe6a` | Missing `import './globals.css'` in main.tsx — no Tailwind styles |
| 2 | `5ecbe6a` | `Boxes` icon accidentally removed from OnboardingModal.tsx import — `ReferenceError`, entire app failed to mount |
| 3 | `168b078` | `searchCards` silently swallowed all errors — surfaced Scryfall errors as toasts |
| 4 | `6734de2` | Theme keywords with quotes broke Scryfall query syntax — added quote stripping + debug logging |

## Architecture decisions

- **Engine location:** Renderer-side in `src/lib/cube-engine.ts` (TypeScript). Yields with `setTimeout(0)` every 200 cards during Phase 2. All Scryfall calls go through IPC to Electron main for rate limiting.
- **Cancel path:** `cubeStore.build()` sets a closure-local `cancelled` flag. Engine checks `callbacks.cancelled()` between phases and after yield points. On cancel, engine throws, store cleans up.
- **Uniqueness taxonomy:** two-axis: `effectCategory` (removal/draw/ramp/counter/token/tutor/recursion/pump/land/creature/spell/artifact) × `effectScope` (single/mass/triggered/conditional). Cards sharing both axes get a powerScore × 0.85 penalty when >2 copies exist in a slot. Never hard-blocked.
- **`locked` column:** pre-wired in `cube_cards` schema as `locked BOOLEAN DEFAULT FALSE`. Used by Mode 2 suggestion engine to protect untouchable cards. Not yet wired into UI.
- **HashRouter required:** Electron `file://` compatibility.
- **Tailwind v4:** uses `@tailwindcss/vite` plugin + `@theme` block in `globals.css` (no tailwind.config.js).

## Key files map

| File | Lines | Purpose |
|---|---|---|
| `src/lib/cube-engine.ts` | 710 | 9-phase build algorithm |
| `src/lib/archetype-matcher.ts` | 290 | 10 archetypes, keyword scoring |
| `src/lib/cube-seeds.ts` | 230 | Staples, signposts, fixing lands |
| `src/lib/types.ts` | 170 | All TypeScript interfaces |
| `src/stores/cubeStore.ts` | 160 | Build state, config, cancel |
| `src/components/wizard/CubeWizard.tsx` | 370 | 7-step config form |
| `src/components/analysis/CubeAnalysisView.tsx` | 230 | Post-build dashboard |
| `src/components/browser/CardBrowser.tsx` | 244 | Grid/list card browser |
| `src/components/archetype/ArchetypeDashboard.tsx` | 183 | Per-archetype deep dive |
| `electron/main.cjs` | 270 | IPC handlers, HTTP server, SQL.js |

## Known gaps

- Modes 1, 2, 3: stubbed with "Coming soon" toasts. Only Mode 4 functional.
- `cubeStore.saveCube()` / `loadCube()` / `deleteCube()` / `fetchSavedCubes()`: stubs. DB schema fully supports persistence but wiring isn't done.
- No EDHREC or CubeCobra API integration.
- No banned list auto-detection from format legality.
- No PDF visual spoiler export.
- Electron production mode: HTTP server pattern is correct but untested in prod.
