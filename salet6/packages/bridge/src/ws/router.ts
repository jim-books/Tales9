import type { WebSocket, WebSocketServer } from 'ws';
import { validateMessage, type ClientRole } from '@salet/shared';

interface RegisteredSocket {
  socket: WebSocket;
  role: ClientRole;
  clientId?: string;
}

export interface WsRouter {
  authoring: RegisteredSocket | null;
  runtime: RegisteredSocket | null;
}

/**
 * Attaches Salet6 bridge routing semantics to a `ws.WebSocketServer`.
 *
 *   authoring  --APPLY_THEME-->  runtime
 *   runtime    --APPLY_THEME_ACK--> authoring
 *
 * If the peer for a forwarded message is missing, the bridge replies to the sender
 * with `BRIDGE_ERROR { code: 'NO_PEER' }` so the admin UI can surface a useful error.
 */
export function attachWsRouter(wss: WebSocketServer): WsRouter {
  const state: WsRouter = { authoring: null, runtime: null };

  wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(raw));
      } catch {
        sendErr(socket, 'INVALID_JSON', 'message was not valid JSON');
        return;
      }

      const result = validateMessage(parsed);
      if (!result.success) {
        sendErr(socket, 'INVALID_MESSAGE', result.error.message);
        return;
      }
      const msg = result.data;

      switch (msg.type) {
        case 'CLIENT_HELLO': {
          state[msg.role] = { socket, role: msg.role, clientId: msg.clientId };
          break;
        }
        case 'RUNTIME_READY': {
          // Mirror to authoring so the admin UI can enable Apply.
          const target = state.authoring;
          if (target) safeSend(target.socket, msg);
          break;
        }
        case 'APPLY_THEME':
        case 'PREVIEW_THEME': {
          const target = state.runtime;
          if (!target) {
            sendErr(socket, 'NO_PEER', 'no runtime client connected', msg.requestId);
            return;
          }
          safeSend(target.socket, msg);
          break;
        }
        case 'APPLY_THEME_ACK':
        case 'PREVIEW_THEME_ACK': {
          const target = state.authoring;
          if (!target) {
            sendErr(socket, 'NO_PEER', 'no authoring client connected', msg.requestId);
            return;
          }
          safeSend(target.socket, msg);
          break;
        }
        case 'BRIDGE_ERROR': {
          // Bridges don't forward error frames; clients can use them but the bridge ignores them.
          break;
        }
      }
    });

    socket.on('close', () => {
      if (state.authoring?.socket === socket) state.authoring = null;
      if (state.runtime?.socket === socket) state.runtime = null;
    });
  });

  return state;
}

function safeSend(socket: WebSocket, msg: unknown): void {
  try {
    socket.send(JSON.stringify(msg));
  } catch {
    // Ignore send failures; closed-socket cleanup happens in the 'close' handler.
  }
}

function sendErr(socket: WebSocket, code: string, message: string, requestId?: string): void {
  safeSend(socket, { type: 'BRIDGE_ERROR', code, message, requestId });
}
