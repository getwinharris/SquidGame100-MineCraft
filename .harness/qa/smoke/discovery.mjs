/**
 * Discovery probe — what does the page actually load?
 * Captures every request/response and the full console + WS log on
 * a single page load, so we can see what assets / endpoints exist.
 */

import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CLIENT_URL = process.env.WEB_GAME_CLIENT ?? 'http://localhost:5173/';
const OUT = path.resolve(process.cwd(), '.harness/qa/smoke');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const requests = [];
  const responses = [];
  const consoleAll = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on('request', (r) => {
    requests.push({ url: r.url(), method: r.method(), resourceType: r.resourceType(), headers: r.headers() });
  });
  page.on('response', async (r) => {
    let bodyPreview = null;
    try {
      const ct = r.headers()['content-type'] ?? '';
      if (ct.includes('json') || ct.includes('text') || ct.includes('javascript') || ct.includes('svg')) {
        const txt = await r.text();
        bodyPreview = txt.length > 4000 ? txt.slice(0, 4000) + '…[truncated]' : txt;
      } else {
        bodyPreview = `<${r.headers()['content-type']} ${r.headers()['content-length'] ?? '?'} bytes>`;
      }
    } catch (e) {
      bodyPreview = `<read-failed: ${e.message}>`;
    }
    responses.push({ url: r.url(), status: r.status(), headers: r.headers(), body: bodyPreview });
  });
  page.on('console', (m) => consoleAll.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push({ name: e.name, message: e.message, stack: e.stack }));
  page.on('requestfailed', (r) => requestFailures.push({ url: r.url(), failure: r.failure()?.errorText }));

  await page.goto(CLIENT_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);

  // Also probe common 404-prone paths to make sure the dev server isn't
  // silently serving broken assets.
  const probes = ['/favicon.svg', '/favicon.ico', '/robots.txt', '/apple-touch-icon.png', '/manifest.json', '/.well-known/appspecific/com.chrome.devtools.json'];
  const probeResults = [];
  for (const p of probes) {
    const r = await page.request.get(new URL(p, CLIENT_URL).toString());
    probeResults.push({ path: p, status: r.status() });
  }

  // Probe ws:// directly to ensure it works.
  const wsProbe = await page.evaluate(async () => {
    return await new Promise((resolve) => {
      const frames = [];
      const ws = new WebSocket((window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws');
      const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ timeout: true, frames }); }, 3000);
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ v: 1, type: 'hello', clientId: 'probe-x', clientName: 'probe' }));
        ws.send(JSON.stringify({ v: 1, type: 'ping', t: Date.now() }));
      });
      ws.addEventListener('message', (ev) => {
        frames.push(typeof ev.data === 'string' ? ev.data : '<binary>');
        if (frames.length >= 2) {
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve({ frames });
        }
      });
      ws.addEventListener('error', () => { clearTimeout(timer); resolve({ error: true, frames }); });
    });
  });

  // Probe what happens if we send a Zod-invalid client message (e.g. wrong
  // type, missing fields, wrong version) — does the server actually close /
  // reply with a structured error?
  const protocolProbes = await page.evaluate(async () => {
    const probe = (label, payload) => new Promise((resolve) => {
      const frames = [];
      const ws = new WebSocket((window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws');
      const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ label, timeout: true, frames }); }, 3000);
      ws.addEventListener('open', () => ws.send(payload));
      ws.addEventListener('message', (ev) => {
        frames.push(typeof ev.data === 'string' ? ev.data : '<binary>');
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve({ label, frames });
      });
      ws.addEventListener('error', () => { clearTimeout(timer); resolve({ label, error: true, frames }); });
    });
    return await Promise.all([
      probe('wrong-version', JSON.stringify({ v: 99, type: 'ping', t: Date.now() })),
      probe('unknown-type', JSON.stringify({ v: 1, type: 'telemetry', payload: {} })),
      probe('missing-t', JSON.stringify({ v: 1, type: 'ping' })),
      probe('non-string-clientId', JSON.stringify({ v: 1, type: 'hello', clientId: 12345 })),
      probe('extra-field', JSON.stringify({ v: 1, type: 'ping', t: 1, extraJunk: true })),
    ]);
  });

  await browser.close();

  const report = {
    runId: RUN_ID,
    url: URL,
    requests: requests.length,
    requestSamples: requests,
    responses: responses.map((r) => ({ url: r.url, status: r.status, body: r.body, ct: r.headers['content-type'], len: r.headers['content-length'] })),
    consoleAll: consoleAll.slice(-30),
    pageErrors,
    requestFailures,
    probes: probeResults,
    wsProbe,
    protocolProbes,
  };
  await writeFile(path.join(OUT, `${RUN_ID}-discovery.json`), JSON.stringify(report, null, 2), 'utf8');
  console.log('DISCOVERY report at', path.join(OUT, `${RUN_ID}-discovery.json`));
}

main().catch((e) => { console.error('CRASH', e); process.exit(1); });
