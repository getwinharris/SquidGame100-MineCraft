/**
 * Stage 0 browser smoke harness.
 *
 * Drives the running Vite dev server (http://localhost:5173) with Playwright,
 * using the deterministic test hooks documented in packages/client/AGENTS.md:
 *   - window.render_game_to_text()  — read scene/HUD state as JSON text
 *   - window.advanceTime(ms)        — deterministic time stepping
 *
 * Captures per run:
 *   - every console.error / console.warn with stack
 *   - WebSocket open/close/error + inbound/outbound frame log
 *   - screenshots at start, after one step, after advanceTime(2000)
 *   - the JSON string returned by render_game_to_text() at each step
 *
 * Output: writes a JSON report to .harness/qa/smoke/<run-id>.json and copies
 * the screenshots next to it. Returns exit 0 on PASS, non-zero on FAIL.
 *
 * Re-runnable. Does NOT touch game source — only this smoke harness.
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SMOKE_DIR = path.resolve(process.cwd(), '.harness/qa/smoke');
const CLIENT_URL = process.env.WEB_GAME_CLIENT ?? 'http://localhost:5173/';
const RUN_ID = process.env.SMOKE_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, '-');

async function main() {
  await mkdir(SMOKE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const consoleWarns = [];
  const pageErrors = [];
  const wsEvents = []; // {dir, type, payload, t}
  const requestFailures = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    } else if (type === 'warning') {
      consoleWarns.push({ text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ name: err.name, message: err.message, stack: err.stack });
  });
  page.on('requestfailed', (req) => {
    requestFailures.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText });
  });

  // Hook WebSocket construction at the page level so we capture frames even
  // when they originate from inside an ES module the page imports.
  await page.addInitScript(() => {
    const w = window;
    w.__wsFrames = [];
    w.__wsState = { opened: 0, closed: 0, errored: 0, lastUrl: null };
    const Orig = w.WebSocket;
    function Patched(url, protocols) {
      const sock = new Orig(url, protocols);
      w.__wsState.lastUrl = url;
      const record = (dir, payload) => {
        try {
          w.__wsFrames.push({
            dir,
            t: Date.now(),
            payload: typeof payload === 'string' ? payload.slice(0, 4096) : '<binary>',
          });
          if (w.__wsFrames.length > 200) w.__wsFrames.shift();
        } catch (e) {
          // ignore
        }
      };
      sock.addEventListener('open', () => {
        w.__wsState.opened += 1;
        record('state', JSON.stringify({ event: 'open', url }));
      });
      const origSend = sock.send.bind(sock);
      sock.send = function (data) {
        record('out', typeof data === 'string' ? data : '<binary>');
        return origSend(data);
      };
      sock.addEventListener('message', (ev) => {
        record('in', typeof ev.data === 'string' ? ev.data : '<binary>');
      });
      sock.addEventListener('close', (ev) => {
        w.__wsState.closed += 1;
        record('state', JSON.stringify({ event: 'close', code: ev.code, reason: ev.reason }));
      });
      sock.addEventListener('error', () => {
        w.__wsState.errored += 1;
        record('state', JSON.stringify({ event: 'error' }));
      });
      return sock;
    }
    Patched.prototype = Orig.prototype;
    Object.defineProperty(Patched, 'CONNECTING', { value: Orig.CONNECTING });
    Object.defineProperty(Patched, 'OPEN', { value: Orig.OPEN });
    Object.defineProperty(Patched, 'CLOSING', { value: Orig.CLOSING });
    Object.defineProperty(Patched, 'CLOSED', { value: Orig.CLOSED });
    w.WebSocket = Patched;
  });

  // --- Step 0: navigate to the dev server ----------------------------------
  const navResp = await page.goto(CLIENT_URL, { waitUntil: 'networkidle', timeout: 15000 });
  const navStatus = navResp ? navResp.status() : null;
  await page.screenshot({ path: path.join(SMOKE_DIR, `${RUN_ID}-01-start.png`), fullPage: false });

  // Wait for the test hooks to be installed by the scene module.
  await page.waitForFunction(
    () => typeof window.render_game_to_text === 'function' && typeof window.advanceTime === 'function',
    null,
    { timeout: 5000 },
  );

  const initialText = await page.evaluate(() => window.render_game_to_text());
  const initialWs = await page.evaluate(() => ({ ...window.__wsState, frames: window.__wsFrames.slice() }));

  // --- Step 1: one advanceTime step ---------------------------------------
  await page.evaluate(() => window.advanceTime(16));
  const stepText = await page.evaluate(() => window.render_game_to_text());
  await page.screenshot({ path: path.join(SMOKE_DIR, `${RUN_ID}-02-step.png`), fullPage: false });

  // --- Step 2: advanceTime(2000) -----------------------------------------
  // Give the WS a chance to complete a hello/welcome/ping/pong cycle, then
  // step the deterministic clock.
  await page.waitForTimeout(500);
  await page.evaluate(() => window.advanceTime(2000));
  const finalText = await page.evaluate(() => window.render_game_to_text());
  await page.screenshot({ path: path.join(SMOKE_DIR, `${RUN_ID}-03-advance2s.png`), fullPage: false });

  // --- Step 3: gather final state -----------------------------------------
  const finalWs = await page.evaluate(() => ({ ...window.__wsState, frames: window.__wsFrames.slice() }));
  const titleCardVisible = await page.evaluate(() => {
    const el = document.getElementById('title-card');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, display: cs.display, text: el.textContent?.trim().slice(0, 80) };
  });
  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('scene');
    if (!c) return null;
    return { width: c.width, height: c.height, clientW: c.clientWidth, clientH: c.clientHeight, hasGL: !!c.getContext?.('webgl2') || !!c.getContext?.('webgl') };
  });
  const statusInfo = await page.evaluate(() => {
    const el = document.getElementById('status');
    return el ? { text: el.textContent, html: el.innerHTML } : null;
  });
  const localStorageProbe = await page.evaluate(() => {
    try {
      const before = window.localStorage.getItem('sg100.clientId');
      return { ok: true, before };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  // --- Step 4: edge cases --------------------------------------------------
  // (a) HMR-safe: a second render_game_to_text call is idempotent.
  const repeat = await page.evaluate(() => window.render_game_to_text());
  // (b) Bouncing a page reload should still produce a welcome. We capture a
  // second page in a new context for the reload check to keep frames clean.
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await ctx2.newPage();
  const reloadErrors = [];
  page2.on('console', (m) => {
    if (m.type() === 'error') reloadErrors.push(m.text());
  });
  page2.on('pageerror', (e) => reloadErrors.push(`pageerror: ${e.message}`));
  await page2.addInitScript(() => {
    const w = window;
    w.__wsFrames2 = [];
    const Orig = w.WebSocket;
    function Patched(url, protocols) {
      const sock = new Orig(url, protocols);
      sock.addEventListener('message', (ev) => {
        if (typeof ev.data === 'string') w.__wsFrames2.push(ev.data);
      });
      return sock;
    }
    Patched.prototype = Orig.prototype;
    w.WebSocket = Patched;
  });
  await page2.goto(CLIENT_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page2.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 5000 });
  await page2.waitForTimeout(800);
  const reloadFrames = await page2.evaluate(() => window.__wsFrames2.slice());
  await page2.screenshot({ path: path.join(SMOKE_DIR, `${RUN_ID}-04-reload.png`), fullPage: false });
  await ctx2.close();

  // (c) Bad WS message: send an invalid JSON message to the server. The
  // server should reply with an "error" frame. This probes shared/server
  // error handling without modifying source.
  const errorReply = await page.evaluate(async () => {
    return await new Promise((resolve) => {
      try {
        const ws = new WebSocket((window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws');
        const frames = [];
        const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ timeout: true, frames }); }, 3000);
        ws.addEventListener('open', () => {
          ws.send('{not valid json');
        });
        ws.addEventListener('message', (ev) => {
          frames.push(typeof ev.data === 'string' ? ev.data : '<binary>');
          if (frames.length >= 1) {
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve({ frames });
          }
        });
        ws.addEventListener('error', (e) => { clearTimeout(timer); resolve({ error: true, frames }); });
      } catch (e) {
        resolve({ threw: String(e) });
      }
    });
  });

  await browser.close();

  // --- Report --------------------------------------------------------------
  const report = {
    runId: RUN_ID,
    clientUrl: CLIENT_URL,
    navStatus,
    titleCard: titleCardVisible,
    canvas: canvasInfo,
    status: statusInfo,
    localStorage: localStorageProbe,
    initialText,
    stepText,
    finalText,
    repeatText: repeat,
    initial: { ws: initialWs },
    final: { ws: finalWs, frames: finalWs.frames },
    consoleErrors,
    consoleWarns,
    pageErrors,
    requestFailures,
    reload: { errors: reloadErrors, frames: reloadFrames },
    badMessage: errorReply,
  };

  const reportPath = path.join(SMOKE_DIR, `${RUN_ID}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // --- Assertions + exit code --------------------------------------------
  const findings = [];
  if (navStatus !== 200) findings.push(`Nav status ${navStatus} (expected 200)`);
  if (!canvasInfo) findings.push('No #scene canvas');
  if (canvasInfo && canvasInfo.width === 0) findings.push('Canvas width is 0');
  if (consoleErrors.length) findings.push(`${consoleErrors.length} console.error entries`);
  if (pageErrors.length) findings.push(`${pageErrors.length} uncaught page errors`);
  if (!initialWs.opened) findings.push('WebSocket never opened');
  if (initialWs.opened < 1) findings.push('WebSocket open count = 0');
  // Expect at least a welcome and a pong in the captured frames.
  const sawWelcome = finalWs.frames.some((f) => f.dir === 'in' && /"type":"welcome"/.test(f.payload || ''));
  const sawPong = finalWs.frames.some((f) => f.dir === 'in' && /"type":"pong"/.test(f.payload || ''));
  if (!sawWelcome) findings.push('No welcome frame observed in WS');
  if (!sawPong) findings.push('No pong frame observed in WS');
  if (!statusInfo?.text?.match(/online|welcomed|connected/i)) findings.push(`HUD status text unexpected: ${JSON.stringify(statusInfo?.text)}`);

  if (findings.length) {
    console.error('SMOKE FAIL:', findings.join('; '));
    console.error('Report:', reportPath);
    process.exit(1);
  } else {
    console.log('SMOKE PASS. Report:', reportPath);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('SMOKE CRASH:', err);
  process.exit(2);
});
