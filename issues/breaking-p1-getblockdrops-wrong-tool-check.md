# P1: getBlockDrops doesn't check correct tool (stone drops cobblestone even with wrong tool)

**Wiki URL:** https://minecraft.wiki/w/Breaking#Blocks_by_hardness
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

`getBlockDrops` in `scene.ts` does not check whether the correct tool was used. Stone always drops cobblestone.

## Wiki behavior

Stone drops cobblestone ONLY when mined with a pickaxe. If mined with any other tool (hand, axe, shovel), it drops nothing.

Similarly:
- Coal/iron/copper/gold/diamond/redstone/lapis ore drop their item form only when mined with the correct pickaxe tier
- Glass drops nothing when broken (silk touch to get the block)
- Ice drops nothing (silk touch to get the block)
- Leaves drop saplings/sticks only when broken with shears (or non-decayed)
- Bookshelves drop 3 books when mined without silk touch/without axe
- Many more blocks have specific drop requirements

## Impact

Stone can be mined with any tool and still drops cobblestone, which defeats the purpose of pickaxes. This is a fundamental game mechanic: you NEED a pickaxe to get cobblestone. Without this, the entire stone-to-iron progression is broken — players can punch stone bare-handed and get cobblestone.
