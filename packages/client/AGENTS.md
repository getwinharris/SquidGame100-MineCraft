# Client

## Purpose

Browser client for MineCraft: Vite, three.js rendering, HUD, input, and client network status.

## Ownership

- `src/main.ts` boots the DOM, renderer, and server connection.
- `src/scene.ts` owns voxel terrain, first-person movement, block interaction, wiki URL textures, first-person embodiment, and deterministic test hooks.
- `src/landmarks.ts` owns real-world landmark structures (Eiffel Tower, Niagara Falls, White House, Taj Mahal) with GPS coordinate conversion and block placement.
- `src/net.ts` owns the Stage 0 WebSocket handshake and ping loop.
- `index.html` owns the client shell and HUD markup/styles.

## Local Contracts

- Keep one primary canvas with ID `scene`.
- Expose `window.render_game_to_text()` with concise current state.
- Expose `window.advanceTime(ms)` for deterministic Playwright stepping.
- Keep WebSocket message parsing through `@sg100/shared`.

## Work Guidance

- Draw primary visuals in the canvas, not CSS backgrounds.
- Keep HUD text minimal during gameplay.
- All block textures load from minecraft.wiki URLs at runtime via `three.TextureLoader`. No procedural generation, no local PNG files.
- Health (20 HP) and hunger (20 points) systems match Minecraft Java Edition.
- Hunger depletes when sprinting; natural regeneration requires hunger >= 18.
- Day/night cycle: 20-minute cycle matching Minecraft, sky color and lighting update dynamically.

### Voxel Engine (scene.ts)
- Supports live rebuilding of the voxel instanced meshes on the main thread.
- Supports wireframe block highlights via raycasting.
- Allows block breaking (left-click) and block placement (right-click) matching the Minecraft standard.
- Provides a visual hotbar selector supporting numeric keys 1-9 or clicks.
- Integrates Web Audio API sound cue synthesizer.

### Tappables (Minecraft Earth-style)
- Resource nodes scattered around the world (stone, grass, ore, chest, mob, pond, tree).
- Floating, rotating blocks with glow effect for visibility.
- Click to collect resources (shows notification, grants XP).
- Cooldown system: tappables respawn after 20-120 seconds.
- Spawns 2-5 tappables per chunk within 8-chunk radius of player.

### UI Screens (index.html)
- **Title Screen:** Minecraft-style with logo, splash text, Singleplayer/Multiplayer/Realms buttons, bottom row (Language, Options, Accessibility, Friends), Quit Game.
- **Inventory Screen:** 27 storage slots, 9 hotbar slots, 4 armor slots, off-hand, 2x2 crafting grid, player model, recipe book button.
- **Settings Screen:** Main panel with FOV slider, Difficulty button, 8 sub-menu buttons (Music & Sounds, Video Settings, Controls, Language, Chat, Skin, Resource Packs, Accessibility).
- **Pause Menu:** Back to Game, Options, Save and Quit to Title.
- **Death Screen:** You Died! with Respawn and Title Screen buttons.

### HUD Elements
- Health hearts (20 HP = 10 hearts)
- Hunger bars (20 points = 10 food icons)
- Oxygen bubbles (300 = 15 seconds, shown when underwater)
- XP bar and level
- Coordinates (X, Y, Z)
- Chunks loaded count
- Time of day

### Water Mechanics
- Water drag: velocity damped by 0.8/frame when head in water
- Walk speed 50% in water, jump 60%
- Oxygen depletes at 20/sec (15s air), refills same rate
- Drowning damage: 1 HP/sec when oxygen depleted (not in Peaceful)

## Verification

- `npm -w @sg100/client run typecheck`
- `npm -w @sg100/client run build`
- Web-game smoke with `$WEB_GAME_CLIENT` against the Vite dev server.

## Child DOX Index

This scope has no child AGENTS.md files.
