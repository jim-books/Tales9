import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ThemeConfig, DraftDrink } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { generateValidatedCoasterAnimation } from '../coaster/coasterCodegenService.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  themeConfig: ThemeConfig,
  radius: z.number().positive(),
  drink: DraftDrink,
  drinkIndex: z.number().int().nonnegative().optional(),
  totalDrinks: z.number().int().positive().optional(),
  animationFamily: z.enum(['energetic', 'elegant', 'tropical', 'bold']).optional(),
  colorPalette: z.tuple([z.string(), z.string(), z.string()]).optional(),
});

export function coasterCodegenRouter(provider: Provider): Router {
  const r = Router();
  r.post('/generate-coaster-animation', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const result = await generateValidatedCoasterAnimation(provider, parsed.data);
      return okJson(res, result);
    } catch (err) {
      return errJson(res, 500, 'PROVIDER_ERROR', (err as Error).message);
    }
  });
  return r;
}
