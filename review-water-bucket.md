# Review: Water Bucket Fix

**Reviewer:** game-reviewer  
**Date:** 2026-06-22  
**Commit:** `bfdaa58` / `5e869fb` (merged into `main`)

## Checks

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |
| Bucket collection (line 1563): right-click water with `ITEM.BUCKET` → `setBlock(bx,by,bz, BLOCK.AIR)` → held item becomes `ITEM.WATER_BUCKET` → `rebuildWorldMesh` | ✅ PASS |
| Bucket placement (line 1615): right-click with `ITEM.WATER_BUCKET` → `setBlock(nx,ny,nz, BLOCK.WATER)` → held item becomes `ITEM.BUCKET` → `rebuildWorldMesh` | ✅ PASS |
| Uses existing `setBlock`/`rebuildWorldMesh` pattern | ✅ PASS |
| `// ponytail:` comments present (3 existing, pre-refactor — water material L796, swimming L951, fall damage L980) | ✅ PASS |
| No stray edits within bucket code sections | ✅ PASS |

## Override Note

**FAIL — Minimum diff violation.** The water bucket logic itself is correct, but it was bundled into a massive merge commit (`bfdaa58`) that rewrites `packages/client/src/scene.ts` entirely (+2525 lines, -2569 lines net in the file) alongside the full Squid Game → Earth Minecraft refactor. The deliverable explicitly requires a **minimum diff** for the bucket change alone. This should have been a focused commit or stacked on top of the refactor as a separate, reviewable change.

The bucket mechanics work correctly and pass all functional checks, but the delivery packaging does not meet the minimum-diff standard.

## Verdict

**FAIL** — functional correctness is good, but the change is not a minimum diff.
