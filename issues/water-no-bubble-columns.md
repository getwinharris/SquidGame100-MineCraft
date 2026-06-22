# Bubble columns not implemented

- **Wiki URL:** https://minecraft.wiki/w/Water#Vertical_transport
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/blocks.ts` — soul sand (ID 53) and magma block (ID 154) exist. Bubble column block does not exist.

No code generates bubble columns when soul sand or magma blocks are placed underwater.

## Wiki behavior

> "Bubble columns are created by placing magma blocks or soul sand under water. The latter can be used to transport mobs or items quickly vertically."

Soul sand under water creates upward bubble columns (push entities up). Magma block under water creates downward bubble columns (pull entities down). Bubble columns also restore breath.

## Impact

Vertical water transport (bubble elevators) is missing entirely. These are commonly used for underwater bases and mob farms.
