# P1: Tool multiplier values are wrong (off-by-one / shifted)

**Wiki URL:** https://minecraft.wiki/w/Tiers
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `items.ts`, the tool multipliers implicitly used are:
- Wood: tier 1 → value 2 (tier+1)
- Stone: tier 2 → value 3 (tier+1)
- Iron: tier 3 → value 4 (tier+1)
- Diamond: tier 4 → value 5 (tier+1)
- Netherite: tier 5 → value 6 (tier+1)

Gold: miningLevel=1 → value 2 (same as wood)

## Wiki behavior

Wiki tool multiplier values:
- Wood: 2
- Stone: 4
- Iron: 6
- Diamond: 8
- Netherite: 9
- Gold: 12

## Impact

Stone tools are only 50% faster than wood (3 vs 2) when they should be 2× faster (4 vs 2). Diamond is ~67% faster than iron (5 vs 3) when it should be only 33% faster (8 vs 6). Gold has the same multiplier as wood (2) instead of being the fastest (12). The tool progression is flattened and feels wrong.

Note: `items.ts` already has the correct wiki values in `miningSpeed` fields — `getMiningSpeed` in `blockProperties.ts` just doesn't use them.
