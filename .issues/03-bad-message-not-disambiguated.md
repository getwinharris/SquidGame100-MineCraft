# Issue 03 — Server `bad_message` error code does not distinguish cause

**DOX path:** `packages/server/AGENTS.md` (server WS handler) and `packages/shared/AGENTS.md` (protocol).
**Affected packages:** `@sg100/server` and `@sg100/shared`.
**Severity:** Medium — operators cannot diagnose client protocol errors from logs without
capturing the full ZodError; client cannot pick a recovery strategy.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

`packages/server/src/index.ts` catches every `parseClientMessage` exception
and replies with the same generic `{type:"error",code:"bad_message",message:"Invalid client message"}`
regardless of whether the actual cause was a version mismatch, an unknown
type, a missing field, a type-coercion failure, or a JSON parse error.

## Repro steps

Pre-req: server running on `ws://localhost:8080/ws`.

1. Open `new WebSocket('ws://localhost:8080/ws')`.
2. Send each of the following in a separate connection:
   - `{"v":999,"type":"ping","t":1}` — version mismatch
   - `{"v":1,"type":"telemetry","payload":{}}` — unknown type
   - `{"v":1,"type":"ping"}` — missing required field
   - `{"v":1,"type":"ping","t":"now"}` — wrong primitive type
   - `{"v":1,"type":"hello","clientId":12345}` — wrong primitive type
   - `{this is not json` — invalid JSON
3. Compare the response codes.

## Expected

Each failure mode should produce a distinct, machine-readable `code` so that:

- The client can branch on the cause (e.g. "version mismatch → prompt user to refresh",
  "missing field → bug report", "bad json → log and ignore").
- Operators reading server logs can tell at a glance what kind of client bug
  is in the wild.
- Tests can assert on specific codes.

Suggested codes (must match what `@sg100/shared` declares): `version_mismatch`,
`unknown_type`, `missing_field`, `bad_payload`, `bad_json`. The ZodError's
`issues[]` already has the discriminated info — the server just throws it away.

## Actual

All seven distinct failure modes return the same payload:

```json
{"type":"error","code":"bad_message","message":"Invalid client message","v":1}
```

Probe results:

| Probe label | Sent | Reply |
|---|---|---|
| `version-mismatch` | `{v:999,type:"ping",t:1}` | `bad_message` |
| `unknown-type`     | `{v:1,type:"telemetry"}` | `bad_message` |
| `ping-missing-t`   | `{v:1,type:"ping"}` | `bad_message` |
| `ping-t-string`    | `{v:1,type:"ping",t:"now"}` | `bad_message` |
| `hello-clientId-number` | `{v:1,type:"hello",clientId:12345}` | `bad_message` |
| `not-json`         | `{this is not json` | `bad_message` |
| `empty-frame`      | `""` | `bad_message` |

## Why this matters

- Right now the server's `app.log.warn({ error }, 'invalid websocket message')`
  does carry the full ZodError, so *server-side* log readers can still
  diagnose. But the *client* (and any future analytics or anti-cheat) cannot
  distinguish these from the wire reply alone.
- This Stage 0 contract will be the precedent for every later game message
  (input, snapshot, room ops). Locking in the code vocabulary now keeps
  client error UX from having to be retrofitted.

## Suggested fix

In `packages/server/src/index.ts`, branch on the exception type:

- `SyntaxError` (from `JSON.parse`) → `code:"bad_json"`.
- `ZodError`:
  - If any issue's `path[0] === 'v'` or `code === 'invalid_literal'` on the
    `v` literal → `code:"version_mismatch"`.
  - If any issue's `code === 'invalid_union_discriminator'` →
    `code:"unknown_type"`.
  - If any issue's `code === 'invalid_type'` and the field is missing →
    `code:"missing_field"`.
  - Otherwise → `code:"bad_payload"`.
- Anything else → keep `code:"bad_message"`.

Add the new `code` string union to `@sg100/shared` `ErrorMessageSchema`'s
`code` field (or document that `code` is an open string for forward compat).

## Evidence paths

- Smoke JSON: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.out.json` — labels `version-mismatch`, `version-zero`, `unknown-type`, `empty-type`, `ping-missing-t`, `ping-t-string`, `ping-t-float`, `hello-clientId-number`, `not-json`, `empty-frame`, `hello-empty-clientId`, `hello-long-clientName`, `client-sends-welcome`, `client-sends-error`, `client-sends-pong`.
- Server code: `/Users/getwinharris/Dev/MineCraft/packages/server/src/index.ts:46-79`.
- Shared schema: `/Users/getwinharris/Dev/MineCraft/packages/shared/src/protocol.ts:68-74`.
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/server/AGENTS.md`, `/Users/getwinharris/Dev/MineCraft/packages/shared/AGENTS.md`.
