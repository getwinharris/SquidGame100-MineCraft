# Harness Team

## Purpose

Defines the agent team that operates on SquidGame100 MineCraft under the CTO (`mavis`). Each rein is scoped to one responsibility; orchestration, planning, and final judgment stay with the CTO.

## Ownership

- `reins/browser-qa/` — drives the running game in a real browser via Playwright; files reproducible issues.
- `reins/player-1/` — playability critic: frame pacing, input feel, onboarding, HUD legibility, resilience, and the gap-to-playable. Files `playability` issues only for in-scope regressions.
- `reins/game-fixer/` — implements a single issue's fix, scoped to one package, verified locally.
- `reins/game-reviewer/` — independently re-runs verification and issues PASS/FAIL.

## Local Contracts

- Every task reads the DOX chain (root `AGENTS.md` → `packages/AGENTS.md` → owning child) before editing.
- One task = one bounded deliverable. Do not bundle discoveries with fixes, or fixes with reviews.
- `game-fixer` never grades its own work; `game-reviewer` never edits source.
- All reins keep Stage 0 runnable: `npm run typecheck` and `npm run build` must pass at every handoff.

## Work Guidance

- Use the CTO (`mavis`) as the only entry point. The CTO launches `mavis team plan` and makes accept/reject decisions.
- Typical cycle per defect:
  1. `browser-qa` reproduces and files the issue.
  2. `game-fixer` (depends_on browser-qa deliverable) implements the scoped fix.
  3. `game-reviewer` (depends_on game-fixer, role: verify-as-task) re-runs verification and emits PASS/FAIL.
  4. CTO decides: accept / manual_retry / reject / override_accept.
- Prefer the smallest sufficient plan. Do not pad the team.
- See `/Users/getwinharris/Dev/MineCraft/AGENTS.md` and `packages/AGENTS.md` for repo-wide rules.

## Verification

- `npm run typecheck`
- `npm run build`
- Client changes also: web-game smoke (Playwright + `window.render_game_to_text()` / `window.advanceTime(ms)`).
- Server changes also: `curl http://localhost:8080/healthz`.

## Child DOX Index

- `reins/browser-qa/AGENTS.md` — browser-driven issue discovery.
- `reins/player-1/AGENTS.md` — playability verdict + gap-to-playable (frame pacing, input feel, HUD, resilience).
- `reins/game-fixer/AGENTS.md` — scoped implementation per issue.
- `reins/game-reviewer/AGENTS.md` — independent verdict per fix.
