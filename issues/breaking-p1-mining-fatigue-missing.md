# P1: Mining Fatigue penalty missing

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No Mining Fatigue check exists.

## Wiki behavior

```
speedMultiplier += miningFatigueLevel × -0.3
```

For each level of Mining Fatigue, subtract 0.3 from the speed multiplier. Mining Fatigue III subtracts 0.9, which makes mining extremely slow (and at max level, the entire multiplier goes negative).

## Impact

Elder Guardians cannot slow player mining in ocean monuments. The entire ocean monument gameplay mechanic is broken.
