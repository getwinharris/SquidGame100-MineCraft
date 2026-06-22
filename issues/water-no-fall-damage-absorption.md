# Water does not absorb fall damage

- **Wiki URL:** https://minecraft.wiki/w/Water#Swimming
- **Gap type:** `completeness`
- **Priority:** P0

## Our implementation

`packages/client/src/scene.ts:941-1006` — there is no fall damage system in the codebase at all. The player never takes fall damage. The `p.vel.y` is capped at -40 but no damage is applied on landing.

Water is not checked for fall absorption because there is no fall damage to absorb.

## Wiki behavior

> "Water of any depth prevents any entity, including the player, from sustaining falling damage if they fall into it, regardless of the distance fallen."

## Impact

Missing fall damage means players can jump from any height without penalty. Combined with invisible water, this gap is critical but will become apparent once fall damage is implemented and water landing doesn't mitigate it.
