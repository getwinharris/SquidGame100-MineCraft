# Client

## Purpose

Browser client for SquidGame100 MineCraft: Vite, three.js rendering, HUD, input, and client network status.

## Ownership

- `src/main.ts` boots the DOM, renderer, and server connection.
- `src/scene.ts` owns the Stage 0 three.js scene and deterministic test hooks.
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
- Stage 1 Voxel Engine:
  - Supports live rebuilding of the voxel instanced meshes on the main thread.
  - Supports wireframe block highlights via raycasting.
  - Allows block breaking (left-click) and block placement (right-click) matching the Minecraft standard.
  - Provides a visual hotbar selector supporting numeric keys 1-9 or clicks.
  - Integrates Web Audio API sound cue synthesizer representing Ghast ambient (Green Light), Blaze hit (Red Light), Explosion (Death), Level Up (Pass), Glass Break, and Lobby countdown Plings.
  - Generates parallel Glass Bridge pathways with randomized fragile block triggers and recursive shattering algorithms.

## Verification

- `npm -w @sg100/client run typecheck`
- `npm -w @sg100/client run build`
- Web-game smoke with `$WEB_GAME_CLIENT` against the Vite dev server.

## Child DOX Index

This scope has no child AGENTS.md files.
