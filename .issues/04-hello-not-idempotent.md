# Issue 04 — Server `hello` is not idempotent — duplicate hellos produce duplicate welcomes

**DOX path:** `packages/server/AGENTS.md` (server WS handler).
**Affected package:** `@sg100/server`.
**Severity:** Low — Stage 0 doesn't track connection state, so this is
forgiveness rather than a bug, but the precedent matters for room/match
messaging in Stage 3.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

`packages/server/src/index.ts` accepts every `hello` frame as a fresh
handshake, including duplicates. A client that re-sends `hello` (intentionally
or due to a bug, retry, or replay) gets a `welcome` per send.

## Repro steps

Pre-req: server running on `ws://localhost:8080/ws`.

1. Open `new WebSocket('ws://localhost:8080/ws')`.
2. On `open`, send `{v:1,type:'hello',clientId:'a'}` twice in a row
   (no delay, or with a 50ms delay).
3. Observe the inbound frames.

## Expected

Per the protocol docs ("`hello`/`welcome` is the handshake"), `hello` is a
one-shot event. The server should either:
- (a) Reply with `welcome` only on the first `hello` and silently ignore
  subsequent ones, or
- (b) Reply once and then send `{type:"error",code:"already_welcomed"}` for
  any later `hello` so the client can detect a state-machine bug.

## Actual

The server sends one `welcome` per `hello` frame, with no deduping:

```json
// protocol-probe.out.json → "double-hello"
"frames": [
  "{\"type\":\"welcome\",\"serverName\":\"SquidGame100 MineCraft\",\"protocol\":1,\"v\":1}",
  "{\"type\":\"welcome\",\"serverName\":\"SquidGame100 MineCraft\",\"protocol\":1,\"v\":1}"
]
```

## Why this matters

- Stage 3 will add `join_room`, `input`, `snapshot` etc. — all of which
  should require the connection to be in the `welcomed` state. If `hello`
  is not idempotent, those state transitions will be ambiguous.
- A misbehaving client that retries `hello` (e.g. on a flaky network with
  no idempotency key) will spam welcomes, which is visible in logs and
  confusing on the wire.
- This is a 5-line fix and locks in the right invariant.

## Suggested fix

Track per-connection handshake state in `wss.on('connection', ...)`:

```ts
let welcomed = false;
ws.on('message', (raw) => {
  ...
  if (inbound.type === 'hello') {
    if (welcomed) {
      ws.send(JSON.stringify(msg({ type: 'error', code: 'already_welcomed', message: 'hello already received' })));
      return;
    }
    welcomed = true;
    ws.send(JSON.stringify(msg({ type: 'welcome', serverName: PROJECT_NAME, protocol: PROTOCOL_VERSION })));
    return;
  }
  ...
});
```

## Evidence paths

- Smoke JSON: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.out.json` — label `double-hello`.
- Server code: `/Users/getwinharris/Dev/MineCraft/packages/server/src/index.ts:46-79`.
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/server/AGENTS.md`.
