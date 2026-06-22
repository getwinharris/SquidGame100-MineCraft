# No water splash or ambient sounds

- **Wiki URL:** https://minecraft.wiki/w/Water#Sounds
- **Gap type:** `completeness`
- **Priority:** P3

## Our implementation

`packages/client/src/scene.ts:1009-1040` — `SoundEffects` class exists with a generic tone synthesizer. No water-specific sounds: no splash when entering water, no ambient water/underwater sounds, no bubble sounds, no dripping sounds.

## Wiki behavior

Water has numerous sound events: `block.water.ambient`, `entity.player.splash`, `entity.player.swim`, `block.bubble_column.upwards_ambient`, `block.bubble_column.whirlpool_ambient`, etc.

## Impact

Water is silent. Entering/exiting water produces no splash. Swimming produces no sound. Bubble columns are silent. This is cosmetic but important for immersion.
