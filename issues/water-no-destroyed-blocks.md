# Flowing water does not destroy certain blocks

- **Wiki URL:** https://minecraft.wiki/w/Water#Spreading
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/fluids.ts:111-127` — `isDestroyedByFluid` is defined but never called. It has a limited list (torch, redstone torch, crops) but misses many blocks the wiki lists.

Missing blocks that flowing water should destroy: carpets, cobweb, end rods, heads, flower pots, snow (layers), redstone dust, repeaters, comparators, levers, buttons, pressure plates, rails, ladders, vines.

## Wiki behavior

> "Spreading water extinguishes fire and washes away certain types of items or placed blocks, causing them to drop as items and then carrying them along in the flow until the edge of the spread. Affected items include plants (except trees), snow, torches, carpets, redstone dust and some other redstone components, cobweb, end rods, heads, and flower pots."

## Impact

Players can place torches, redstone, and carpets underwater without them being destroyed. Water-based block washing/transport is absent.
