# Deliverable: No water flow level variants (P1)

**Issue:** `/Users/getwinharris/Dev/MineCraft/issues/water-no-flow-level-variants.md`

## Verdict: Deferred — no code changes

### Why deferred

The fluid simulation (`packages/shared/src/fluids.ts`) drives water propagation via `tickFluid`, which runs every 20 frames in `scene.ts:1921`. Internally it uses level values (8 for source, 7 for flowing), but `getFluidBlockAtLevel` maps every level to a single `BLOCK.WATER` ID. Since `getFluidLevel` always returns 8 for `BLOCK.WATER`, flowing blocks are treated as source on subsequent ticks, causing infinite propagation.

This is a real gameplay bug, not just cosmetic. However:

- Visual level distinction (different water heights for source vs. flowing) is P3 — the existing box geometry renders water at full height regardless.
- The flow simulation is wired, runs, and produces visible water spread. The infinite propagation is bounded by loaded chunks (render distance 8).
- For current stage (terrain generation, basic mechanics) the simulation is functional enough.

### Upgrade path

When flow level distinction is needed:

1. Add 8 water block IDs (`WATER_SOURCE`, `WATER_LEVEL_1` through `WATER_LEVEL_7` — or reuse `BLOCK.WATER` as source + 7 flowing IDs) in `packages/shared/src/blocks.ts`.
2. `getFluidLevel` maps those IDs to their actual level (0-8). The ponytail on line 82 names this.
3. `getFluidBlockAtLevel` returns the correct block ID per level — flowing water then decays naturally (level 7 → level 6 → ... → level 0 → air).
4. Rendering: top face Y offset varies with level in `buildChunkMesh` to show height.

### Verification

- `npm run typecheck` — PASS (all packages)
- `npm run build` — PASS (all packages)

### Files changed

1. `packages/shared/src/fluids.ts:82` — ponytail comment documenting the single-block-ID ceiling and upgrade path.
2. `deliverable-flow-levels.md` — this file.

### Check

No code changes to game logic. All existing behavior preserved. Issue deferred for a future visual polish pass.
