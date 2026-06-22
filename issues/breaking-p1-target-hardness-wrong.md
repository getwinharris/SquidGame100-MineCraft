# P1: Target block hardness wrong (1 instead of 0.5)

**Wiki URL:** https://minecraft.wiki/w/Target
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `blockProperties.ts`, target has `hardness: 1` (default, since not explicitly set).

## Wiki behavior

Target block has hardness 0.5 on the wiki.

## Impact

Target breaks slightly slower than it should. Not a game-breaking issue but affects redstone practice setups where target blocks are used for archery training.
