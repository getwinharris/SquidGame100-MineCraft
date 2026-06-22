# P1: Cannot harvest penalty is wrong (1.5× instead of 5×)

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

`getMiningSpeed` applies `speed * 1.5` when the block cannot be harvested (not enough tier). This is a speed increase, not a penalty.

## Wiki behavior

When the block cannot be harvested (tool missing or too low tier for the required mining level):
```
speedMultiplier *= 0.2
```

This is a 5× penalty (divide by 5), making it painfully slow to try mining obsidian with a wooden pickaxe.

## Impact

Our code makes unharvestable blocks mine FASTER (1.5× multiplier) when they should take 5× LONGER. This is completely backwards — obsidian would mine faster with a wrong tool than with the correct one in our implementation, instead of taking 250 seconds.
