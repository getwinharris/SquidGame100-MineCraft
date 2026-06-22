# P1: Sword special block-breaking multipliers missing

**Wiki URL:** https://minecraft.wiki/w/Sword
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No sword-specific block interaction exists. The sword is treated like any other tool type.

## Wiki behavior

Swords have special block-breaking mechanics:
- **Cobweb (hardness 4.0):** Sword breaks at 15× speed. This is the fastest way to break cobwebs (shears are slightly slower).
- **Bamboo (hardness 1.0):** Sword breaks at 30× speed. This is extremely fast — bamboo is almost instant with a sword.
- **Leaves:** Sword breaks slowly (1.5× penalty applies, but leaves are usually broken with shears)
- **Wool:** The sword's 1.5× penalty against blocks is negated for wool. Swords break wool at tool speed × base multiplier (no penalty).
- **Cocoa, Jack o'Lantern, Melon, Pumpkin, Sweet Berry Bush, Vines:** Swords break faster than hand.

Swords also do NOT drop cobwebs when breaking them — that requires shears.

## Impact

Cobwebs are impossible to clear effectively (they should break in 0 ticks with a sword but take ~10 seconds with our wrong formula). Bamboo farming is tedious. Wool breaking is penalized with the sword's 1.5× block penalty when it shouldn't be.
