/**
 * Display-app-stub WebSocket client (role: runtime).
 * Validates APPLY_THEME with Zod; sends APPLY_THEME_ACK (including schema errors
 * so the authoring UI does not hang on ACK timeout).
 */
import { validateMessage, type ThemePackage } from '@salet/shared';

const DEFAULT_BRIDGE_URL = 'ws://localhost:8787/ws';

export interface RuntimeBridgeClient {
  close: () => void;
  sendRuntimeReady: (pixiReady: boolean) => void;
}

interface RuntimeBridgeOptions {
  onTheme: (pkg: ThemePackage) => void;
  onStatus?: (status: string) => void;
  bridgeUrl?: string;
}

export function initRuntimeBridgeClient(opts: RuntimeBridgeOptions): RuntimeBridgeClient {
  const url = opts.bridgeUrl ?? import.meta.env.VITE_SALET_BRIDGE_URL ?? DEFAULT_BRIDGE_URL;
  const socket = new WebSocket(url);

  const send = (msg: unknown) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  socket.addEventListener('open', () => {
    opts.onStatus?.('connected');
    send({ type: 'CLIENT_HELLO', role: 'runtime' });
  });

  socket.addEventListener('close', () => {
    opts.onStatus?.('disconnected');
  });

  socket.addEventListener('error', () => {
    opts.onStatus?.('error');
  });

  socket.addEventListener('message', (event) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(event.data));
    } catch {
      return;
    }

    const result = validateMessage(parsed);
    if (!result.success) {
      // Extract requestId from the raw object so we can send a typed error ACK
      // instead of silently dropping (which causes ACK timeout on the authoring side).
      const raw = parsed as Record<string, unknown> | null;
      if (raw && raw['type'] === 'APPLY_THEME' && typeof raw['requestId'] === 'string') {
        send({
          type: 'APPLY_THEME_ACK',
          requestId: raw['requestId'],
          ok: false,
          errorCode: 'SCHEMA',
          message: result.error.issues.map((i) => i.message).slice(0, 3).join('; '),
        });
      }
      opts.onStatus?.(`schema-error: ${result.error.issues[0]?.message ?? 'invalid message'}`);
      return;
    }
    const msg = result.data;

    if (msg.type === 'APPLY_THEME') {
      try {
        opts.onTheme(msg.themePackage);
        send({ type: 'APPLY_THEME_ACK', requestId: msg.requestId, ok: true });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'theme apply failed';
        send({
          type: 'APPLY_THEME_ACK',
          requestId: msg.requestId,
          ok: false,
          errorCode: 'RUNTIME',
          message: detail,
        });
      }
    }
  });

  return {
    close: () => socket.close(),
    sendRuntimeReady: (pixiReady) => {
      send({ type: 'RUNTIME_READY', pixiReady });
    },
  };
}
