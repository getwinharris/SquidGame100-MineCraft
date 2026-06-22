# Shared

## Purpose

Shared package for protocol schemas, deterministic utilities, and gameplay constants used by both client and server.

## Ownership

- `src/config.ts` owns project constants and shared gameplay/network defaults.
- `src/protocol.ts` owns wire message schemas and parse helpers.
- `src/rng.ts` owns deterministic pseudo-random helpers.
- `src/textureUrls.ts` owns block texture URL mappings to minecraft.wiki.
- `src/blocks.ts` owns block IDs (583+ blocks from 1.17-26.2), colors, and vanilla namespaced ID mappings.
- `src/blockRegistry.ts` owns JSON block model/state type definitions.
- `src/blockProperties.ts` owns block properties (hardness, resistance, light, transparency, tool, gravity, flammability).
- `src/blockStates.ts` owns block state properties (directional placement, door states, waterlogged, etc.).
- `src/items.ts` owns item registry (581+ items, IDs 10000+), properties, and Wiki name mappings.
- `src/inventory.ts` owns inventory system (item stacks, slot management, crafting grid).
- `src/crafting.ts` owns crafting recipe system (shaped and shapeless recipes).
- `src/furnaceRecipes.ts` owns furnace/smoker/blast furnace recipe registry and fuel entries.
- `src/lightEngine.ts` owns light engine (block light + sky light propagation, 0-15 levels).
- `src/fluids.ts` owns fluid simulation (water and lava flow mechanics).
- `src/mobs.ts` owns mob definitions (50+ mob types, properties, AI goals, spawning rules).
- `src/weather.ts` owns weather system (clear, rain, thunder, snow).
- `src/tappables.ts` owns tappable system (Minecraft Earth-style resource nodes with 11 types).
- `src/index.ts` owns the public export surface.

## Local Contracts

- All network message shape changes must be represented here first.
- Use schemas for runtime validation where data crosses package or network boundaries.
- Bump `PROTOCOL_VERSION` on breaking wire changes.
- Block IDs 0-583 are reserved for blocks; item IDs 10000+ are reserved for items.

## Work Guidance

- Keep exports small and stable.
- Avoid browser-only or server-only APIs in this package.
- Block textures reference minecraft.wiki URLs — no local PNG files.
- All game mechanics match Minecraft Java Edition as documented on minecraft.wiki.

## Verification

- `npm -w @sg100/shared run typecheck`
- `npm -w @sg100/shared run build`

## Child DOX Index

This scope has no child AGENTS.md files.
