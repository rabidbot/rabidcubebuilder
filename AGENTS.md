# AGENTS.md — Rabid Cube Builder

## Project at a glance

- **Stack:** React 19 + Vite 8 + Electron 42 + SQL.js + Zustand 5 + Tailwind 4
- **Platform:** Windows exe, deployed via GitHub Actions on push to `main`
- **Current version:** `0.1.0` (package.json:5)
- **Build command:** `npm run electron:build` (triggered by GitHub Actions `build.yml`)
- **Lint:** `npx eslint .`
- **Type check:** `npx tsc --noEmit` — must pass clean

## How we push

Every feature or fix commit MUST include a version bump in `package.json` before pushing:

```
git add -A
git commit -m "prefix: description of change"
git push
```

- **Prefixes:** `feat:` for features, `fix:` for bugs, `chore:` for version-only bumps
- **Version:** bump patch (0.1.X+1)
- **GitHub Actions:** `build.yml` triggers on push to `main`, builds the Electron app, creates a release

## Key source files

| File | Purpose |
|---|---|
| `src/lib/types.ts` | All TypeScript interfaces: `CubeConfig`, `CubeCard`, `CubeSlot`, `CubeAnalysis`, `ArchetypeFit`, etc. |
| `src/lib/cube-engine.ts` | Core 9-phase cube-building algorithm. `buildCube()`, `findCandidateCards()`, `analyzeCube()`. Mode 4: theme-first build. |
| `src/lib/archetype-matcher.ts` | 10 canonical archetype definitions with keyword scoring, `computeAllFits()`, `extractEffectTaxonomy()`, `isBridgeCard()`. |
| `src/lib/cube-seeds.ts` | `KNOWN_CUBE_STAPLES` (~100 entries), `SIGNPOST_UNCOMMONS` (60 entries), `FIXING_LAND_TIERS` (4 tiers). |
| `src/lib/scryfall.ts` | Scryfall API client: `fetchCardsBatch()`, `searchCards()`, `fetchCardById()`, with rate limiting. |
| `src/lib/db.ts` | SQLite schema: `cards`, `collection`, `cubes`, `cube_cards` tables. CRUD for cubes. |
| `src/lib/card-utils.ts` | Oracle text, type line, color identity, curve bucket, card image URL helpers. |
| `src/lib/card-cache.ts` | Two-tier LRU cache (memory Map + SQLite). `cacheCard()`, `getCachedCard()`, `setInMemoryCache()`. |
| `src/lib/csv-parser.ts` | `parseCSV()` for ManaBox format, `serializeCSV()` for export. |
| `src/stores/cubeStore.ts` | Zustand store: builds cubes via `cube-engine`, manages config state, progress, cancellation. |
| `src/stores/uiStore.ts` | UI state: `onboardingComplete` (localStorage), `onboardingDismissed`, `showHelp`. |
| `src/stores/toastStore.ts` | Toast notification queue with auto-dismiss after 4 seconds. |
| `src/components/wizard/CubeWizard.tsx` | 7-step configuration form: type, size, archetypes, power, format, budget, themes/bans. |
| `src/components/analysis/CubeAnalysisView.tsx` | Post-build dashboard: curve, color balance, archetype coverage, power histogram, gaps. |
| `src/components/browser/CardBrowser.tsx` | Grid/list card browser with color, CMC, archetype filters and sort. |
| `src/components/archetype/ArchetypeDashboard.tsx` | Per-archetype deep dive: payoffs, enablers, synergy density, missing pieces. |
| `src/components/export/ExportView.tsx` | Export in CubeCobra, ManaBox, or plain text format. Copy to clipboard or download. |

## Architecture: how a cube gets built

1. **Phase 1 — Card Enrichment:** Cards enriched via Scryfall `/cards/collection` batch endpoint (75 per request)
2. **Phase 2 — Archetype Tagging:** Every card scored against all 10 archetypes (0.0–1.0) using keyword matching, oracle pattern detection, color identity checks, and CMC penalties for aggro
3. **Phase 3 — Power Level Calibration:** Rarity-based base score adjusted by `KNOWN_CUBE_STAPLES` lookup, broken pattern detection, rate analysis, and cube-type-specific caps (Pauper caps at 0.6)
4. **Phase 4 — Mana Curve Targeting:** Per-archetype targets: 1 CMC 15%, 2 CMC 25%, 3 CMC 25%, 4 CMC 20%, 5 CMC 10%, 6+ CMC 5%
5. **Phase 5 — Color Slot Allocation:** 360 cube → W/U/B/R/G=54 each, Multi=60, Colorless=20, Land=10. Scales with cube size.
6. **Phase 6 — Greedy Card Selection:** Per slot, filter by color identity, score by `archetypeFit × 0.4 + powerScore × 0.3 + curveNeed × 0.2 + uniqueness × 0.1`. Hard constraints: no duplicates, no dead cards, power/budget ceiling, format legality
7. **Phase 7 — Fixing Land Selection:** Tiered by cube power level — fetch lands for powered/legacy, shocklands for all, signets/talismans for mid-power
8. **Phase 8 — Signpost Uncommon Injection:** 1-2 signposts injected per archetype into multicolor slots. Falls back to high-power-scoring primary-archetype cards if signpost not in pool
9. **Phase 9 — Synergy Density Validation:** Counts synergy connections per archetype, flags underdense archetypes, generates gap report with suggested cards

## Cancel path

`cube:build` has a cancellation mechanism:
- `cubeStore.build()` sets `cancelled` ref before the async operation
- Engine checks `callbacks.cancelled()` between phases and after yield points
- `cubeStore.cancel()` flips the flag, engine throws `throw new Error('Build cancelled')`
- Build state cleans up: `isBuilding = false`, `cancelBuild = null`
- Header renders "Cancel Build" button while `isBuilding === true`

## Debug checklist

- **Cube won't build:** Check Scryfall search results in `findCandidateCards()` — broad queries hit `MAX_CANDIDATES` cap (2000)
- **Zero cards in a slot:** Check `cardFitsSlot()` — monocolor slots filter by `ci.length === 1` AND `ci.includes(color)`
- **Signpost not injected:** Verify card name matches `SIGNPOST_UNCOMMONS` exactly, and it passed `filterCandidates()`
- **Duplicate effects penalizing too hard:** The penalty applies `powerScore *= 0.85` when more than 2 cards share `effectCategory|effectScope`. Check `scratchDuplicateEffects()`
- **Progress stuck:** Engine yields every 200 cards during Phase 2. Check cancellation flag between phases.

## Known gaps

- **Modes 1, 2, 3** are stubbed. Only Mode 4 (theme-first build) is functional.
- **No EDHREC integration** — cube popularity data not available.
- **No banned list auto-detection** — user must manually ban cards.
- **Save/load cubes** — `cubeStore.saveCube()` and `loadCube()` are stubs. DB schema supports it.
- **No export to CubeCobra import format** — headers are correct but must be verified against CubeCobra's parser.
- **Electron production mode** — HTTP server serves from `dist/`, same pattern as deck builder.

## Hard-won lessons from the deck builder (apply here)

1. **Oracle newlines break regex `.`** — Always normalize oracle text with `.replace(/\n/g, ' ')` before regex matching
2. **Scryfall rate limiting** — 50ms between requests, queue-based in Electron main process via IPC
3. **Memory LRU cache** — Cap at 2000 entries, FIFO eviction. Check memory before hitting SQLite.
4. **Zustand selectors** — Use selector functions to avoid unnecessary re-renders: `useCubeStore((s) => s.cube)` not `useCubeStore()`
5. **Route hash-based** — `HashRouter` required for Electron `file://` compatibility
