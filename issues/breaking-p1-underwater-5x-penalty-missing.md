# P1: Underwater mining penalty missing (5× without Aqua Affinity)

**Wiki URL:** https://minecraft.wiki/w/Breaking#Speed
**Gap type:** completeness
**Priority:** P1

## Implementation behavior

No check for whether the player is underwater or has Aqua Affinity.

## Wiki behavior

When the player is underwater and does NOT have the Aqua Affinity helmet enchantment:
- Mining takes 5× as long (speedMultiplier is divided by 5)

Aqua Affinity removes this penalty entirely.

## Impact

Players can mine underwater at normal speed without any helmet enchantment. Underwater mining should be painfully slow without Aqua Affinity, making the enchantment valuable for ocean exploration and monument raiding.
