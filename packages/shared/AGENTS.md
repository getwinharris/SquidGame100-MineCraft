# Shared

## Purpose

Shared package for protocol schemas, deterministic utilities, and gameplay constants used by both client and server.

## Ownership

- `src/config.ts` owns project constants and shared gameplay/network defaults.
- `src/protocol.ts` owns wire message schemas and parse helpers.
- `src/rng.ts` owns deterministic pseudo-random helpers.
- `src/index.ts` owns the public export surface.

## Local Contracts

- All network message shape changes must be represented here first.
- Use schemas for runtime validation where data crosses package or network boundaries.
- Bump `PROTOCOL_VERSION` on breaking wire changes.

## Work Guidance

- Keep exports small and stable.
- Avoid browser-only or server-only APIs in this package.

## Verification

- `npm -w @sg100/shared run typecheck`
- `npm -w @sg100/shared run build`

## Child DOX Index

This scope has no child AGENTS.md files.
