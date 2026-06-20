# Issue 06 — Client RTT computed from echoed `t` (client-controlled) instead of trusted `serverT`

**DOX path:** `packages/client/AGENTS.md` (RTT calculation in `src/net.ts`) and
`packages/shared/AGENTS.md` (protocol's `t` vs `serverT` semantics).
**Affected packages:** `@sg100/client` and `@sg100/shared`.
**Severity:** Medium — the current client always sends `Date.now()` so the bug
is invisible today, but the wire protocol exposes two timestamps
(`t` echoed, `serverT` authoritative) and the client uses the wrong one.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

`packages/client/src/net.ts:53` computes RTT as
`options.onPong(Date.now() - parsed.t)`. The pong frame contains *two*
timestamps — `t` (echo of the client's send) and `serverT` (the server's
`Date.now()` at processing). The client uses `parsed.t` which is fully
client-controlled; a buggy or malicious client that sends `t: -1` will see
the HUD report "1,780,000,000,000ms round-trip".

## Repro steps

Pre-req: server running on `ws://localhost:8080/ws`.

1. Open a raw `new WebSocket('ws://localhost:8080/ws')`.
2. Send `{"v":1,"type":"ping","t":-1}`.
3. Read the reply's `t` field (should be `-1`) and the client's perceived
   RTT = `Date.now() - (-1)`.

For the in-page client: the bug is masked because the client always sends
`Date.now()`. To exercise the path, you can either (a) modify the client
to send a bogus `t` in a one-off branch, or (b) trust the protocol
contract and observe the mismatch in the source.

## Expected

The pong frame's `serverT` is the server's authoritative `Date.now()` and
is the right basis for a clock-skew-corrected RTT. The client should use
`parsed.serverT` for display:

```ts
options.onPong(Math.max(0, Date.now() - parsed.serverT));
```

And/or the server should reject obviously-bad `t` values (see issue 02).

## Actual

`net.ts:53` uses `parsed.t`:

```ts
if (parsed.type === 'pong') {
  options.onPong(Date.now() - parsed.t);
}
```

The `serverT` field is parsed and stored in the local `parsed` object but
never read. Probe confirmation that the server echoes whatever the client
sends:

```json
// protocol-probe.out.json → "ping-t-negative"
"frames": ["{\"type\":\"pong\",\"t\":-1,\"serverT\":1781805768505,\"v\":1}"]

// "ping-t-zero"
"frames": ["{\"type\":\"pong\",\"t\":0,\"serverT\":1781805768504,\"v\":1}"]

// "ping-t-future" (1 year ahead)
"frames": ["{\"type\":\"pong\",\"t\":1813341768374,\"serverT\":1781805768514,\"v\":1}"]
```

A current `window.advanceTime(2000)` smoke shows the live HUD reading
`"● online — 44ms round-trip"`. That number is correct today only because
the client happens to send `Date.now()`. If a future bug — say, a unit
mix-up where the client sends seconds since epoch instead of ms — the
display would silently read 44ms × 1000 = 44,000ms (or worse).

## Why this matters

- The protocol's design (`t` echoed + `serverT` authoritative) implies
  `serverT` is the source of truth. The client not using it is a contract
  violation.
- HUD RTT is the only network health signal the user has. A poisoned
  RTT is a silent degradation.
- Cheap to fix and it pre-empts a debugging rabbit hole for whoever first
  looks at a "weird RTT" report.

## Suggested fix

In `packages/client/src/net.ts:53`:

```ts
if (parsed.type === 'pong') {
  const rtt = Math.max(0, Date.now() - parsed.serverT);
  options.onPong(rtt);
}
```

Optionally, also tighten the server side per issue 02.

## Evidence paths

- Smoke JSON: `/Users/getwinharris/Dev/MineCraft/.harness/qa/smoke/protocol-probe.out.json` — labels `ping-t-zero`, `ping-t-negative`, `ping-t-maxint`, `ping-t-future`, and the happy-path `extra-field-ping`.
- Code: `/Users/getwinharris/Dev/MineCraft/packages/client/src/net.ts:52-54`.
- Schema: `/Users/getwinharris/Dev/MineCraft/packages/shared/src/protocol.ts:60-66` (`PongMessageSchema`).
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/client/AGENTS.md`, `/Users/getwinharris/Dev/MineCraft/packages/shared/AGENTS.md`.
