/**
 * Client entry point.
 *
 * Stage 0: boot a minimal Canvas 2D scene in the Squid Game palette and open a
 * WebSocket to the server, surfacing the connection state in the HUD. This
 * proves the render loop and the network pipe before the voxel engine (Stage 1)
 * and netcode (Stage 3) land.
 */

import { createScene } from './scene.js';
import { connectToServer } from './net.js';

function setStatus(html: string): void {
  const el = document.getElementById('status');
  if (el) el.innerHTML = html;
}

function main(): void {
  // Fade the title card out once the user interacts (later: clicking = pointer lock).
  const titleCard = document.getElementById('title-card');
  const dismissTitle = (): void => {
    if (titleCard) titleCard.style.transition = 'opacity 0.6s';
    if (titleCard) titleCard.style.opacity = '0';
  };
  window.addEventListener('keydown', dismissTitle, { once: true });
  window.addEventListener('pointerdown', dismissTitle, { once: true });

  const stopScene = createScene(document.getElementById('scene') as HTMLCanvasElement);

  // Wire network status into the HUD. Stage 0 only needs hello/welcome/ping/pong.
  const stopNetwork = connectToServer({
    url: relativeWsUrl(),
    onOpen: () => setStatus('<span class="ok">● connected</span> — server reachable'),
    onWelcome: (name) => setStatus(`<span class="ok">● welcomed</span> by ${name}`),
    onPong: (rtt) => setStatus(`<span class="ok">● online</span> — ${rtt.toFixed(0)}ms round-trip`),
    onClose: () => setStatus('<span class="err">● disconnected</span> — server offline?'),
    onError: () => setStatus('<span class="err">● connection error</span>'),
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopNetwork();
    stopScene();
  });
}

/** Build a WS URL that works in dev (proxied) and prod (same origin via Caddy). */
function relativeWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

main();
