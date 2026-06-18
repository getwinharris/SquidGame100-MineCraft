# Docker

## Purpose

Container and reverse-proxy assets for local smoke tests and VPS deployment.

## Ownership

- `client.Dockerfile` builds and serves the Vite client with nginx.
- `server.Dockerfile` builds and runs the Node server.
- `Caddyfile` owns reverse proxy, static client routing, and WebSocket upgrade routing.

## Local Contracts

- Keep client traffic on the public Caddy entrypoint.
- Route `/ws` and `/healthz` to the server container.
- Keep Docker builds reproducible from the repository root.

## Work Guidance

- Do not add secrets to images or compose files.
- Prefer environment variables for deployment-specific hostnames and ports.

## Verification

- `docker compose build`
- `docker compose up`

## Child DOX Index

This scope has no child AGENTS.md files.
