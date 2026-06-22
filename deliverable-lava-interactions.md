# Water/Lava Interactions Fix

## Changes Made

### Problem
`createsCobblestone`, `createsObsidian`, and `createsStone` in `packages/shared/src/fluids.ts` had wrong conditions or were dead code. No way to distinguish source vs flowing lava (single block ID).

### Files Changed

1. **`packages/shared/src/blocks.ts`**
   - Added `WATER_FLOWING: 629`, `LAVA_FLOWING: 630` block IDs
   - Added `minecraft:flowing_water` and `minecraft:flowing_lava` namespace mappings
   - Added color entries for flowing blocks (same as source)

2. **`packages/shared/src/fluids.ts`**
   - `getFluidType()` — now checks both source and flowing IDs
   - Added `isWater()`, `isLava()` helpers
   - `getFluidLevel()` — returns 7 for flowing, 8 for source
   - `getFluidBlockAtLevel()` — returns flowing block ID for level < 8
   - `getFlowDirection()` — uses `getFluidType()` instead of hardcoded IDs
   - `createsCobblestone()` — now checks water + `BLOCK.LAVA_FLOWING` (was both sources)
   - `createsObsidian()` — now checks water + `BLOCK.LAVA` (was same as cobblestone)
   - `createsStone()` — now takes one arg, checks `BLOCK.LAVA_FLOWING` (for flowing lava above water)

3. **`packages/client/src/scene.ts`**
   - Imported `createsObsidian`, `createsStone`, `isWater`, `isLava`
   - Restructured interaction logic per wiki:
     - **Obsidian:** water (any) touches lava SOURCE → lava source becomes obsidian
     - **Cobblestone:** water (any) + FLOWING lava (lateral) → cobblestone replaces lava
     - **Stone:** FLOWING lava above water (dy=-1) → water below becomes stone

### Wiki Rules Applied
> https://minecraft.wiki/w/Water#Water_and_lava

| Rule | Condition | Result | Code |
|------|-----------|--------|------|
| Obsidian | water touches lava source | lava source → obsidian | `createsObsidian` → `BLOCK.OBSIDIAN` |
| Cobblestone | water + flowing lava (lateral) | flowing lava → cobblestone | `createsCobblestone` → `BLOCK.COBBLESTONE` |
| Stone | flowing lava flows down onto water | water → stone | `createsStone` → `BLOCK.STONE` |

### Verification
- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm run generate:map` — exit 0, no new gaps

### Ponytail Notes
- Only one flowing block ID per fluid (level 7). No 7-level decay gradient.
- Downward flow in `tickFluid` still creates source (level 8), not flowing — simplifies flow mechanics but means some stone generation paths rely on the scene.ts interaction loop rather than flow simulation.
