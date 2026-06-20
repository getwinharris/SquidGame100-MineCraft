# Stage 0 browser-qa — filed issues

Six reproducible defects discovered during the Stage 0 browser smoke on 2026-06-18.
`gh` was not authenticated on this host, so per `browser-qa/AGENTS.md` the
reports were written here. The CTO can re-file them as GitHub issues, or
this directory can be checked in alongside the next plan cycle.

| # | Slug | Title | Package | DOX path | Severity |
|---|---|---|---|---|---|
| 01 | `01-protocol-not-strict.md` | Wire protocol schemas silently accept unknown fields | `@sg100/shared` | `packages/shared/AGENTS.md` | Medium |
| 02 | `02-ping-t-no-sanity.md` | Server `ping` accepts arbitrary `t` values (no timestamp sanity) | `@sg100/server`, `@sg100/shared` | `packages/server/AGENTS.md`, `packages/shared/AGENTS.md` | Medium |
| 03 | `03-bad-message-not-disambiguated.md` | Server `bad_message` error code does not distinguish cause | `@sg100/server`, `@sg100/shared` | `packages/server/AGENTS.md`, `packages/shared/AGENTS.md` | Medium |
| 04 | `04-hello-not-idempotent.md` | Server `hello` is not idempotent — duplicate hellos produce duplicate welcomes | `@sg100/server` | `packages/server/AGENTS.md` | Low |
| 05 | `05-client-onerror-conflates-protocol-and-transport.md` | Client `onError` cannot distinguish WS transport failure from server protocol error | `@sg100/client` | `packages/client/AGENTS.md` | Low–Medium |
| 06 | `06-rtt-uses-echoed-t.md` | Client RTT computed from echoed `t` (client-controlled) instead of trusted `serverT` | `@sg100/client`, `@sg100/shared` | `packages/client/AGENTS.md`, `packages/shared/AGENTS.md` | Medium |

## What was tested

- Vite dev client: `http://localhost:5173/` — boots cleanly, `#scene` canvas
  non-empty (1280×800), `window.render_game_to_text()` and `window.advanceTime(ms)`
  work, HUD shows `● online — 44ms round-trip` after the first pong.
- Node server: `ws://localhost:8080/ws` — handshake (`hello`→`welcome`),
  ping/pong, and 22 protocol-edge-case probes (version mismatch, unknown
  type, missing fields, type coercion, malformed JSON, duplicate hellos,
  server-bound types, and `t`-value boundary tests).
- No `console.error`, no uncaught `pageerror`, no failed requests, no WS
  errors on the happy path.
- `npm run typecheck` and `npm run build` both exit 0 (unchanged from
  baseline).

## Evidence locations

- Smoke harness: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/stage0-smoke.mjs`
- Discovery probe: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/discovery.mjs`
- Protocol edge probes: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.mjs`
- Captured artifacts (JSON + screenshots):
  `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/2026-06-18T*.json` and `*.png`

## What was *not* filed

- Vite's own `connected` HMR frame — dev-only, expected, irrelevant in prod.
- Headless WebGL `GPU stall due to ReadPixels` warnings — they come from
  `playwright.screenshot()` doing CPU readback, not from game code.
- The 500kB Vite chunk size warning — `three.js` baseline, not actionable
  for Stage 0.
- The `scene.ts` rotating guard / animating camera — placeholder visuals
  per `packages/client/AGENTS.md` ("Stage 0 may use placeholder visuals").
- `/favicon.ico` 404 in Vite — the HTML references `/favicon.svg` and
  the browser does not request `/favicon.ico`.
- Title-card overlay / crosshair layering — design choice, not a defect.
- The 4-month-old AGENTS.md diff and `.harness/` directory presence in
  `git status` — orchestrator/team work, out of scope.
