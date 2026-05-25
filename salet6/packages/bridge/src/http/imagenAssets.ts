import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DraftDrink, ThemeConfig, GenerateImagenAssetsResponse, AssetType, type Asset } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  themeConfig: ThemeConfig,
  assetPrompts: z.record(
    z.string(),
    z.object({
      ingredientSpritePrompt: z.string(),
      coasterTexturePrompt: z.string(),
    }),
  ),
  drinks: z.array(DraftDrink),
});

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export interface ImagenAssetsRouterOptions {
  uploadsDir: string;
  publicPath?: string;
}

export function imagenAssetsRouter(provider: Provider, opts: ImagenAssetsRouterOptions): Router {
  const r = Router();
  const publicPath = opts.publicPath ?? '/uploads';
  r.post('/generate-imagen-assets', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const result = await provider.generateImagenAssets(parsed.data);
      const assets: GenerateImagenAssetsResponse['assets'] = {};
      const warnings: string[] = [...(result.warnings ?? [])];
      await mkdir(opts.uploadsDir, { recursive: true });

      for (const drink of parsed.data.drinks) {
        const entry = result.assets[drink.id] ?? {};
        const ingredientAsset = await cacheRemoteAsset(
          entry.ingredientSprite?.url ?? null,
          'ingredientSprite',
          opts.uploadsDir,
          publicPath,
          warnings,
        );
        const coasterAsset = await cacheRemoteAsset(
          entry.coasterTexture?.url ?? null,
          'coasterTexture',
          opts.uploadsDir,
          publicPath,
          warnings,
        );
        assets[drink.id] = {
          ingredientSprite: ingredientAsset ?? undefined,
          coasterTexture: coasterAsset ?? undefined,
        };
      }

      const payload: GenerateImagenAssetsResponse = warnings.length ? { assets, warnings } : { assets };
      return okJson(res, payload);
    } catch (err) {
      return errJson(res, 500, 'PROVIDER_ERROR', (err as Error).message);
    }
  });
  return r;
}

async function cacheRemoteAsset(
  url: string | null,
  type: AssetType,
  uploadsDir: string,
  publicPath: string,
  warnings: string[],
): Promise<Asset | null> {
  if (!url) {
    warnings.push(`missing ${type} image url`);
    return null;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'salet6-bridge/1.0' } });
    if (!res.ok) {
      warnings.push(`failed ${type} fetch: ${res.status}`);
      return null;
    }
    const mimeType = res.headers.get('content-type') ?? '';
    const ext = ALLOWED_MIME[mimeType];
    if (!ext) {
      warnings.push(`unsupported ${type} mime: ${mimeType || 'unknown'}`);
      return null;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const fullPath = path.join(uploadsDir, filename);
    await writeFile(fullPath, bytes);
    return {
      id,
      type,
      mimeType,
      bytes: bytes.length,
      storageRef: `${publicPath}/${filename}`,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    warnings.push(`failed ${type} cache: ${(err as Error).message}`);
    return null;
  }
}
