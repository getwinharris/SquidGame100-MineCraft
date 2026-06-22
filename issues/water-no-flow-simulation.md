# Fluid simulation (tickFluid) is never executed

- **Wiki URL:** https://minecraft.wiki/w/Water#Spreading
- **Gap type:** `completeness`
- **Priority:** P0

## Our implementation

`packages/shared/src/fluids.ts:154-188` — `tickFluid` is defined and exported via `packages/shared/src/index.ts`, but never imported or called by any consumer (client or server). Zero call sites.

`packages/shared/src/fluids.ts:180` — the tick only checks horizontal neighbors of a single block, emitting level-7 flow blocks. It does not chain-propagate to produce the declared 7-block horizontal flow.

`packages/shared/src/fluids.ts:82` — `getFluidLevel` always returns 8 (source level) for BLOCK.WATER. There is no separate "flowing water" block with variable levels (1-7).

## Wiki behavior

Water spreads horizontally and downward into adjacent air blocks. Water can spread downward infinitely until stopped. Water spreads 7 blocks horizontally from a source block on a flat surface. Water spreads at a rate of 1 block every 5 game ticks (4 blocks/second). Flowing water has a level from 1-7 (8 = source block). Source blocks are created from flowing blocks adjacent to two or more other source blocks (infinite water sources).

## Impact

Water is completely static. Oceans and rivers never flow. Breaking a water source leaves a hole. Waterfalls don't cascade. There is no infinite water source mechanic. The entire fluid simulation is dead code.
