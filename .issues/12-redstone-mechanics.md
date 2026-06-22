# Issue: Redstone Mechanics

## Priority: MEDIUM
## Status: OPEN

## Description
Implement full redstone circuit mechanics matching Minecraft Java Edition.

## Requirements (from minecraft.wiki)

### Components
- Redstone Dust: wire, transmits signal
- Redstone Torch: power source (inverted)
- Repeater: signal extender, delay (1-4 ticks)
- Comparator: signal comparison, subtraction
- Piston: pushes blocks (12 block limit)
- Sticky Piston: pushes and pulls blocks
- Dispenser: shoots items when powered
- Dropper: pushes items to inventory
- Hopper: transfers items between containers
- Note Block: plays sounds when powered
- Tripwire Hook: detects entities
- Pressure Plates: detects players/items
- Button: momentary power source
- Lever: toggle power source
- Daylight Sensor: power based on time of day

### Mechanics
- Signal strength 0-15
- Signal decay over distance
- Repeaters refresh signal to 15
- Comparators read container fullness
- Pistons push up to 12 blocks
- Redstone ticks (0.1 seconds each)

## Acceptance Criteria
- [ ] Redstone dust transmits signal
- [ ] Redstone torches provide power
- [ ] Repeaters extend and delay signals
- [ ] Comparators compare signals
- [ ] Pistons push blocks
- [ ] Sticky pistons push and pull
- [ ] Dispensers shoot items
- [ ] Hoppers transfer items
- [ ] Pressure plates detect players
- [ ] Buttons and levers toggle power

## Wiki Reference
https://minecraft.wiki/w/Redstone_circuits
