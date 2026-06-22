# Sponge block does not absorb water

- **Wiki URL:** https://minecraft.wiki/w/Water#Sponges
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/blocks.ts:349` — `SPONGE` block exists (ID 349).

`packages/shared/src/blocks.ts:323` — `WET_SPONGE` block exists (ID 323).

Neither sponge mechanics are implemented. Placing a sponge near water has no effect.

## Wiki behavior

> "When a dry sponge comes into contact with a water source or flowing block, it becomes a wet sponge, absorbing all water within 3 to 5 blocks in all directions."

> "A sponge absorbs water around itself (water source blocks or flowing water) out to a taxicab distance of 7 in all directions (including up and down), but won't absorb more than 65 blocks of water."

## Impact

Sponges are the primary tool for underwater construction. Without them, clearing water from an area requires filling every block. Not critical for early-game but important for mid/late-game building.
