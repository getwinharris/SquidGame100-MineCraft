# Issue 01 — Wire protocol schemas silently accept unknown fields

**DOX path:** `packages/shared/AGENTS.md` (protocol schema ownership: `src/protocol.ts`).
**Affected package:** `@sg100/shared`.
**Severity:** Medium — wire-contract drift is undetectable; Stage 0 is the right time to lock it down.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

`@sg100/shared` protocol schemas use Zod's default object mode (which silently strips
unknown keys). Stage 0 should set `.strict()` so unexpected fields fail loud.

## Repro steps

Pre-req: `npm -w @sg100/server run dev` on `ws://localhost:8080/ws` and
`npm -w @sg100/client run dev` on `http://localhost:5173/`. Both runnable
per the root `AGENTS.md`.

1. From a Node REPL with `ws` installed in the workspace, open a raw
   `new WebSocket('ws://localhost:8080/ws')`.
2. Send:
   ```json
   {"v":1,"type":"ping","t":<ms>,"extraJunk":true}
   ```
3. Observe the response.
4. Repeat with a `hello` variant:
   ```json
   {"v":1,"type":"hello","clientId":"a","clientName":"pwn","__proto__":{"evil":1}}
   ```

## Expected

The Zod schema for `PingMessageSchema` (and `HelloMessageSchema`) is `z.object(...)`.
A wire protocol should reject any field not declared in the schema so typos and
version drift surface immediately. The server should reply with
`{"type":"error","code":"bad_message","message":"…"}` and the client should
ignore the unknown fields.

## Actual

The server replies with a normal pong / welcome frame; the unknown field is
silently dropped by Zod's default `strip` mode. Evidence:

```json
// from protocol-probe.out.json → "extra-field-ping"
"frames": [
  "{\"type\":\"pong\",\"t\":1781805768374,\"serverT\":1781805768389,\"v\":1}"
]
// sent: {"v":1,"type":"ping","t":1781805768374,"extraJunk":true}

// from protocol-probe.out.json → "extra-field-hello"
"frames": [
  "{\"type\":\"welcome\",\"serverName\":\"SquidGame100 MineCraft\",\"protocol\":1,\"v\":1}"
]
// sent: {"v":1,"type":"hello","clientId":"a","clientName":"pwn","__proto__":{"evil":1}}
```

## Why this matters

- A future client that adds a `tick: number` field to a `ping` by accident will
  not be flagged — the field is silently dropped. The bug is invisible until a
  regression sneaks in.
- Cross-version compatibility testing is impossible because the server cannot
  tell "old client that doesn't know the new field" from "new client that
  added a junk field".
- The protocol is supposed to be the durable contract between packages
  (`packages/AGENTS.md` "Do not duplicate protocol constants or wire message
  shapes in client/server packages."). Strictness belongs in the schema, not
  in every consumer.

## Suggested fix

Append `.strict()` to each `z.object(...)` in `packages/shared/src/protocol.ts`,
e.g.:

```ts
export const HelloMessageSchema = z
  .object({ ...envelope, type: z.literal('hello'), clientId: z.string().min(1), clientName: z.string().max(32).optional() })
  .strict();
```

Same for `PingMessageSchema`, `WelcomeMessageSchema`, `PongMessageSchema`,
`ErrorMessageSchema`. Update `PROTOCOL_VERSION` in `packages/shared/src/config.ts`
if the on-wire shape changes (it should not, but bump defensively).

## Evidence paths

- Smoke JSON: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.out.json` — labels `extra-field-ping` and `extra-field-hello`.
- Smoke harness: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.mjs`.
- Playwright happy-path smoke: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/2026-06-18T17-59-56-184Z.json` (no console errors, `welcome`/`pong` observed).
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/shared/AGENTS.md`.
