# Packages

## Purpose

Owns the TypeScript workspaces that make up SquidGame100 MineCraft.

## Ownership

- `client/` owns the browser runtime, visuals, input, and client network adapter.
- `server/` owns authoritative HTTP/WebSocket runtime behavior.
- `shared/` owns cross-package protocol, config, schemas, and deterministic utilities.
- `docker/` owns package-specific container images and reverse-proxy config.

## Local Contracts

- Keep package boundaries explicit. Cross-package runtime contracts belong in `@sg100/shared`.
- Keep TypeScript strict and ESM-compatible across all workspaces.
- Do not duplicate protocol constants or wire message shapes in client/server packages.

## Work Guidance

- Prefer small, stage-scoped changes that leave the repo runnable.
- For web-game client work, keep `window.render_game_to_text` and `window.advanceTime(ms)` working.

## Verification

- `npm run typecheck`
- `npm run build`

## Child DOX Index

- `client/AGENTS.md` — Vite/three.js browser client.
- `server/AGENTS.md` — Node/WebSocket server.
- `shared/AGENTS.md` — shared protocol and deterministic contracts.
- `docker/AGENTS.md` — Docker and Caddy deployment assets.
