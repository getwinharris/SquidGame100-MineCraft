# SquidGame100 MineCraft — Roadmap

Approved 2026-06-20. Two phases: rebuild full Minecraft as our **own** engine,
then layer the 100-player permadeath Squid Game battle-royale on top. We are a
standalone recreation — not a Minecraft mod — but our data formats follow the
[Minecraft Wiki](https://minecraft.wiki/) so assets are portable and familiar
(16×16 PNG textures, JSON block models, JSON blockstates, `.mcfunction`).

Every stage ships runnable: `npm run typecheck` + `npm run build` exit 0, the
client smoke (`render_game_to_text` / `advanceTime`) and server `/healthz` keep
working. Stages merge PR-driven: PR → CI green → `game-reviewer` PASS → CEO
merges → tag.

## Phase A — Minecraft engine core

| Stage | Deliverable | Exit criteria |
|---|---|---|
| **A1.1** | Chunk store (16×16×`WORLD_HEIGHT`), block registry (state-keyed), deterministic unit | World holds/serializes blocks; reads/writes by voxel coord |
| **A1.2** | Greedy meshing in a Web Worker; chunk geometry pipeline | Chunk edits remesh without jank; worker off main thread |
| **A1.3** | First-person controller: pointer-lock, WASD, jump, gravity, AABB voxel collision, fly toggle | Walk/fly/collide through a flat/test voxel field |
| **A1.4** | Raycast break/place, block hotbar, mining tiers + hardness + drops | Mine and place blocks; correct tool/speed |
| **A2** | Asset pipeline: texture atlas from 16×16 PNG, block-model JSON parser (`parent`/`elements`/`faces`/`textures`), blockstate JSON, UV mapping into mesher | A block renders from its model+texture files, not hardcoded |
| **A3** | Inventory + crafting: inventory UI, crafting grid, JSON recipe registry (vanilla format), item stacks | Craft items via recipes |
| **A4** | World generation: deterministic noise terrain, biomes, ores, trees (seed via `shared/rng`) | Same seed → same world |
| **A5** | Redstone: dust/torches/repeaters, power propagation, basic contraptions | A working redstone circuit |
| **A6** | Mobs + entities: entity system, mob AI, spawning, health/damage, pathfinding | Hostile/passive mobs live and behave |

## Phase B — Squid Game battle-royale

| Stage | Deliverable |
|---|---|
| **B1** | Authoritative netcode: 100-player rooms, client prediction + reconciliation, entity interpolation, spectators |
| **B2** | Match flow + permadeath: lobby → match → elimination→spectator → last-one-standing |
| **B3** | Squid Game island: hand-authored arena (dorm, Young-hee, glass bridge, dorm stairs) from Minecraft-format blocks |
| **B4–B10** | Mini-games: Red Light Green Light, Dalgona, Tug of War, Marbles, Glass Stepping Stones, Mingle, final Squid Game |
| **B11** | Spectator + streaming polish |
| **B12** | Production hardening (Caddy/Docker/CI → squidgame100.cloud) |

## Done

- **Stage 0** — Foundation: npm-workspace monorepo, `@sg100/shared` (config,
  RNG, zod protocol), `@sg100/client` (Vite + three.js placeholder scene + WS),
  `@sg100/server` (Fastify health + `/ws` handshake), Docker/Caddy, GitHub
  Actions CI + tag deploy, DOX chain + agent harness. Merged via PR #1.
