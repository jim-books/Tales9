/**
 * Bridge entrypoint: Express HTTP on BRIDGE_PORT + WebSocket router on /ws.
 * Loads repo-root .env via loadEnv.js; selects mock or Poe provider from PROVIDER.
 */
import './loadEnv.js';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { selectProvider } from './providers/index.js';
import { attachWsRouter } from './ws/router.js';
import { poeApiKeyFingerprint, resolvedPoeModels } from './loadEnv.js';

const port = Number(process.env.BRIDGE_PORT ?? 8787);
const provider = selectProvider(process.env);

const app = createApp({ provider });
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
attachWsRouter(wss);

server.listen(port, () => {
  console.log(`[bridge] listening on http://localhost:${port}  (provider=${provider.name}, ws=/ws)`);
  if (provider.name === 'poe') {
    const models = resolvedPoeModels();
    console.log(
      `[bridge] Poe models: text=${models.text ?? '(default)'} edit=${models.edit ?? '(default)'} code=${models.code ?? '(default)'} image=${models.image ?? '(default)'} key=${poeApiKeyFingerprint() ?? '(missing)'}`,
    );
  }
});
