import {
  msg,
  parseServerMessage,
  PROJECT_NAME,
  type ServerMessage,
} from '@sg100/shared';

type ConnectOptions = {
  url: string;
  onOpen(): void;
  onWelcome(serverName: string): void;
  onPong(rttMs: number): void;
  onClose(): void;
  onError(): void;
};

const CLIENT_ID_KEY = 'sg100.clientId';

export function connectToServer(options: ConnectOptions): () => void {
  const ws = new WebSocket(options.url);
  let pingTimer = 0;

  const sendPing = (): void => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg({ type: 'ping', t: Date.now() })));
    }
  };

  ws.addEventListener('open', () => {
    options.onOpen();
    ws.send(
      JSON.stringify(
        msg({
          type: 'hello',
          clientId: getClientId(),
          clientName: PROJECT_NAME,
        }),
      ),
    );
    sendPing();
    pingTimer = window.setInterval(sendPing, 5000);
  });

  ws.addEventListener('message', (event) => {
    const parsed = parseInbound(event.data);
    if (!parsed) return;

    if (parsed.type === 'welcome') {
      options.onWelcome(parsed.serverName);
    }

    if (parsed.type === 'pong') {
      options.onPong(Date.now() - parsed.t);
    }

    if (parsed.type === 'error') {
      options.onError();
    }
  });

  ws.addEventListener('close', () => {
    window.clearInterval(pingTimer);
    options.onClose();
  });

  ws.addEventListener('error', () => {
    options.onError();
  });

  return () => {
    window.clearInterval(pingTimer);
    ws.close();
  };
}

function parseInbound(raw: unknown): ServerMessage | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parseServerMessage(data);
  } catch (error) {
    console.warn('Ignored invalid server message', error);
    return null;
  }
}

function getClientId(): string {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}
