# Water/lava interaction functions exist but are never called

- **Wiki URL:** https://minecraft.wiki/w/Water#Water_and_lava
- **Gap type:** `completeness`
- **Priority:** P1

## Our implementation

`packages/shared/src/fluids.ts:132-148` — three functions are defined:

- `createsCobblestone` (line 132) — checks if water and lava are both source blocks
- `createsStone` (line 139) — checks lava + water level >= 1
- `createsObsidian` (line 146) — checks water + lava source

All three are exported but never imported or called by any consumer. Zero call sites.

Additionally, `createsCobblestone` checks `waterBlock === BLOCK.WATER && lavaBlock === BLOCK.LAVA` — this returns true for both source blocks, but the wiki says cobblestone forms from flowing lava touching water (or water touching flowing lava), not two source blocks. Obsidian should form from a lava source touched by water.

## Wiki behavior

> "If water touches a lava source, the lava source turns to obsidian. If both touch each other while flowing, cobblestone is made and no sources are removed, and if lava flows downward onto water, the water turns to stone."

The exact rules:
- **Obsidian:** water source/flowing touches lava source → lava source becomes obsidian
- **Cobblestone:** water + flowing lava (or flowing lava + water) → cobblestone at contact point
- **Stone:** lava flowing down onto water → water becomes stone

## Impact

Players can't create cobblestone generators or obsidian. These are fundamental to progression (nether portal needs obsidian, cobblestone generators are early-game infrastructure). The functions exist but are dead code.
