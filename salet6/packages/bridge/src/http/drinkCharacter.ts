import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { DraftDrink } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { okJson, errJson } from './_utils.js';
import { cacheRemoteImageForUi } from './cacheRemoteImage.js';

const Body = z.object({
  drink: DraftDrink,
  themeHint: z.string().optional(),
});

export interface DrinkCharacterRouterOptions {
  uploadsDir: string;
}

export function drinkCharacterRouter(
  provider: Provider,
  opts: DrinkCharacterRouterOptions,
): Router {
  const r = Router();
  r.post('/generate-drink-character', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const result = await provider.generateDrinkCharacter(parsed.data);
      if (result.imageUrl) {
        const cached = await cacheRemoteImageForUi(result.imageUrl, opts.uploadsDir);
        if (cached) {
          result.imageUrl = cached;
        }
      }
      return okJson(res, result);
    } catch (err) {
      return errJson(res, 500, 'GENERATION_ERROR', (err as Error).message);
    }
  });
  return r;
}
