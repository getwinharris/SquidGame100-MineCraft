# P1: Haste and Conduit Power status effect boosts missing

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No status effects are checked. The mining formula has no parameter for haste or conduit power.

## Wiki behavior

```
speedMultiplier += hasteLevel * 0.2
```

Haste (from beacons) and Conduit Power grant `hasteLevel * 0.2` bonus to speed multiplier. At Haste II, this adds 0.4 to the multiplier.

## Impact

Beacons are partially non-functional — the Haste effect does not accelerate mining. Conduit Power's mining speed bonus while underwater is entirely absent.
