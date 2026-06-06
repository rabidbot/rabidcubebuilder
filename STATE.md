# STATE.md — Session Log & SOPs for Rabid Cube Builder

## Current state (2026-06-06)

- **Repo:** https://github.com/rabidbot/rabidcubebuilder
- **Branch:** `main` (clean, up to date with origin)
- **Commits:** 10 (bootstrap + 7 fixes + 2 state updates)
- **Last version:** `0.1.6` in package.json
- **Build status:** GitHub Actions runs on every push, builds Windows .exe, publishes release
- **CI/CD:** `.github/workflows/build.yml` — push to main → `windows-latest`, Node 22, `npm ci && npm run electron:build`
- **Sibling project:** `/home/rabid/edh-deckbuilder/` — Commander deck builder (same stack, mature at v0.1.51)

## Git SOPs — ALWAYS DO THIS AFTER EVERY CHANGE

Every edit session must end with these steps, in order. Never skip any step.

```
1. LINT:     npx eslint .
2. TYPECHK:  npx tsc --noEmit
3. VERSION:  bump patch in package.json (0.1.X → 0.1.X+1)
4. COMMIT:   git add -A && git commit -m "prefix: description"
5. PUSH:     git push
```

**Commit prefixes:**
- `feat:` — new feature or mode
- `fix:` — bug fix
- `chore:` — version bump, docs update, STATE.md update, non-code changes

**Why this order matters:**
- Lint catches unused imports, hook violations, and code smells BEFORE typecheck
- Typecheck catches structural errors that lint misses
- Version bump ensures GitHub Actions publishes a new release (electron-builder skips if tag already exists)
- Commit + push triggers the CI/CD pipeline, so the Windows .exe is always up to date with `main`

**Never:**
- Skip the version bump — without it, new builds overwrite the old release with the same tag
- Push without lint + typecheck passing clean
- Commit broken WIP to `main` — use a branch for experiments
- Amend pushed commits — always add new commits

**After push:** GitHub Actions builds on `windows-latest` and publishes to https://github.com/rabidbot/rabidcubebuilder/releases. The release assets update within ~5 minutes. Download links:
- `Rabid-Cube-Builder-Setup-0.1.X.exe` (installer)
- `Rabid-Cube-Builder-0.1.X.exe` (portable)

## What we've built

- Full Electron + React 19 + Vite 8 + TypeScript 6 + Tailwind 4 + Zustand 5 + SQL.js stack
- 9-phase cube-building engine (`src/lib/cube-engine.ts`, ~715 lines)
- 10 canonical archetype matcher with keyword scoring (`src/lib/archetype-matcher.ts`)
- 100+ known cube staples, 60 signpost uncommons, 4-tier fixing lands (`src/lib/cube-seeds.ts`)
- Scryfall API client with batch `/cards/collection`, `/cards/search`, single-card fetch, rate limiting (`src/lib/scryfall.ts`)
- SQLite schema: `cards`, `collection`, `cubes`, `cube_cards` (with `locked` column pre-wired for Mode 2)
- 7-step cube wizard (type → size → archetypes → power → format → budget → themes/bans)
- Cube analysis view (curves, color balance, archetype coverage, power histogram, gaps)
- Card browser (grid/list toggle, filter by color/CMC/archetype, sort)
- Archetype dashboard (payoffs, enablers, synergy density, missing pieces)
- Export to CubeCobra / ManaBox / plain text formats (now uses Blob+URL bypassing IPC)
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

## Bugs we've fixed

| # | Commit | Issue |
|---|---|---|
| 1 | `5ecbe6a` | Missing `import './globals.css'` in main.tsx — no Tailwind styles |
| 2 | `5ecbe6a` | `Boxes` icon accidentally removed from OnboardingModal.tsx import — `ReferenceError`, entire app failed to mount |
| 3 | `168b078` | `searchCards` silently swallowed all errors — surfaced Scryfall errors as toasts |
| 4 | `6734de2` | Theme keywords with quotes broke Scryfall query syntax — added quote stripping + debug logging |
| 5 | `782fe42` | Scryfall requests in Electron had no User-Agent header — HTTP 400 on every request |
| 6 | `a168fb6` | Export truncation diagnostics — added console + UI logging to pinpoint where content is lost |
| 7 | `7fd0dad` | Export download/copy truncated to ~130 cards — bypassed IPC for download (Blob + a.click), added fallback copy (execCommand) |

## Architecture decisions

- **Engine location:** Renderer-side in `src/lib/cube-engine.ts` (TypeScript). Yields with `setTimeout(0)` every 200 cards during Phase 2. All Scryfall calls go through IPC to Electron main for rate limiting.
- **Cancel path:** `cubeStore.build()` sets a closure-local `cancelled` flag. Engine checks `callbacks.cancelled()` between phases and after yield points. On cancel, engine throws, store cleans up.
- **Uniqueness taxonomy:** two-axis: `effectCategory` (removal/draw/ramp/counter/token/tutor/recursion/pump/land/creature/spell/artifact) × `effectScope` (single/mass/triggered/conditional). Cards sharing both axes get a powerScore × 0.85 penalty when >2 copies exist in a slot. Never hard-blocked.
- **`locked` column:** pre-wired in `cube_cards` schema as `locked BOOLEAN DEFAULT FALSE`. Used by Mode 2 suggestion engine to protect untouchable cards. Not yet wired into UI.
- **HashRouter required:** Electron `file://` compatibility.
- **Tailwind v4:** uses `@tailwindcss/vite` plugin + `@theme` block in `globals.css` (no tailwind.config.js).
- **Download (export):** uses Blob + `URL.createObjectURL` + `<a>.click()` in all contexts. No IPC, no `fs.writeFile`. This bypassed a truncation bug where IPC/Electron was silently cutting the content string. Post-download verification reads back the blob text and compares length.
- **Copy (export):** primary path is `navigator.clipboard.writeText`, fallback is `document.execCommand('copy')` via hidden `<textarea>`. The Clipboard API in Electron can silently truncate large strings.
- **Export content:** built in `useMemo` with `[cube, format]` deps. Held in `contentRef` (synced via `useEffect`) so handlers always read the latest value without stale closures.

## Key files map

| File | Lines | Purpose |
|---|---|---|
| `src/lib/cube-engine.ts` | 715 | 9-phase build algorithm |
| `src/lib/archetype-matcher.ts` | 290 | 10 archetypes, keyword scoring |
| `src/lib/cube-seeds.ts` | 230 | Staples, signposts, fixing lands |
| `src/lib/types.ts` | 170 | All TypeScript interfaces |
| `src/stores/cubeStore.ts` | 185 | Build state, config, cancel |
| `src/components/wizard/CubeWizard.tsx` | 370 | 7-step config form |
| `src/components/analysis/CubeAnalysisView.tsx` | 230 | Post-build dashboard |
| `src/components/browser/CardBrowser.tsx` | 244 | Grid/list card browser |
| `src/components/archetype/ArchetypeDashboard.tsx` | 183 | Per-archetype deep dive |
| `src/components/export/ExportView.tsx` | 230 | Export with self-verification |
| `electron/main.cjs` | 340 | IPC handlers, HTTP server, SQL.js |

## Known gaps

- Modes 1, 2, 3: stubbed with "Coming soon" toasts. Only Mode 4 functional.
- `cubeStore.saveCube()` / `loadCube()` / `deleteCube()` / `fetchSavedCubes()`: stubs. DB schema fully supports persistence but wiring isn't done.
- No EDHREC or CubeCobra API integration.
- No banned list auto-detection from format legality.
- No PDF visual spoiler export.
- Electron production mode: HTTP server pattern is correct but untested in prod.
