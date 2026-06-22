# P1: Dried kelp block hardness wrong (1 instead of 0.5)

**Wiki URL:** https://minecraft.wiki/w/Dried_Kelp_Block
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `blockProperties.ts`, dried kelp block has `hardness: 1` (default, since not explicitly set).

## Wiki behavior

Dried kelp block has hardness 0.5 on the wiki (same as wool, and flammable).

## Impact

Dried kelp blocks break slower than they should. Since they are often used as fuel, this is a minor nuisance.
