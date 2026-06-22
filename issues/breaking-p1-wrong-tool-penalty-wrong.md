# P1: Wrong tool penalty formula is wrong

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

`getMiningSpeed` applies `speed * (tier + 1) * 0.3` for wrong tool. This is a made-up penalty that depends on tool tier.

Specifically, in the code: when `!isCorrectTool`, speed is multiplied by `(tier + 1) * 0.3` — so wooden pickaxe wrong tool penalty = 2 * 0.3 = 0.6× speed, diamond wrong tool = 5 * 0.3 = 1.5× speed (which is faster than correct tool in many cases).

## Wiki behavior

When using the wrong tool: `speedMultiplier` is first set to 1 (not the tool multiplier), then the speed penalty (×0.3) applies:

```
speedMultiplier = 1 + efficiency² + haste*0.2 - fatigue*0.3
// After computing above:
if (wrong tool): speedMultiplier *= 0.3
```

The tool tier does NOT factor into wrong tool penalty. Diamond pickaxe should mine dirt at the same speed as a wooden pickaxe (both wrong tools, same penalty).

## Impact

Using a diamond pickaxe as a wrong tool is actually FASTER than using the correct tool with wrong-tier multiplier in some edge cases due to the formula bug. More importantly, higher-tier tools should not mine wrong blocks any faster than lower-tier tools — the penalty is purely the 0.3× multiplier regardless of tool material.
