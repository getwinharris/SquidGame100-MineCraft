# Issue: Mob Spawning System

## Priority: HIGH
## Status: OPEN

## Description
Implement mob spawning matching Minecraft Java Edition rules: passive mobs in daylight, hostile mobs at night or in dark areas.

## Requirements (from minecraft.wiki)

### Passive Mobs
- Cow, Pig, Sheep, Chicken, Rabbit
- Spawn on grass in light level >= 9
- Drop food/leather/wool when killed
- Can be bred with wheat/carrots/seeds

### Neutral Mobs
- Wolf, Enderman, Iron Golem, Bee
- Attack only when provoked

### Hostile Mobs
- Zombie, Skeleton, Creeper, Spider, Witch
- Spawn at night or in dark areas (light level <= 0)
- Attack player on sight

### Spawning Rules
- Hostile mobs spawn at night or in darkness
- Passive mobs spawn on grass in daylight
- Mobs > 128 blocks from player despawn instantly
- Mobs < 32 blocks never despawn

## Acceptance Criteria
- [ ] Passive mobs spawn on grass during day
- [ ] Hostile mobs spawn at night
- [ ] Mobs have basic AI (wander, flee, attack)
- [ ] Mobs drop items when killed
- [ ] Mob health system works
- [ ] Despawning works correctly

## Wiki Reference
https://minecraft.wiki/w/Mob_spawning
