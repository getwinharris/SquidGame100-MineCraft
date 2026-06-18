# Server

## Purpose

Authoritative Node server shell for SquidGame100 MineCraft.

## Ownership

- `src/index.ts` owns HTTP health, WebSocket upgrade, Stage 0 handshake, and ping/pong behavior.
- `package.json` owns server runtime and dev scripts.

## Local Contracts

- Keep server behavior authoritative as gameplay systems arrive.
- Parse inbound client messages through `@sg100/shared`.
- Keep `/healthz` available for deployment checks.
- Keep WebSocket traffic on `/ws`.

## Work Guidance

- Stage 0 only proves connectivity. Room, match, input, and snapshot logic belongs to later stages.
- Log actionable connection and protocol errors without leaking secrets.

## Verification

- `npm -w @sg100/server run typecheck`
- `npm -w @sg100/server run build`
- `curl http://localhost:8080/healthz`

## Child DOX Index

This scope has no child AGENTS.md files.
