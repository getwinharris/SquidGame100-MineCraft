# Water bucket item cannot be used to place or collect water

- **Wiki URL:** https://minecraft.wiki/w/Water#Obtaining and https://minecraft.wiki/w/Water#Post-generation
- **Gap type:** `completeness`
- **Priority:** P1

## Our implementation

`packages/shared/src/items.ts:1731-1737` — `water_bucket` item exists with `maxStackSize: 1` and category `misc`.

`packages/client/src/scene.ts` — no bucket placement code. The hotbar/tool handling contains no logic to place water when selecting a water bucket item. No right-click action for water buckets.

`packages/client/src/scene.ts:1080-1119` — `BLOCK.WATER` returns an empty drop array `[]`, meaning breaking water drops nothing, which is correct (water disappears), but there's also no bucket return on collection.

## Wiki behavior

> "Water can be collected by using a bucket on a water source block or a full water cauldron, creating a water bucket."

> "Using a water bucket or a bucket of aquatic mob creates water (except in the Nether)."

Players can right-click a water source with an empty bucket to collect it, and right-click with a water bucket to place a water source block.

## Impact

Players cannot pick up or place water. Water buckets are in the item registry but serve no purpose. Water-based gameplay (clearing underwater areas, creating waterfalls, moats) is impossible.
