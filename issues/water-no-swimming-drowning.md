# No swimming or drowning mechanics

- **Wiki URL:** https://minecraft.wiki/w/Water#Swimming and https://minecraft.wiki/w/Water#Drowning
- **Gap type:** `completeness`
- **Priority:** P0

## Our implementation

`packages/client/src/scene.ts:941-1006` — `updatePlayer` has no swimming mechanic. The player moves at full walk speed through water. The `solid()` function at line 928 treats water as non-solid, so the player can freely occupy water blocks. There is no:

- Slow sinking in water
- Floating at water surface
- Swim-up with jump key
- Swim mode (horizontal, 1-block height) when sprinting underwater
- Breath meter or drowning damage
- Water drag/movement slowdown

`packages/client/src/scene.ts:954` — jump velocity (`JUMP_VEL = 8`) is the same in water as on land.

`packages/client/src/scene.ts:955` — gravity (`GRAVITY = -22`) applies normally underwater.

## Wiki behavior

> "Non-swimming players and mobs sink slowly in water. Holding the swim button raises the player through the water, and when the surface is reached, the player bobs up and down. The crouch button can be used to sink faster. The sprint button can be used to put the player in 'swim mode' when completely submerged."

> "Players and mobs (except aquatic mobs, undead mobs and iron golems) have a breath meter that lasts 15 seconds. After they run out of breath, they take 2 HP drowning damage every second."

## Impact

Players can breathe underwater indefinitely, walk at full speed, and jump normally. Oceans are just walkable terrain. Drowning, breath management, and swimming are core survival mechanics — their absence is game-breaking for survival mode.
