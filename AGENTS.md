# DOX Framework

DOX is a highly performant AGENTS.md hierarchy installed here.
Agents must follow DOX instructions across any edits.

## Core Contract

AGENTS.md files are binding work contracts for their subtrees.
Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it.

## Read Before Editing

- Read the root AGENTS.md
- Identify every file or folder you expect to touch
- Walk from the repository root to each target path
- Read every AGENTS.md found along each route
- If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
- Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
- If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX
- Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

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

### Project direction (CEO-locked 2026-06-20)

- **Standalone recreation, not a Minecraft mod.** We are rebuilding the full Minecraft gameplay experience as our OWN engine (TypeScript + three.js + authoritative Node server) for the SquidGame100 team — we do not target the real Minecraft client or read real Minecraft binaries. The 100-player permadeath Squid Game battle-royale is layered on top of a complete Minecraft-grade sandbox.
- **Recreate full Minecraft gameplay** — chunked voxel world, block model rendering, proper 16×16 textures, crafting, inventory, redstone, mobs, world generation — then build the BR features. Do not ship a "Minecraft-ish" BR; ship Minecraft, then the game.
- **Native formats follow the Minecraft Wiki.** Even though we own the engine, our data formats match vanilla so assets are portable and contributors understand them: 16×16 PNG textures (powers of 2 ok, alpha supported), JSON block models (`parent`/`elements`/`faces`/`textures`), JSON blockstates, and `.mcfunction`-style script files for game/mini-game logic. Treat the Minecraft Wiki as the authoritative spec for these formats.
- **Build style:** staged/versioned, PR-driven via GitHub, PR-open → CI green → reviewer (or `game-reviewer`) PASS → merge → tag. The CEO (`mavis`) orchestrates the `browser-qa` / `player-1` / `game-fixer` / `game-reviewer` reins; agents never grade their own work.
- **Every stage must stay runnable:** `npm run typecheck` and `npm run build` exit 0 at every handoff; client smoke (`render_game_to_text` / `advanceTime`) and server `/healthz` must keep working.

## Child DOX Index

- `.github/AGENTS.md` — GitHub Actions workflows for CI and tag-driven deploy.
- `.harness/AGENTS.md` — agent team (CEO + browser-qa, player-1, game-fixer, game-reviewer) operating on this repo.
- `packages/AGENTS.md` — workspace package boundary and shared package rules.
  - `packages/client/AGENTS.md` — Vite/three.js browser client and web-game test hooks.
  - `packages/server/AGENTS.md` — authoritative Node/WebSocket server shell.
  - `packages/shared/AGENTS.md` — shared protocol, config, schemas, and deterministic utilities.
  - `packages/docker/AGENTS.md` — Dockerfiles and reverse-proxy deployment assets.
