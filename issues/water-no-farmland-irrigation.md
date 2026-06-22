# Farmland is not hydrated by nearby water

- **Wiki URL:** https://minecraft.wiki/w/Water#Irrigation
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/blocks.ts:329` — `FARMLAND` block exists.

No code checks for nearby water to hydrate farmland. Farmland behavior (moisture levels, reverting to dirt) is not implemented.

## Wiki behavior

> "Water irrigates all farmland within a distance of 4 blocks in every direction except upwards, which causes crops on the farmland to grow faster and prevents the farmland from randomly reverting to dirt."

> "Sugar cane also requires water next to the block it is planted on to be placed."

## Impact

Crops can grow anywhere without water. No farmland moisture mechanic means farming is easier than in vanilla, breaking the survival game balance.
