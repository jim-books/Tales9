/**
 * Demo WebSocket server for iOS ↔ HTML table config sync (no VPS).
 * Run on the Mac: Chromium uses ws://localhost:8080, iOS uses ws://<Mac IP>:8080.
 * Usage: node demo-ws-server.js  (requires: npm install ws)
 */

const { WebSocketServer } = require('ws');

const PORT = 8080;
let lastConfig = null; // { animationType, topBarName, color }

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  console.log('Client connected');

  if (lastConfig) {
    try {
      ws.send(JSON.stringify({ type: 'CONFIG_UPDATE', payload: lastConfig }));
    } catch (e) {
      console.warn('Send initial config failed:', e.message);
    }
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'CONFIG_UPDATE' && msg.payload) {
        lastConfig = {
          animationType: msg.payload.animationType ?? '',
          topBarName: msg.payload.topBarName ?? '',
          color: msg.payload.color ?? '#7D5FFF'
        };
        const payload = JSON.stringify({ type: 'CONFIG_UPDATE', payload: lastConfig });
        wss.clients.forEach((client) => {
          if (client.readyState === 1) client.send(payload);
        });
        console.log('Broadcast CONFIG_UPDATE', lastConfig);
      } else if (msg.type === 'SUBMIT_ORDER' && msg.payload) {
        const payload = JSON.stringify(msg);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) client.send(payload);
        });
        console.log('Broadcast SUBMIT_ORDER', msg.payload);
      }
    } catch (e) {
      console.warn('Invalid message:', e.message);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

wss.on('listening', () => {
  console.log(`Demo WS server on ws://0.0.0.0:${PORT} (use your Mac IP for iOS)`);
});
