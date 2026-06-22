# P1: Efficiency enchantment boost missing from mining formula

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No Efficiency enchantment check exists. The mining speed formula only uses tool tier + 1.

## Wiki behavior

When mining with the correct tool and the Efficiency enchantment:

```
speedMultiplier = toolMultiplier + efficiencyLevel² + 1
```

The `efficiencyLevel²` term is significant: Efficiency V adds 25 to the multiplier, dwarfing the tool's base speed (max 12 for gold).

## Impact

Efficiency enchantment is completely non-functional. Players cannot mine faster with enchanted tools, which is a core progression mechanic. Efficiency is one of the most important enchantments in vanilla — without it, players have no reason to enchant their pickaxes beyond unbreaking.
