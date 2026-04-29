/**
 * Demo WebSocket server for iOS ↔ HTML table config sync (no VPS).
 * Run on the Mac: Chromium uses ws://localhost:8080, iOS uses ws://<Mac IP>:8080.
 * Usage: node demo-ws-server.js  (requires: npm install ws)
 */

const { WebSocketServer } = require('ws');

const PORT = 8080;
let lastConfig = null;   // { animationType, topBarName, color }
let lastSession = null;  // { type: 'SESSION_START', payload: { userCount } }

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Replay cached state to new connections
  try {
    if (lastConfig) ws.send(JSON.stringify({ type: 'CONFIG_UPDATE', payload: lastConfig }));
    if (lastSession) ws.send(JSON.stringify(lastSession));
  } catch (e) {
    console.warn('Send initial state failed:', e.message);
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Cache stateful messages for new-connection replay
      if (msg.type === 'CONFIG_UPDATE' && msg.payload) {
        lastConfig = {
          animationType: msg.payload.animationType ?? '',
          topBarName: msg.payload.topBarName ?? '',
          color: msg.payload.color ?? '#7D5FFF'
        };
      }
      if (msg.type === 'SESSION_START') lastSession = msg;
      if (msg.type === 'SESSION_END')   lastSession = null;

      // SUBMIT_ORDER excludes sender; all other types broadcast to everyone
      const excludeSender = msg.type === 'SUBMIT_ORDER';
      const out = JSON.stringify(msg);
      wss.clients.forEach((client) => {
        if (client.readyState === 1 && (!excludeSender || client !== ws)) {
          client.send(out);
        }
      });
      console.log('Broadcast', msg.type);
    } catch (e) {
      console.warn('Invalid message:', e.message);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

wss.on('listening', () => {
  console.log(`Demo WS server on ws://0.0.0.0:${PORT} (use your Mac IP for iOS)`);
});
