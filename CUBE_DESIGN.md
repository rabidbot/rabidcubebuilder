# CUBE_DESIGN.md — Rabid Cube Builder Domain Reference

## What a Magic Cube is

A Magic: The Gathering Cube is a curated collection of cards (typically 360, 540, or 720) assembled to serve as a self-contained, infinitely replayable draft format. Unlike Constructed formats, a Cube simulates a booster draft: players are dealt packs of 15 cards, pick one and pass the pack, repeating until each player has ~45 cards, then build 40-card decks.

## The 10 Canonical Archetypes

| Archetype | Colors | Strategy | Key Signals |
|---|---|---|---|
| WU | White-Blue | Artifacts / Flicker / Control | Blink, ETB, Artifact synergy, counterspells |
| UB | Blue-Black | Reanimator / Control | Graveyard recursion, discard outlets, mill |
| BR | Black-Red | Sacrifice / Aggro | Sac outlets, token generators, dies triggers |
| RG | Red-Green | Ramp / Stompy | Mana dorks, big threats, haste |
| GW | Green-White | Tokens / Counters | Token generators, anthems, +1/+1 counters |
| WB | White-Black | Lifegain / Midrange | Drain effects, resilient creatures, recursion |
| UR | Blue-Red | Spells / Prowess | Instant/sorcery synergy, prowess, cantrips |
| BG | Black-Green | Graveyard Value | Delve, dredge, self-mill, recursion engines |
| RW | Red-White | Weenie / Equipment | Small creatures, equipment, battalion |
| UG | Blue-Green | Ramp / Simic Value | Landfall, +1/+1 counters, flash, big draw |

## Cube Types (Taxonomy)

- **Powered:** Includes Power 9. Fast, explosive. Expensive.
- **Unpowered:** High power without P9. MTGO Vintage Cube style.
- **Legacy:** Legacy power level. Balanced, competitive.
- **Modern:** Modern-legal only. Synergy-based, fair.
- **Peasant:** Commons + Uncommons only. Budget, skill-testing.
- **Pauper:** Commons only. Ultra-budget, creature-focused.
- **Theme/Set:** Built around a specific set or mechanic.
- **Custom:** No restrictions. Pure curation.

## The 4 Build Modes

1. **Build from Collection:** CSV upload → build cube from owned cards only
2. **Flesh Out Existing Cube:** Upload cube + collection CSVs → suggest gap-filling cards
3. **Upgrade a Cube:** Upload cube CSV → suggest upgrades from full Scryfall pool
4. **Theme-First Build:** Configure theme, archetypes, power level → build from scratch (fully implemented)

## CubeCobra Export Format

CubeCobra's CSV import uses `name` as the primary key (not Scryfall ID).

Accepted columns:
- `name` — Card name (exact match required)
- `cmc` — Converted mana cost
- `type` — Type line (e.g., "Creature — Human Soldier")
- `color` — Color string (e.g., "WUBRG", "UR", "")
- `set` — Set code (e.g., "MH2", "RAV")
- `collector_number` — Collector number within set
- `status` — "Owned" or "Not Owned"
- `tags` — Semicolon-separated strings (e.g., "WU;UB;power9")

The archetype tag data computed in Phase 2 maps directly onto the `tags` column with zero transformation.

## Cube Design Axioms

1. **Drafting Signals:** Clear archetypes players can identify and commit to
2. **Power Balance:** Cards compete fairly for draft picks
3. **Mana Curve:** Each archetype needs cheap, mid, and finisher options
4. **Color Balance:** Roughly equal representation across 5 colors
5. **Signal-to-Noise Ratio:** Every card should belong to at least one archetype
6. **Fixing:** Dual lands and color fixing are critical infrastructure

## Known Gaps & Future Work

- EDHREC integration for cube popularity data
- CubeCobra API integration for syncing
- PDF visual spoiler export
- Sideboard/wishboard support
- Actual playtesting data integration
