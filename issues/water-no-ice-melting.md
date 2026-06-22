# Ice/frosted ice does not melt into water

- **Wiki URL:** https://minecraft.wiki/w/Water#Post-generation
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/blocks.ts:334` — `FROSTED_ICE` block exists (ID 334).

`packages/shared/src/blocks.ts:620` — `minecraft:frosted_ice` is mapped.

No code converts ice or frosted ice to water when broken or when near light sources.

## Wiki behavior

> "Ice and frosted ice blocks under brighter light levels melt into water source blocks (except in the Nether). Ice and frosted ice also create water when broken, but only if there is a movement-blocking block or fluid under it."

## Impact

Ice blocks can be placed and broken but never produce water. The ice/water cycle is absent.
