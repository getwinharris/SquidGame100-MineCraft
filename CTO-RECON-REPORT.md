# CTO Reconnaissance Report — SquidGame100 MineCraft

**Date:** 2026-06-18  
**Agent:** CTO (parent agent)  
**Scope:** Stage 0 Foundation — full codebase, build, Docker, browser smoke test, protocol verification

## Executive Summary

The project is in solid shape for Stage 0. Typecheck and build pass for all three workspaces. The browser client renders the three.js scene correctly, WebSocket ping/pong works, and the `window.render_game_to_text` / `window.advanceTime` deterministic hooks are functional. However, **three real issues** were found that require fixes before the foundation is fully stable.

---

## 1. HIGH — Server Dockerfile Runtime Stage Missing Client Workspace

**File:** `packages/docker/server.Dockerfile`  
**Line:** Second stage (runtime image)  
**Severity:** HIGH — Will cause Docker build failure or runtime crash

### Problem

The multi-stage Dockerfile builds `@sg100/server` in stage 1, then copies only `packages/shared` and `packages/server` into the runtime stage. But the root `package.json` declares three workspaces:

```json
"workspaces": ["packages/shared", "packages/client", "packages/server"]
```

When `npm install --omit=dev` runs in the runtime stage, npm will fail because it cannot find `packages/client/package.json`. This breaks the workspace symlink resolution, and the server container will either fail to build or crash at runtime because `@sg100/shared` cannot be resolved.

### Fix

Add the missing `COPY` line in the second stage of `server.Dockerfile`:

```dockerfile
COPY packages/client/package.json packages/client/package.json
```

### DOX Impact

- `packages/docker/AGENTS.md` may need a note about keeping all workspace package.json copies in sync.

---

## 2. MEDIUM — Root package.json Missing `"type": "module"`

**File:** `package.json` (root)  
**Severity:** MEDIUM — Causes ESLint performance warning and potential Node.js module resolution ambiguity

### Problem

The root `package.json` does not have `"type": "module"`. However, the `eslint.config.js` uses ES module syntax (`import`/`export`). Node.js emits a warning:

```
Warning: Module type of .../eslint.config.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to .../package.json.
```

All three workspace packages already declare `"type": "module"` in their own `package.json`. The root should be consistent.

### Fix

Add `"type": "module"` to the root `package.json`.

### DOX Impact

- `packages/AGENTS.md` already says "Keep TypeScript strict and ESM-compatible across all workspaces." This fix brings the root in line.

---

## 3. LOW — `.harness` Smoke Test Files Outside DOX, With Lint Warnings

**File:** `.harness/qa/smoke/stage0-smoke.mjs` and related files  
**Severity:** LOW — Not part of the published workspace, but lint warnings pollute CI output

### Problem

Previous agent work created `.harness/` files for smoke testing. These are not part of the `packages/` workspace boundary and are not covered by any `AGENTS.md`. The root `eslint.config.js` does not ignore `.harness/`, so running `npm run lint` produces 4 warnings from these files:

- `existsSync` defined but never used
- `wsEvents` assigned but never used
- `e` defined but never used (twice)

### Fix Options

1. Add `**/.harness/**` to the root `eslint.config.js` ignores list.
2. Or, clean up the unused variables in the harness files.

The preferred fix is **Option 1** — the `.harness` directory is temporary/development tooling and should not be linted as part of the main workspace.

### DOX Impact

- The root `eslint.config.js` is a project-level config, so this is a root-level change. No child AGENTS.md needs updating.

---

## 4. INFO — Client Build Chunk Size Warning (Non-blocking)

**File:** `packages/client` build output  
**Severity:** INFO — Not a bug, but an optimization opportunity

### Observation

The Vite build produces a single chunk of 526KB (minified). Vite warns:

```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks
```

For Stage 0, this is acceptable. The bulk is three.js. However, for later stages, we should split three.js into a separate vendor chunk. This is a known future optimization and does not need to be fixed now.

---

## Browser Smoke Test Results

| Check | Result |
|-------|--------|
| Client page loads | ✅ PASS |
| Title correct | ✅ PASS |
| three.js scene renders | ✅ PASS (green ground, pink sphere, ink sky) |
| Title card dismisses on click | ✅ PASS |
| WebSocket connects | ✅ PASS (status shows "online") |
| Ping/pong RTT updates | ✅ PASS (RTT visible) |
| `window.render_game_to_text()` | ✅ PASS — returns valid JSON with camera, entities, networkHud |
| `window.advanceTime(1000)` | ✅ PASS — updates camera position deterministically |
| Server `/healthz` | ✅ PASS — returns `{"ok":true,"name":"SquidGame100 MineCraft","protocol":1,"tickHz":20}` |
| Server `/` | ✅ PASS — returns service descriptor with `health` and `ws` links |

---

## Verification Commands Run

```bash
npm run typecheck    # ✅ PASS — all workspaces
npm run build        # ✅ PASS — all workspaces
npm run lint         # ⚠️ 4 warnings (from .harness files)
curl http://localhost:8080/healthz   # ✅ PASS
```

---

## Recommended Fix Order

1. Fix `server.Dockerfile` (HIGH)
2. Add `"type": "module"` to root `package.json` (MEDIUM)
3. Add `.harness` to ESLint ignores (LOW)

After each fix, run `npm run typecheck` and `npm run build` to verify nothing broke.

---

## DOX Compliance Notes

- All three issues are outside the core TypeScript source code (Dockerfile, root package.json, ESLint config).
- The `packages/docker/AGENTS.md` should be updated after the Dockerfile fix to document the workspace copy requirement.
- The root `AGENTS.md` should be updated if the root package.json structure changes.
