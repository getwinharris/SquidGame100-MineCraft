# Issue: Food Items and Eating

## Priority: HIGH
## Status: OPEN

## Description
Implement food items and eating mechanics matching Minecraft Java Edition.

## Requirements (from minecraft.wiki)

### Food Items
- Apple: restores 4 hunger, 2.4 saturation
- Bread: restores 5 hunger, 6 saturation
- Cooked Beef: restores 8 hunger, 12.8 saturation
- Cooked Pork: restores 8 hunger, 12.8 saturation
- Cooked Chicken: restores 6 hunger, 7.2 saturation
- Cooked Mutton: restores 6 hunger, 9.6 saturation
- Cooked Rabbit: restores 5 hunger, 6 saturation
- Cooked Cod: restores 5 hunger, 6 saturation
- Cooked Salmon: restores 6 hunger, 9.6 saturation
- Carrot: restores 3 hunger, 3.6 saturation
- Potato: restores 1 hunger, 0.6 saturation
- Baked Potato: restores 5 hunger, 6 saturation
- Golden Apple: restores 4 hunger, 9.6 saturation + Absorption + Regeneration

### Eating Mechanics
- Right-click to eat (1.6 seconds)
- Hunger bar depletes over time
- Sprinting depletes hunger faster
- Natural regeneration requires hunger >= 18
- Starvation damage when hunger == 0
- Food saturation affects regeneration speed

## Acceptance Criteria
- [ ] Food items exist in game
- [ ] Right-click to eat food
- [ ] Eating restores hunger
- [ ] Hunger depletes over time
- [ ] Sprinting costs hunger
- [ ] Natural regeneration works
- [ ] Starvation damage works
- [ ] Different foods restore different amounts

## Wiki Reference
https://minecraft.wiki/w/Food
