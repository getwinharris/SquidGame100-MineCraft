# Waterlogging block state defined but not functional

- **Wiki URL:** https://minecraft.wiki/w/Water (general water behavior)
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/shared/src/blockStates.ts:14,46,73,157-341` — `waterlogged` property is defined as a block state property. Many blocks (stairs, slabs, fences, doors, trapdoors, walls) have `waterloggable: true` and `waterlogged: 'false'` as default.

`packages/shared/src/blockStates.ts:73-74`:
```
waterloggable?: boolean;
```

`packages/shared/src/blockStates.ts:157-341` — at least 25 blocks define waterloggable properties.

However, no code implements waterlogging behavior. A waterloggable block placed in water does not become waterlogged. Water does not occupy the same space as a waterloggable block.

## Wiki behavior

In Minecraft Java Edition (1.13+), certain blocks (stairs, slabs, fences, walls, doors, trapdoors, signs, banners, etc.) can be "waterlogged" — they occupy the same block space as water. The water is rendered inside the block. Breaking a waterlogged block leaves the water behind.

## Impact

Stairs and slabs placed underwater leave air pockets instead of being waterlogged. This affects underwater construction and redstone builds. The data model exists but the mechanic is missing.
