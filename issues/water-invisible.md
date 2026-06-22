# Water blocks are invisible (not rendered)

- **Wiki URL:** https://minecraft.wiki/w/Water
- **Gap type:** `correctness`
- **Priority:** P0

## Our implementation

`packages/client/src/scene.ts:711` and `packages/client/src/scene.ts:743` — both lines in `buildChunkMesh` skip `BLOCK.WATER`:

```
if (id === BLOCK.AIR || id === BLOCK.WATER) continue;
```

Water is treated identically to air during mesh building — no faces are generated. Water never appears in the world.

`packages/client/src/scene.ts:793-794` — water material exists but is only reachable via `createBlockMaterial`, which is never called for water since the mesh builder skips it.

## Wiki behavior

Water is a visible translucent fluid. It renders as a translucent animated texture with biome-tinted colors. The top face is visible at the water surface, and side faces show the water column depth.

## Impact

Oceans, rivers, and all water bodies are invisible. The player sees through water blocks as if they were air, making water-based gameplay (swimming, fishing, boat travel) impossible. This is a critical rendering bug.
