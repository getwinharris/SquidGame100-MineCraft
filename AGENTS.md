# DOX Framework

DOX is a highly performant AGENTS.md hierarchy installed here.
Agents must follow DOX instructions across any edits.

## Core Contract

AGENTS.md files are binding work contracts for their subtrees.
Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it.

## Mandatory Read Order

1. `AGENTS.md` (this file)
2. `docs/systematic-map.mmd` — the single project-map artifact
3. The narrow AGENTS.md for the package you are editing (`packages/{client,server,shared,docker}/AGENTS.md`)

## Read Before Editing

- Read the root AGENTS.md
- Read the project map at `docs/systematic-map.mmd`
- Identify every file or folder you expect to touch
- Walk from the repository root to each target path
- Read every AGENTS.md found along each route
- If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
- Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
- If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX
- Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Project Map as the Source of Truth

The project map at `docs/systematic-map.mmd` is the single source of truth for what is wired in the codebase. It is a mermaid flowchart showing:

- **Workspaces:** `@sg100/shared`, `@sg100/client`, `@sg100/server`
- **Modules:** every source file with its exports and responsibilities
- **Protocol:** wire message schemas, Zod validation, parse helpers
- **Rendering:** three.js scene, chunk system, terrain gen, player controller
- **Deployment:** Dockerfiles, Caddyfile, docker-compose
- **DOX:** AGENTS.md hierarchy
- **Gaps:** unwired features, missing systems, unimplemented mechanics

**Do not** create a JSON, MD, or extra MMD alongside it. The single `.mmd` is the only map artifact.

### How to regenerate the map

```bash
npm run generate:map
```

This runs `tools/generate-project-map.mjs`, which scans the entire repo (source, config, docs, deployment, tests, harness, issues) and regenerates the map. The generator follows the same pattern as GutConference and bapXphpAiBackend:

1. **registry()** — source of truth for what the project contains (modules, workspaces, configs, deploy, dox)
2. **scan()** — discovers actual files, compares to registry, finds gaps (missing files, unwired modules, missing CI)
3. **renderMermaid()** — generates the flowchart from scan results
4. **CLI wrapper** — calls scan, render, writes `docs/systematic-map.mmd`

### When to regenerate the map

- **On every commit.** Before `git commit`, run `npm run generate:map`. The map must reflect the code in the commit.
- **Before writing a GitHub issue.** Open `docs/systematic-map.mmd`, find the relevant subgraph, and quote the exact node or edge that justifies the issue.
- **Before pushing to `origin/main`.** The map must be current and the gap list must be accurate.

### How to use the map

1. Before editing, open `docs/systematic-map.mmd` and find the relevant subgraph.
2. Quote the exact node or edge that justifies your change.
3. After implementing, regenerate the map and confirm the gap is closed (or the new gap is intentional and accepted).
4. Run `npm run generate:map` to regenerate after any code change, then test using the browser and fix any issues or inconsistencies towards the objective.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards.

- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:

1. Purpose
2. Ownership
3. Local Contracts
4. Work Guidance
5. Verification
6. Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

- Re-check changed paths against the DOX chain
- Update nearest owning docs and any affected parents or children
- Refresh every affected Child DOX Index
- Remove stale or contradictory text
- Run existing verification when relevant
- Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md.

### GitHub Remote Workflow (2026-06-22)

**`origin/main` IS the GitHub remote.** Committing locally then pushing to `origin/main` lands code on the GitHub remote repository at `https://github.com/getwinharris/SquidGame100-MineCraft.git`.

- `origin` = the remote repository on GitHub. `origin/main` = the main branch on GitHub.
- `git push origin main` ships local commits to the remote GitHub repo.
- Before pushing: run `npm run typecheck` and `npm run build` to verify.
- After pushing: verify commits landed by checking `gh api repos/getwinharris/SquidGame100-MineCraft/commits`.
- Do not confuse `origin/main` with a local-only concept — it is the actual remote on GitHub.

### Execution Standards (2026-06-22)

**We ship working code.** Every agent implements, builds, and delivers. No skipped features documented as comments — if the scope says build it, build it.

- Implement every mechanic correctly against Minecraft wiki specs. Match vanilla behavior.
- No placeholder comments, no "skip with note" patterns. Ship the feature, not a note about the feature.
- Quality gates before handoff: `npm run typecheck` and `npm run build` exit 0.
- Full correctness over clever minimalism. Boring, working, complete code.

### Research-Driven Development (2026-06-22)

Every cycle starts with **player-1 researching minecraft.wiki** — comparing our implementation to vanilla Minecraft Java Edition. Critique becomes issues. Issues become fixes. Fixes get reviewed. Loop repeats.

**Cycle:**
```
player-1 research → file issues → game-fixer fix → game-reviewer verify → player-1 research (next topic)
```

**One topic per cycle.** Player-1 picks the next un-researched mechanic from the Gameplay Rules Contract. Research, compare, file critique as issues. CEO routes issues to game-fixer. Fix. Review. Next topic.

**Player-1 research output:**
- Wiki page URL researched
- Our implementation vs wiki — every discrepancy filed as a separate issue
- Correctness gaps (wrong mechanic) and completeness gaps (missing feature)
- Priority: P0 (blocks gameplay) > P1 (wrong behavior) > P2 (missing but minor) > P3 (cosmetic)

### Project direction (CEO-locked 2026-06-21)

- **WORLD SCALE: 1 block = 1 square foot.** Earth surface area = 5.49 × 10^15 ft² (5.49 quadrillion blocks). This is the game.
- **Real Earth from Google Earth data.** Extract real terrain, elevation, biomes, oceans, rivers, mountains, forests, deserts from Google Earth / Wikipedia / OpenStreetMap. The world IS Earth.
- **Focus: Minecraft mechanics + real Earth world.** Full Minecraft mechanics: chunked voxel world, block model rendering, crafting, inventory, redstone, mobs, caves, nether, end, day/night, weather, sky, clouds.
- **Streaming infinite terrain.** Load chunks around player. World generates from real Earth data. Player can walk anywhere on Earth.
- **Every stage must stay runnable:** `npm run typecheck` and `npm run build` exit 0 at every handoff.

### Asset Source Contract (2026-06-21, updated 2026-06-22)

**Textures are downloaded from minecraft.wiki to local files, served from the VPS.**

All block textures, item textures, and GUI textures are sourced from the original Mojang PNG files on https://minecraft.wiki/:
- **Download pipeline:** `tools/download-assets.mjs` parses `textureUrls.ts` + `items.ts` and fetches each PNG from wiki to local `packages/client/public/textures/` via 3-tier resolution (wiki API → direct URL → version bumps)
- **Served locally:** Client loads from `/textures/blocks/` and `/textures/items/` via `three.TextureLoader` — no runtime wiki URL loading
- **Fallback:** If a texture file is missing on disk, use solid color placeholder (logged warning)
- **Texture cache:** Client caches loaded textures in memory to avoid re-fetching
- **MCE-only items:** ~67 items (mob variants, adventure crystals, leather armor) don't exist on JE wiki — always use solid color fallback, keep entries in `items.ts` for reference

**Block model JSON also referenced from wiki:**
- Block model definitions follow https://minecraft.wiki/w/Block_models format
- Blockstates follow https://minecraft.wiki/w/Block_states format
- Models are loaded from JSON at runtime, not hardcoded in TypeScript

### Gameplay Rules Contract (extracted from Minecraft Wiki 2026-06-21)

The game must replicate Minecraft Java Edition mechanics exactly as documented on https://minecraft.wiki/:

#### Core Mechanics (from wiki)
- **Survival mode:** Health (20 HP), hunger (20 points), oxygen, drowning, fall damage
- **Creative mode:** Flying, unlimited blocks, no damage
- **Mining:** Tiered pickaxes (wood→stone→iron→diamond→netherite), correct tool per block
- **Crafting:** 2×2 inventory grid, 3×3 crafting table, shaped/shapeless recipes
- **Smelting:** Furnace (fuel + input → output), blast furnace (ores only), smoker (food only)
- **Redstone:** Dust, repeaters, comparators, pistons, dispensers, hoppers — full logic circuits
- **Enchanting:** Lapis lazuli + XP levels → random enchantments at enchanting table
- **Brewing:** Nether wart + ingredients → potions in brewing stand
- **Smithing:** Netherite upgrade template + diamond gear + netherite ingot → netherite gear
- **Trading:** Villager professions (farmer, librarian, weaponsmith, etc.) with emerald-based trades
- **Spawning:** Player spawns at world origin; beds set spawn point; respawn anchors in nether
- **Difficulty:** Peaceful (no mobs), Easy, Normal, Hard — affects mob spawning, damage, hunger

#### Block Interaction Rules (from wiki)
- **Leaves:** Decay when not within 4 blocks of log; drops saplings (1/20 chance)
- **Water:** Flows 8 blocks, source + flowing, can be collected with bucket
- **Lava:** Flows 8 blocks in nether, 4 in overworld, destroys items, light source (15)
- **Sand/Gravel:** Affected by gravity — falls if no block below
- **TNT:** Explodes 4 blocks radius (hard), ignited by redstone or flint & steel
- **Bed:** Sets spawn point, explodes in nether/end; allows sleeping to skip night
- **Chest:** 27 slots, double chest = 54 slots, hopper-readable
- **Dispenser:** Shoots items, activates when powered by redstone
- **Note block:** Plays note when struck; pitch depends on block below, instrument on block above
- **Farmland:** Created with hoe on dirt, hydrated within 4 blocks of water, crops grow on it
- **Ice:** Forms over water in cold biomes at Y≤128; melts near light sources

#### Progression (from wiki)
1. **Wood age:** Punch tree → crafting table → wooden tools
2. **Stone age:** Mine cobblestone → stone tools → furnace
3. **Iron age:** Mine iron ore (Y≤63) → smelt → iron tools/armor
4. **Diamond age:** Mine diamond ore (Y≤16) → diamond tools/armor → enchanting table
5. **Nether:** Build nether portal (obsidian frame + flint & steel) → netherite debris → netherite gear
6. **Ender dragon:** Find stronghold → fill ender eyes → enter end portal → kill dragon
7. **Wither:** Collect soul sand + wither skeleton skulls → spawn wither boss → nether star → beacon

#### Mob Rules (from wiki)
- **Passive:** Cow, pig, sheep, chicken, rabbit — drop food/leather/wool when killed
- **Neutral:** Wolf, enderman, iron golem, bee — attack if provoked
- **Hostile:** Zombie, skeleton, creeper, spider, enderman (night), witch — attack player on sight
- **Boss:** Ender dragon (720 HP), Wither (300 HP)
- **Spawning:** Hostile mobs spawn at night or in dark areas (light level ≤0); passive mobs spawn on grass in light
- **Despawning:** Mobs >128 blocks from player despawn instantly; <32 blocks never despawn

#### Crafting Computer & Internet (in-game extension)
- **Storage components:** Copper wire + redstone → storage unit
- **RAM:** Iron ingots + redstone dust → memory module
- **Processor:** Diamond + nether quartz + redstone → CPU
- **Computer:** Storage + RAM + CPU + glass panes + redstone → work computer
- **Internet:** Computer + copper wire + ender pearl → internet-connected computer
- **In-game internet:** AI villagers browse, research, learn — player can also browse real-world info

### Real-World Features Contract (2026-06-21)

#### GPS Spawn
- Browser Geolocation API → player spawns at their real device location
- Coordinates map to Minecraft world: latitude/longitude → block X/Z, Y = terrain height
- Fallback: If GPS denied, spawn at world origin (0, 0, 100)

#### Real-Time Timezone
- `Intl.DateTimeFormat().resolvedOptions().timeZone` → device timezone
- Day/night cycle synced to real-world time
- Sun position = solar time calculation for player's longitude
- Moon phase synced to actual lunar cycle

#### Single Earth World
- One shared world = Earth as of today's date (2026-06-21)
- All players join the same persistent world
- Terrain = real Earth surface data (elevation, biomes, oceans, rivers)
- Structures = real buildings from OpenStreetMap/Google Earth
- No world generation randomness — world IS Earth, deterministic from real data

#### AI Villagers (not zombies)
- Self-learning NPCs with human-like lifecycles
- Can work jobs, browse in-game internet, research, learn
- Build relationships, trade, farm, build, explore
- Persistent memory — remember player interactions
- Spawn in villages and cities based on real-world population data

### Tappables (Minecraft Earth-inspired 2026-06-21)

**Resource collection points inspired by the discontinued Minecraft Earth mobile game.**

- **7 tappable types:** stone, grass, ore, chest, mob, pond, tree
- **Scattered around the world** within 8-chunk radius of player
- **Floating, rotating blocks** with glow effect for visibility
- **Click to collect** — shows notification, grants XP
- **Cooldown system:** tappables respawn after 20-120 seconds
- **Weighted spawning:** ore and chest are rarer than stone and grass
- **Drops match Minecraft mechanics:** cobblestone from stone, ores from ore veins, food from chests, etc.

## Child DOX Index

- `docs/systematic-map.mmd` — single project-map artifact (mermaid flowchart of all wiring).
- `.github/AGENTS.md` — GitHub Actions workflows for CI and tag-driven deploy.
- `.harness/AGENTS.md` — agent team (CEO + browser-qa, player-1, game-fixer, game-reviewer) operating on this repo.
- `packages/AGENTS.md` — workspace package boundary and shared package rules.
  - `packages/client/AGENTS.md` — Vite/three.js browser client and web-game test hooks.
  - `packages/server/AGENTS.md` — authoritative Node/WebSocket server shell.
  - `packages/shared/AGENTS.md` — shared protocol, config, schemas, and deterministic utilities.

