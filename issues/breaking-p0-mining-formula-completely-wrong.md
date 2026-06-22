# P0: Mining formula completely wrong — does not follow wiki breaking formula

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** correctness
**Priority:** P0

## Implementation behavior

`getMiningSpeed()` returns `(tier + 1) / hardness` where `tier` is `miningLevel` from tool item (1=wood, 2=stone, etc). This is a made-up formula.

`getHarvestTime()` returns `Math.round(getMiningSpeed())` with no relationship to game ticks.

## Wiki behavior

The wiki defines:

```
speedMultiplier = baseSpeed (toolMultiplier for correct tool, else 1)
                + efficiencyLevel² (if Efficiency enchantment, correct tool only)
                + hasteLevel * 0.2 (if Haste/Conduit Power)
                + speed_penalty (if Mining Fatigue, -0.3 × level)
```

Where `baseSpeed` is:
- Tool multiplier from tiers table (2, 4, 6, 8, 9, 12) for correct tool
- 1 if no tool or wrong tool (with 1× speed penalty)

Then:
- If using wrong tool: `speedMultiplier *= 0.3` (÷3.33) — wrong tool penalty
- If cannot harvest (requires tool but using wrong tool): `speedMultiplier *= 0.2` (extra ÷5)

Then damage per tick:
```
damage = speedMultiplier / blockHardness / 30
```

- If `damage >= 1`: instant break (0 ticks)
- Otherwise: `ticks = ceil(1 / damage)`

Additional penalties:
- Underwater without Aqua Affinity: 5× penalty
- Not on ground: 5× penalty
- Penalties stack multiplicatively

## Impact

Every block breaking in the game uses wrong timing. Stone takes ~1 tick to mine with a wooden pickaxe in our code (should take 44 ticks). Dirt takes negative ticks for some tools. The entire mining progression is broken — players can mine stone instantly with a wooden pickaxe, which should take 7.5 seconds with no tool (or ~1s with wooden pick). Every block is mined too fast by a factor of ~30–100× depending on tool. This is the most severe bug in the entire game.
