# P1: All tool miningLevel values shifted by 1 (wood=1→0, stone=2→1, etc)

**Wiki URL:** https://minecraft.wiki/w/Tiers
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `items.ts`:
- Wood: miningLevel: 1
- Stone: miningLevel: 2
- Iron: miningLevel: 3
- Diamond: miningLevel: 4
- Netherite: miningLevel: 5

## Wiki behavior

Wiki tiers (mining levels):
- Wood/Gold: 0 (can only mine stone-level blocks? No — they can't mine any blocks requiring a tool. Actually let me verify: in vanilla, wooden pickaxe can mine stone. So the mining level check is: tool tier >= required tier. Wiki says: Wood is tier 0... wait, actually the wiki says "Tiers 0-5" where:
  - Tier 0: Wood, Gold (can mine stone, cannot mine iron ore)
  - Tier 1: Stone (can mine iron ore)
  - Tier 2: Iron (can mine diamond ore)
  - Tier 3: Diamond (can mine obsidian)
  - Tier 4: Netherite (can mine ancient debris)

So in wiki terms, mining levels start at 0 (not 1). If our code checks `tool.miningLevel >= block.requiredMiningLevel`, then shifting all values by -1 would fix it.

But actually... our block properties likely use 1-indexed values too. Let me check.

## Impact

If block requiredMiningLevel values are also 1-indexed, then the comparison works internally but is wrong relative to wiki standards. The actual functional issue is that Gold's miningLevel=1 is wrong (should be 0) and Gold can mine stone-level blocks, which breaks the progression. Also, if a block has requiredMiningLevel=0 (should be mineable by hand), our wood tool at level 1 would satisfy `1 >= 0` which is fine, but if no tool at level 0 fails `0 >= 0` which is also fine. So the shift may be purely cosmetic as long as block values match. The real issue is gold.

However — the wrong tool penalty references `tier` in its formula, so the off-by-one there does matter.
