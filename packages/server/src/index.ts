import Fastify from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import {
  msg,
  parseClientMessage,
  PROJECT_NAME,
  PROTOCOL_VERSION,
  SERVER_TICK_HZ,
  SERVER_TICK_MS,
} from '@sg100/shared';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const host = process.env.HOST ?? '0.0.0.0';

const app = Fastify({
  logger: true,
});

const wss = new WebSocketServer({ noServer: true });

app.get('/', async () => ({
  ok: true,
  service: 'sg100-server',
  health: '/healthz',
  ws: '/ws',
}));

app.get('/healthz', async () => ({
  ok: true,
  name: PROJECT_NAME,
  protocol: PROTOCOL_VERSION,
  tickHz: SERVER_TICK_HZ,
}));

app.server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws') {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

let worldTick = 0;

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const inbound = parseClientMessage(data);

      if (inbound.type === 'hello') {
        ws.send(
          JSON.stringify(
            msg({
              type: 'welcome',
              serverName: PROJECT_NAME,
              protocol: PROTOCOL_VERSION,
            }),
          ),
        );
        return;
      }

      if (inbound.type === 'ping') {
        ws.send(JSON.stringify(msg({ type: 'pong', t: inbound.t, serverT: Date.now() })));
      }
    } catch (error) {
      app.log.warn({ error }, 'invalid websocket message');
      ws.send(
        JSON.stringify(
          msg({
            type: 'error',
            code: 'bad_message',
            message: 'Invalid client message',
          }),
        ),
      );
    }
  });
});

await app.listen({ host, port });

const tickInterval = setInterval(() => {
  worldTick++;
  const tickMsg = JSON.stringify(msg({ type: 'tick', tick: worldTick, time: Date.now() }));
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(tickMsg);
    }
  }
}, SERVER_TICK_MS);

process.on('SIGTERM', () => {
  clearInterval(tickInterval);
  app.close();
});
process.on('SIGINT', () => {
  clearInterval(tickInterval);
  app.close();
});
