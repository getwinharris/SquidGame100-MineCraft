/**
 * Targeted protocol probes — exercises edge cases on the running server.
 * Each probe is independent and writes its finding to stdout as a JSON line.
 */

import { WebSocket } from 'ws';

const URL = process.env.SG100_WS ?? 'ws://localhost:8080/ws';
const TIMEOUT = 3000;

function probe(label, payload, expect = 'success') {
  return new Promise((resolve) => {
    const frames = [];
    const ws = new WebSocket(URL);
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve({ label, timeout: true, frames, sent: payload });
    }, TIMEOUT);
    ws.addEventListener('open', () => ws.send(payload));
    ws.addEventListener('message', (ev) => {
      frames.push(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve({ label, frames, sent: payload, expect });
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      resolve({ label, error: true, frames, sent: payload });
    });
  });
}

async function main() {
  const probes = [
    // Strictness: extra fields
    ['extra-field-ping', JSON.stringify({ v: 1, type: 'ping', t: Date.now(), extraJunk: true })],
    ['extra-field-hello', JSON.stringify({ v: 1, type: 'hello', clientId: 'a', clientName: 'pwn', __proto__: { evil: 1 } })],
    // Version
    ['version-mismatch', JSON.stringify({ v: 999, type: 'ping', t: Date.now() })],
    ['version-zero', JSON.stringify({ v: 0, type: 'ping', t: Date.now() })],
    // Type
    ['unknown-type', JSON.stringify({ v: 1, type: 'telemetry', payload: {} })],
    ['empty-type', JSON.stringify({ v: 1, type: '', t: Date.now() })],
    // Required fields
    ['ping-missing-t', JSON.stringify({ v: 1, type: 'ping' })],
    ['hello-missing-clientId', JSON.stringify({ v: 1, type: 'hello' })],
    // Type mismatch
    ['hello-clientId-number', JSON.stringify({ v: 1, type: 'hello', clientId: 12345 })],
    ['ping-t-string', JSON.stringify({ v: 1, type: 'ping', t: 'now' })],
    ['ping-t-float', JSON.stringify({ v: 1, type: 'ping', t: 1.5 })],
    // Boundary
    ['ping-t-zero', JSON.stringify({ v: 1, type: 'ping', t: 0 })],
    ['ping-t-negative', JSON.stringify({ v: 1, type: 'ping', t: -1 })],
    ['ping-t-maxint', JSON.stringify({ v: 1, type: 'ping', t: Number.MAX_SAFE_INTEGER })],
    ['ping-t-future', JSON.stringify({ v: 1, type: 'ping', t: Date.now() + 365 * 24 * 60 * 60 * 1000 })],
    // Not JSON
    ['not-json', '{this is not json'],
    // Empty
    ['empty-frame', ''],
    // String-length on clientId
    ['hello-empty-clientId', JSON.stringify({ v: 1, type: 'hello', clientId: '' })],
    ['hello-long-clientName', JSON.stringify({ v: 1, type: 'hello', clientId: 'a', clientName: 'a'.repeat(64) })],
    // Server-bound type
    ['client-sends-welcome', JSON.stringify({ v: 1, type: 'welcome', serverName: 'evil' })],
    ['client-sends-error', JSON.stringify({ v: 1, type: 'error', code: 'pwn', message: 'lol' })],
    ['client-sends-pong', JSON.stringify({ v: 1, type: 'pong', t: 1, serverT: 2 })],
    // Duplicate frames
    ['double-hello', null, { sequence: [
      JSON.stringify({ v: 1, type: 'hello', clientId: 'a' }),
      JSON.stringify({ v: 1, type: 'hello', clientId: 'a' }),
    ]}],
  ];

  const out = [];
  for (const p of probes) {
    const [label, payload, opts] = p;
    if (opts && opts.sequence) {
      // multi-frame probe
      const result = await new Promise((resolve) => {
        const frames = [];
        const ws = new WebSocket(URL);
        const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ label, timeout: true, frames, sent: opts.sequence }); }, TIMEOUT);
        ws.addEventListener('open', async () => {
          for (const s of opts.sequence) {
            ws.send(s);
          }
        });
        ws.addEventListener('message', (ev) => {
          frames.push(typeof ev.data === 'string' ? ev.data : ev.data.toString());
          if (frames.length >= opts.sequence.length) {
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve({ label, frames, sent: opts.sequence });
          }
        });
        ws.addEventListener('error', () => { clearTimeout(timer); resolve({ label, error: true, frames }); });
      });
      out.push(result);
    } else {
      out.push(await probe(label, payload));
    }
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error('CRASH', e); process.exit(1); });
