# No underwater mining speed penalty

- **Wiki URL:** https://minecraft.wiki/w/Water#Submerged_mining_speed
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/client/src/scene.ts` — mining speed is not affected by the player being underwater. No code checks if the player's head is in water during block breaking.

## Wiki behavior

> "Players with their head underwater require 5 times the normal amount of time to mine blocks while standing on the ground, or 25 times while not on the ground. If a player wears a helmet with the Aqua Affinity enchantment, submerged mining speed is increased by 400%, negating this effect."

## Impact

Mining underwater is as fast as mining on land. The Aqua Affinity enchantment (which should be desirable for underwater mining) has no gameplay value.
