# Issue 05 — Client `onError` cannot distinguish WS transport failure from server protocol error

**DOX path:** `packages/client/AGENTS.md` (client network adapter: `src/net.ts`).
**Affected package:** `@sg100/client`.
**Severity:** Low–Medium — the HUD becomes a liar when the server sends a
protocol-level error. Worse, future game messages will be unable to surface
their own error states through the HUD.
**Discovered by:** `browser-qa` during Stage 0 smoke on 2026-06-18.

## Title

`packages/client/src/net.ts:56-58` calls `options.onError()` for *every*
inbound `{type:"error"}` server frame, which is the same callback
`main.ts:37` wires to the "● connection error" HUD message. The HUD is
indistinguishable from a real WebSocket transport failure (which fires
`onclose` / `onerror` and also lands in `onError` via `main.ts:36-37`).

## Repro steps

Pre-req: client dev server on `http://localhost:5173/`, server on
`ws://localhost:8080/ws`.

1. Open the page in a browser.
2. From the browser dev console, construct a fake `welcome`/`pong` cycle
   *and then* a server-pushed error. The simplest way is to call the page's
   existing `connectToServer` machinery against a mocked server that
   follows the protocol. From the dev console:
   ```js
   const ws = new WebSocket('ws://localhost:8080/ws');
   // Send a malformed message in a parallel socket to force the server to
   // reply with a {type:'error',code:'bad_message',...} to that socket, NOT
   // to the page's main WS. To exercise the *page's* WS, instead patch the
   // prototype to inject a frame:
   const orig = WebSocket.prototype.addEventListener;
   // ...or, more directly, run this from the page context:
   ```
   A more concrete alternative is to wait for a server-driven error path
   in a later stage (e.g. a future snapshot/join failure). The defect is
   structural: the code path is `parseInbound` → `parsed.type === 'error'`
   → `options.onError()` → `'● connection error'`. The fix should make
   this path surface the server's `code`/`message` instead.
3. Observe the HUD.

## Expected

A server-emitted `{type:"error",code:"...",message:"..."}` frame should
produce a HUD message that names the server's error code, e.g.
`"● server error: bad_message"` (in red), distinct from a transport failure
which should keep the existing `"● disconnected — server offline?"` text.

The `connectToServer` callback API should grow a dedicated
`onServerError(code, message)` hook (or rename `onError` to `onTransportError`
and add `onServerError`).

## Actual

The current `parseInbound` collapses every server error into a transport-style
callback:

```ts
// packages/client/src/net.ts:44-59
ws.addEventListener('message', (event) => {
  const parsed = parseInbound(event.data);
  if (!parsed) return;
  if (parsed.type === 'welcome') options.onWelcome(parsed.serverName);
  if (parsed.type === 'pong') options.onPong(Date.now() - parsed.t);
  if (parsed.type === 'error') options.onError();   // <-- conflates
});
```

```ts
// packages/client/src/main.ts:36-37
onClose: () => setStatus('<span class="err">● disconnected</span> — server offline?'),
onError: () => setStatus('<span class="err">● connection error</span>'),
```

The user cannot tell the difference between "the WebSocket is dead" and
"the server rejected my message".

## Why this matters

- Stage 3 will add authoritative error states (room full, kicked, banned,
  version too old). Surfacing those requires the client to know they
  came from a server frame, not a transport glitch.
- The current code also drops the server's `code` and `message` fields
  entirely — no telemetry, no log line, no debug breadcrumb.

## Suggested fix

1. Add a new option to `connectToServer`:
   `onServerError?(code: string, message: string): void`.
2. In `parseInbound`'s handler, dispatch the `error` case to
   `onServerError(parsed.code, parsed.message)`.
3. Update `main.ts` to wire it: show
   `<span class="err">● server: {code}</span>` (or similar) in the HUD.
4. Rename the existing `onError` to `onTransportError` for clarity (or
   document the distinction in JSDoc).

## Evidence paths

- Code: `/Users/getwinharris/Dev/MineCraft/packages/client/src/net.ts:44-68`.
- Code: `/Users/getwinharris/Dev/MineCraft/packages/client/src/main.ts:30-38`.
- Schema: `/Users/getwinharris/Dev/MineCraft/packages/shared/src/protocol.ts:68-74` (`ErrorMessageSchema`).
- DOX: `/Users/getwinharris/Dev/MineCraft/packages/client/AGENTS.md`.
- Supporting probe: the bad-JSON probe in the discovery run received
  `{type:"error",code:"bad_message",message:"Invalid client message"}` —
  the server's reply *would* hit this conflated client code path if the
  recipient were the production client.
