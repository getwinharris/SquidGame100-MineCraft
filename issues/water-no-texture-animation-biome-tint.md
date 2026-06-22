# Water uses solid color instead of animated texture with biome tint

- **Wiki URL:** https://minecraft.wiki/w/Water#Appearance
- **Gap type:** `correctness`
- **Priority:** P1

## Our implementation

`packages/client/src/scene.ts:793-794`:
```
case BLOCK.WATER:
  return new MeshLambertMaterial({ color: 0x3f76e4, transparent: true, opacity: 0.6 });
```

Water is a flat solid color (0x3f76e4) at 60% opacity. No texture is loaded despite `packages/shared/src/textureUrls.ts:317` defining a texture URL (`Water_JE11.png`). The downloaded texture file exists at `packages/client/public/textures/blocks/Water_JE11.png` but is never used.

`packages/client/src/scene.ts:1080-1119` — `BLOCK.WATER` is mapped to an empty drop table `[]`, not relevant to rendering but shows water is treated as a non-functional block.

## Wiki behavior

> "Water uses a translucent animated texture that is tinted differently in different biomes."

The wiki documents 11+ biome-specific water colors (e.g., plains #3F76E4, swamp #617B64, warm ocean #43D5EE, frozen ocean #3938C9) and corresponding fog colors. Water is an animated texture, not a flat color.

## Impact

Water looks like a flat colored block rather than a dynamic animated fluid. No biome-specific water colors — all water is the same shade regardless of biome. No underwater fog color. When/if water becomes visible, this will be visually wrong.
