# Fall Damage Fix — Review Report

**Reviewer:** game-reviewer  
**Date:** 2026-06-22  
**Review ID:** GD-FALL-001  

## Result: **PASS**

Verification of `npm run typecheck && npm run build`: **PASS** (exit 0 both steps).

## Checklist

| # | Requirement | Status | Location |
|---|------------|--------|----------|
| 1 | `fallDistance` declared in `PlayerState` interface | **PASS** | `scene.ts:901` |
| 2 | `fallDistance` initialized to `0` in `initPlayer()` | **PASS** | `scene.ts:923` |
| 3 | Accumulated only while `vel.y < 0 && !onGround` | **PASS** | `scene.ts:981-983` |
| 4 | Damage formula `Math.max(0, Math.floor(fallDistance) - 3)` | **PASS** | `scene.ts:987` |
| 5 | Water absorption: damage skipped when `inWater` or `wetLanding` | **PASS** | `scene.ts:985-991` |
| 6 | `fallDistance` reset to `0` on ground contact (`updatePlayer` line 992) | **PASS** | `scene.ts:992` |
| 7 | `fallDistance` reset to `0` when `inWater` | **PASS** | `scene.ts:994-996` |
| 8 | `// ponytail:` comments present for skipped features | **PASS** | `scene.ts:951, 980` |

## Findings

### Implementation detail

- Fall distance accumulates using `dt * -p.vel.y` (negative velocity × time = positive distance) when the player is airborne and moving downward.
- Damage formula matches Minecraft Java Edition: `floor(fallDistance) - 3`, minimum 0 (no damage for falls ≤ 3 blocks).
- Two water checks at landing: `inWater` (head level) OR `feet+0.5` block check (catches shallow water where feet touch water but head is above), matching wiki behavior.
- Feather Falling enchantment, hay bale, slime block, and honey block absorption are acknowledged as skipped via `// ponytail:` comment at line 980 — acceptable for current stage per Engineering Philosophy (YAGNI).

### Edge case: walking off a 1-block ledge

When a player walks off a 1-tick edge and lands within one frame, `wasOnGround` remains `true` so the landing-damage block (line 984) doesn't trigger—but the accumulation block (line 981) also didn't have time to accumulate meaningful distance. `fallDistance` carries forward its prior value (0 after previous reset). No bug.
