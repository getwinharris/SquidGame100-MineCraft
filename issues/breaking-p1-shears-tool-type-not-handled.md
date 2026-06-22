# P1: Shears tool type not handled anywhere

**Wiki URL:** https://minecraft.wiki/w/Shears
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

`getHeldToolType` in `scene.ts` only checks for 'sword', 'pickaxe', 'axe', 'shovel', 'hoe' tool types. Shears are not handled.

Similarly, `getMiningSpeed` in `blockProperties.ts` has no shears-specific logic.

## Wiki behavior

Shears have specific interactions:
- Instant break (0 ticks) for leaves, cobwebs, vines, glow lichen
- 5× speed on wool
- Slow on other blocks (equivalent to hand speed)

Shears are the "correct tool" for: leaves, cobwebs, vines, glow lichen, wool (but wool does not REQUIRE shears — see separate issue).

## Impact

Shears are non-functional for block breaking. Breaking leaves, vines, and cobwebs with shears is the same speed as hand, which means these blocks are tedious to collect. In vanilla, shears make clearing foliage trivially fast.
