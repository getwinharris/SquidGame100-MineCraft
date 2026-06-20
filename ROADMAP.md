# SquidGame100 MineCraft — Roadmap

Approved 2026-06-20. Standalone recreation of Minecraft (not a mod), layered with a 100-player permadeath Squid Game battle-royale. 

**Standard:** All mechanics and assets must match the [Minecraft Wiki](https://minecraft.wiki/). No hardcoded colors; no "placeholders." If it's not in the Wiki, it's not in the game. Every stage ships runnable: `npm run typecheck` + `npm run build` exit 0, the client smoke (`render_game_to_text` / `advanceTime`) and server `/healthz` keep working. Stages merge PR-driven: PR → CI green → `game-reviewer` PASS → CEO merges → tag.

## Phase A — Minecraft Engine Core

| Stage | Deliverable | Exit Criteria |
|---|---|---|
| **A1.1** | Voxel Chunk Store & Registry | 16×16×64 chunks, block registry (ID $\rightarrow$ Type), deterministic seed-based generation. |
| **A1.2** | Greedy Meshing (Worker) | High-performance geometry pipeline running off-main-thread. |
| **A1.3** | First-Person Controller | Pointer-lock, WASD, jump, gravity, AABB voxel collision, fly toggle. |
| **A1.4** | Block Interaction | Raycast break/place, mining tiers (hardness), item drops. |
| **A1.5** | Game Modes | Survival vs. Creative (infinite blocks, flight, instant-break). |
| **A1.6** | Day/Night Cycle | 20-minute deterministic cycle, sun/moon movement, lighting shifts. |
| **A2** | Asset Pipeline | 16×16 PNG textures, JSON block models (`parent`/`elements`/`faces`), blockstates. |
| **A3** | Inventory & Crafting | Inventory UI, crafting grid, JSON recipe registry (vanilla format). |
| **A4** | World Generation | Noise terrain, biomes, ores, trees. |
| **A5** | Redstone | Dust, torches, repeaters, power propagation. |
| **A6** | Mobs & Entities | Entity system, AI, spawning, health, pathfinding. |

## Phase B — Squid Game Battle-Royale

| Stage | Deliverable |
|---|---|
| **B1** | Authoritative Netcode | 100-player rooms, prediction, reconciliation, interpolation. |
| **B2** | Match Flow | Lobby $\rightarrow$ Match $\rightarrow$ Elimination $\rightarrow$ Spectator. |
| **B3** | Squid Game Island | Hand-authored arena (dorm, playground, bridge, vault) using Minecraft-format blocks. |
| **B4-B10**| Mini-Games | RLGL (precision movement detection), Dalgona, Tug of War, Marbles, Glass Bridge, Mingle, Final Game. |
| **B11** | Spectator Polish | Streaming tools, free-cam, event log. |
| **B12** | Production Hardening | Caddy/Docker/CI $\rightarrow$ squidgame100.cloud. |

## Done

- **Stage 0** — Foundation: Monorepo, Shared/Client/Server shells, Docker/Caddy, CI/CD, DOX chain.
