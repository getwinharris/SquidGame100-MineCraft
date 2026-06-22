# SquidGame100 MineCraft

A 100-player, permadeath, Squid Game–themed voxel battle-royale that runs in the browser.
TypeScript monorepo: three.js + Web Workers client, authoritative Node WebSocket server, shared protocol.

> Hosted at https://squidgame100.cloud/

## Status

Voxel survival/PvP foundation in progress. The browser client currently has an instanced voxel world, original procedural 16px block textures, first-person movement and hand, block mining/placement, a nine-slot hotbar, survival HUD, and a melee combat opponent. Squid Game presentation is paused while the standalone sandbox foundation is built out.

The current textures and models are original project assets; proprietary Minecraft assets are not bundled.

## Architecture

```
packages/
├── shared/   # protocol types, deterministic RNG, game config (zod schemas)
├── client/   # Vite + three.js + Web Workers (greedy meshing, worldgen)
└── server/   # Node + ws authoritative tick server + room/match management
```

- **Transport:** WebSocket, authoritative server at ~20 Hz tick.
- **Voxel engine:** chunked world, greedy meshing off the main thread in Web Workers.
- **Deploy:** `docker-compose.yml` (client: nginx, server: node, caddy: reverse proxy + TLS + WS).

## Getting started

```bash
npm install            # install all workspaces
npm run dev:client     # Vite dev server (http://localhost:5173)
npm run dev:server     # Node dev server (ws://localhost:8080)
npm run typecheck      # typecheck every workspace
npm run build          # build every workspace
```

### Local Docker smoke test

```bash
docker compose build
docker compose up      # client :8080 (via caddy), server :8081
```

## Docs

- `AGENTS.md` — DOX framework (binding work contracts; read before editing).
- Per-package `AGENTS.md` — local contracts (purpose, ownership, verification).

## License

UNLICENSED (proprietary).
