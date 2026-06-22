# P1: Instant break (damage ≥ 1) not implemented

**Wiki URL:** https://minecraft.wiki/w/Breaking#Instant_breaking
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No instant break check exists. `getHarvestTime` returns `Math.round(getMiningSpeed())` which has no relationship to the actual tick-based formula.

## Wiki behavior

After computing `damage = speedMultiplier / hardness / 30`:

- If `damage >= 1.0`: the block breaks in 0 game ticks (instant)
- Otherwise: `ticks = ceil(1.0 / damage)`, breaking takes that many ticks

Instant break is important for e.g. breaking grass with a sword (0 ticks), or breaking glass with any tool (0 ticks since hardness 0.3 is small enough with tool boost), or breaking blocks with Efficiency V in creative mode.

## Impact

No block can ever be broken in 0 ticks. Every block takes at least 1 tick, even blocks like grass, torch, and glass that should break instantly with any tool.
