# P1: Tick rounding formula wrong (using round instead of ceil)

**Wiki URL:** https://minecraft.wiki/w/Breaking#Calculation
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

`getHarvestTime` returns `Math.round(getMiningSpeed())`. This returns a float and has no relationship to the game's tick system.

## Wiki behavior

Wiki pseudocode:
```
damage = speed / blockHardness / 30
if damage >= 1: return 0 (instant)
ticks = ceil(1.0 / damage)
```

The `ceil` means partial ticks round up — if damage is 0.51, then 1/0.51 = 1.96 → ceil → 2 ticks. With round: 1.96 → 2 ticks (same here), but if damage is 0.49 → 1/0.49 = 2.04 → ceil → 3 ticks, while round → 2 ticks.

## Impact

The rounding formula is wrong (using `Math.round` on the wrong input). Mining times will be off by 1 tick in many cases, which is cumulatively noticeable when mining many blocks. More importantly, the `Math.round` is operating on the wrong intermediate value (tier+1/hardness instead of damage × 30), not on the tick count.
