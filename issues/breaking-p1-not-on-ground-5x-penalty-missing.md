# P1: Not-on-ground mining penalty missing (5× while airborne)

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No check for whether the player is standing on the ground.

## Wiki behavior

When the player is not standing on the ground (i.e., their feet collision box does not intersect a solid block):
- Mining takes 5× as long (speedMultiplier is divided by 5)

## Impact

Players can mine at full speed while jumping, falling, flying (in survival), or swimming at the surface. In vanilla, you must stand on solid ground to mine efficiently. This also affects elytra flight mining, which should be impractical.
