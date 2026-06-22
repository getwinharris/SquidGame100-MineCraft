# No distinction between source and flowing water blocks

- **Wiki URL:** https://minecraft.wiki/w/Water#Source_blocks and https://minecraft.wiki/w/Water#Spreading
- **Gap type:** `completeness`
- **Priority:** P1

## Our implementation

`packages/shared/src/blocks.ts:254` — only a single `WATER: 332` block ID exists. There is no separate ID for flowing water or water with levels 1-7.

`packages/shared/src/fluids.ts:82-85` — `getFluidLevel` always returns 8 (source level) for BLOCK.WATER. No level state is stored per block.

`packages/shared/src/fluids.ts:101-106` — `getFluidBlockAtLevel` returns `BLOCK.WATER` for any level > 0. All water levels map to the same block ID.

## Wiki behavior

> "A water source block is created from a flowing block that is horizontally adjacent to two or more other source blocks, and sitting on top of a solid block or another water source block."

Water has 9 fluid states: level 8 = source, levels 1-7 = flowing (depth increases as number decreases, so level 1 = deepest flowing, level 7 = thinnest flowing). Source blocks are renewable when two sources flow into a third space.

## Impact

Without level variants, water can't visually or mechanically represent depth. Thin water streams look identical to full water blocks. Source block creation (infinite water sources) can't function. The flow simulation can't distinguish between a deep pool and a shallow stream.
