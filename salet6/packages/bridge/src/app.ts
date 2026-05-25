import express, { type Express } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Provider } from './providers/index.js';
import { generateRouter } from './http/generate.js';
import { selectPlanRouter } from './http/selectPlan.js';
import { nlEditRouter } from './http/nlEdit.js';
import { compileRouter } from './http/compile.js';
import { assetsRouter } from './http/assets.js';
import { drinkCharacterRouter } from './http/drinkCharacter.js';
import { assetProxyRouter } from './http/assetProxy.js';
import { coasterCodegenRouter } from './http/coasterCodegen.js';
import { imagenAssetsRouter } from './http/imagenAssets.js';

export interface CreateAppOptions {
  provider: Provider;
  uploadsDir?: string;
}

export function createApp(opts: CreateAppOptions): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const uploadsDir = opts.uploadsDir ?? defaultUploadsDir();

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      data: {
        provider: opts.provider.name,
        uploadsDir,
        models:
          opts.provider.name === 'poe'
            ? {
                text: process.env.POE_TEXT_MODEL ?? 'gpt-5.2-instant',
                edit: process.env.POE_EDIT_MODEL ?? 'gemini-3.5-flash',
                code: process.env.POE_CODE_MODEL ?? 'gemini-3.5-flash',
                image: process.env.POE_IMAGE_MODEL ?? 'imagen-4-fast',
              }
            : undefined,
      },
    });
  });

  app.use('/api', generateRouter(opts.provider));
  app.use('/api', selectPlanRouter(opts.provider));
  app.use('/api', nlEditRouter(opts.provider));
  app.use('/api', compileRouter());
  app.use('/api', assetsRouter({ uploadsDir }));
  app.use('/api', drinkCharacterRouter(opts.provider, { uploadsDir }));
  app.use('/api', coasterCodegenRouter(opts.provider));
  app.use('/api', imagenAssetsRouter(opts.provider, { uploadsDir }));
  app.use('/api', assetProxyRouter());
  app.use('/uploads', express.static(uploadsDir));

  return app;
}

function defaultUploadsDir() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Inside packages/bridge/src; uploads sit at packages/bridge/uploads.
  return path.resolve(__dirname, '..', 'uploads');
}
