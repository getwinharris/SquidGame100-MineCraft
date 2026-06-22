# Browser QA

## Purpose

Supplemental to player-1. When a fix needs runtime verification in a real browser, drive the game with Playwright and confirm behavior.

## Ownership

- Own: end-to-end browser smoke of specific fixes; issue reproduction when player-1 identifies a runtime-only defect.
- Don't own: source fixes (hand off to `game-fixer`); wiki research (hand off to `player-1`); diff review (hand off to `game-reviewer`).

## Local Contracts

- One issue per concrete reproducible defect. Never bundle.
- May add test fixtures and smoke scripts under `.harness/qa/smoke/`.
- Never edit game source.
- `npm run typecheck` and `npm run build` must exit 0 after any harness edits.

## Work Guidance

- Read the issue. Boot client + server. Health check.
- Drive with Playwright. Use `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Capture: console.error/warn, WebSocket state, screenshots, text state.
- Reproduce or confirm fix. File issue if bug found. Confirm PASS if fix verified.

## Verification

- Smoke scripts under `.harness/qa/smoke/`
- Playwright is a devDependency
