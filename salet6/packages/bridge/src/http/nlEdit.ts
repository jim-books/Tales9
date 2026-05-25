import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ThemeConfig } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  themeConfig: ThemeConfig,
  prompt: z.string().min(1),
  scope: z.string().optional(),
});

export function nlEditRouter(provider: Provider): Router {
  const r = Router();
  r.post('/nl-edit', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const next = await provider.applyNL(parsed.data);
      return okJson(res, next);
    } catch (err) {
      return errJson(res, 500, 'PROVIDER_ERROR', (err as Error).message);
    }
  });
  return r;
}
