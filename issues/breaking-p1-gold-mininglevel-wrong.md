# P1: Gold miningLevel is 1 — should be 0

**Wiki URL:** https://minecraft.wiki/w/Tiers
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `items.ts`, gold has `miningLevel: 1`.

## Wiki behavior

Gold has tier 0 on the wiki — it cannot mine any blocks that require a tool. Gold tools have the same mining level as wood (0 in wiki terms), but with a speed of 12 (fastest tool multiplier).

## Impact

Gold tools can mine stone-level blocks (tier 1 in our code), which they should not be able to do. A gold pickaxe should not be able to mine iron ore or stone. This means gold tools are functionally equivalent to stone tools in our implementation, which is wrong.
