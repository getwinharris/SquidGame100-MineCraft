# Issue 02 — Server `ping` accepts arbitrary `t` values (no timestamp sanity)

**DOX path:** `packages/server/AGENTS.md` (server WS handler) and `packages/shared/AGENTS.md` (protocol).
**Affected packages:** `@sg100/server` and `@sg100/shared`.
**Severity:** Medium — the echoed value is what the client uses for RTT, so a
client that sends garbage produces a garbage RTT that the user sees in the HUD.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

Server accepts `ping.t` values that are obviously invalid (`0`, negative,
`Number.MAX_SAFE_INTEGER`, far-future timestamps) and echoes them back in the
pong frame, which the client uses to compute round-trip time.

## Repro steps

Pre-req: server running on `ws://localhost:8080/ws`.

1. Open `new WebSocket('ws://localhost:8080/ws')`.
2. Send each of the following in a separate connection:
   - `{"v":1,"type":"ping","t":0}`
   - `{"v":1,"type":"ping","t":-1}`
   - `{"v":1,"type":"ping","t":9007199254740991}`  (`Number.MAX_SAFE_INTEGER`)
   - `{"v":1,"type":"ping","t":<Date.now() + 365 days in ms>}`
3. Observe the pong's `t` field.

## Expected

`ping.t` is documented as "Client timestamp ms" (`packages/shared/src/protocol.ts`
`PingMessageSchema.t`). A reasonable server should reject any `t` outside a
sane window (e.g. `|now - t| > 60_000`) with a `code:"bad_message"` or
`code:"invalid_timestamp"`. Failing that, the client should at least sanity-check
the echoed value before subtracting from `Date.now()`.

## Actual

All four pings are accepted and the server echoes the original `t` verbatim:

```json
// protocol-probe.out.json → "ping-t-zero"
"frames": ["{\"type\":\"pong\",\"t\":0,\"serverT\":1781805768504,\"v\":1}"]

// "ping-t-negative"
"frames": ["{\"type\":\"pong\",\"t\":-1,\"serverT\":1781805768505,\"v\":1}"]

// "ping-t-maxint"
"frames": ["{\"type\":\"pong\",\"t\":9007199254740991,\"serverT\":1781805768509,\"v\":1}"]

// "ping-t-future"
"frames": ["{\"type\":\"pong\",\"t\":1813341768374,\"serverT\":1781805768514,\"v\":1}"]
```

The client (`packages/client/src/net.ts:53`) then computes
`options.onPong(Date.now() - parsed.t)`. With `parsed.t = -1`, the HUD would
read "1,780,000,000,000ms round-trip" — a number so large it overflows
`Number.toFixed(0)` display.

## Why this matters

- The HUD's whole point is to show a useful "online" indicator. A negative or
  absurdly large RTT is confusing and could mask real network problems.
- The server is an echo machine: anything the client claims it sent is taken
  at face value. A future anti-cheat / netcode layer that uses `t` for clock
  synchronization will silently get poisoned.
- This is a one-line protocol or client fix; locking it down now keeps later
  stages from having to clean it up.

## Suggested fix

Two reasonable options, can be combined:

1. **Server side** — in `packages/server/src/index.ts`, narrow the
   `PingMessageSchema` parser: require `t > 0` and
   `Math.abs(Date.now() - t) < 60_000`. Return `code:"bad_message"` otherwise.
2. **Client side** — in `packages/client/src/net.ts`, replace
   `options.onPong(Date.now() - parsed.t)` with
   `options.onPong(Math.max(0, Date.now() - parsed.serverT))` and
   ignore `parsed.t` for display. (`serverT` is the server's authoritative
   timestamp and is already in the pong frame.)

Bump `PROTOCOL_VERSION` only if the on-wire shape changes.

## Evidence paths

- Smoke JSON: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.out.json` — labels `ping-t-zero`, `ping-t-negative`, `ping-t-maxint`, `ping-t-future`.
- Client code: `/Users/getwinharris/Dev/MineCraft/packages/client/src/net.ts:52-54`.
- Shared schema: `/Users/getwinharris/Dev/MineCraft/packages/shared/src/protocol.ts:35-40`.
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/server/AGENTS.md`, `/Users/getwinharris/Dev/MineCraft/packages/shared/AGENTS.md`.
