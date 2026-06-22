# Deliverable: Water Bucket Placement & Collection

**Issue:** `issues/water-no-bucket-placement.md` (P1)

## Changes

`packages/client/src/scene.ts` — two additions in the right-click (e.button === 2) handler:

### Bucket Collection (line 1567)
When targeting a `BLOCK.WATER` block while holding `ITEM.BUCKET` (empty bucket), the water is removed (`BLOCK.AIR`), and the held item is replaced with `ITEM.WATER_BUCKET`.

### Water Bucket Placement (line 1617)
When holding `ITEM.WATER_BUCKET` and right-clicking a block face, water (`BLOCK.WATER`) is placed at the adjacent position instead of the selected block. The held item is replaced with `ITEM.BUCKET`.

## Design Decisions

- **Lava bucket collection not included** (separate issue, per brief)
- **No water flow logic added** — existing fluid simulation handles it
- **No stacking logic** — buckets don't stack in vanilla (water_bucket maxStackSize: 1, bucket maxStackSize: 16)
- **Water bucket uses right-click** matching vanilla Minecraft behavior
- Collection uses the same `setBlock`/`rebuildWorldMesh` pattern as existing block breaking

## Verification

- `npm run typecheck` — passes
- `npm run build` — passes
