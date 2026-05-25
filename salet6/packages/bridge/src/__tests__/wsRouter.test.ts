import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { attachWsRouter } from '../ws/router.js';

let httpServer: Server;
let wss: WebSocketServer;
let url: string;

const sampleThemePackage = {
  packageVersion: '1.0.0',
  themeConfig: {
    palette: {
      primary: '#FF2A6D',
      secondary: '#05D9E8',
      accent: '#D1F7FF',
      background: '#0D0221',
      text: '#F5F5F5',
    },
    motion: { animation: 'Pulse Glitch', speed: 'Fast', intensity: 'High' },
    lighting: { glowColor: '#D1F7FF', glowIntensity: 'High' },
  },
  drinkProfiles: [],
  createdAt: new Date().toISOString(),
};

beforeAll(async () => {
  httpServer = createServer();
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  attachWsRouter(wss);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const addr = httpServer.address();
  if (!addr || typeof addr === 'string') throw new Error('bad address');
  url = `ws://127.0.0.1:${addr.port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    wss.close(() => httpServer.close(() => resolve()));
  });
});

function connect(role: 'authoring' | 'runtime'): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once('open', () => {
      ws.send(JSON.stringify({ type: 'CLIENT_HELLO', role }));
      // Small grace period for the hello to be registered.
      setTimeout(() => resolve(ws), 10);
    });
    ws.once('error', reject);
  });
}

function nextMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    ws.once('message', (data) => resolve(JSON.parse(String(data))));
  });
}

describe('WS router', () => {
  it('forwards APPLY_THEME from authoring to runtime, ACK back', async () => {
    const authoring = await connect('authoring');
    const runtime = await connect('runtime');

    const runtimeRecv = nextMessage(runtime);
    authoring.send(JSON.stringify({
      type: 'APPLY_THEME',
      requestId: 'r1',
      themePackage: sampleThemePackage,
    }));
    const forwarded = (await runtimeRecv) as { type: string; requestId: string };
    expect(forwarded.type).toBe('APPLY_THEME');
    expect(forwarded.requestId).toBe('r1');

    const authoringRecv = nextMessage(authoring);
    runtime.send(JSON.stringify({
      type: 'APPLY_THEME_ACK',
      requestId: 'r1',
      ok: true,
    }));
    const ack = (await authoringRecv) as { type: string; requestId: string; ok: boolean };
    expect(ack.type).toBe('APPLY_THEME_ACK');
    expect(ack.requestId).toBe('r1');
    expect(ack.ok).toBe(true);

    authoring.close();
    runtime.close();
    await new Promise((r) => setTimeout(r, 20));
  });

  it('responds with BRIDGE_ERROR NO_PEER when runtime is missing', async () => {
    const authoring = await connect('authoring');
    const recv = nextMessage(authoring);
    authoring.send(JSON.stringify({
      type: 'APPLY_THEME',
      requestId: 'r2',
      themePackage: sampleThemePackage,
    }));
    const err = (await recv) as { type: string; code: string };
    expect(err.type).toBe('BRIDGE_ERROR');
    expect(err.code).toBe('NO_PEER');
    authoring.close();
    await new Promise((r) => setTimeout(r, 20));
  });

  it('rejects malformed JSON with BRIDGE_ERROR INVALID_JSON', async () => {
    const authoring = await connect('authoring');
    const recv = nextMessage(authoring);
    authoring.send('not valid json');
    const err = (await recv) as { type: string; code: string };
    expect(err.type).toBe('BRIDGE_ERROR');
    expect(err.code).toBe('INVALID_JSON');
    authoring.close();
    await new Promise((r) => setTimeout(r, 20));
  });

  it('rejects unknown message types with INVALID_MESSAGE', async () => {
    const authoring = await connect('authoring');
    const recv = nextMessage(authoring);
    authoring.send(JSON.stringify({ type: 'UNKNOWN_TYPE' }));
    const err = (await recv) as { type: string; code: string };
    expect(err.type).toBe('BRIDGE_ERROR');
    expect(err.code).toBe('INVALID_MESSAGE');
    authoring.close();
    await new Promise((r) => setTimeout(r, 20));
  });
});
