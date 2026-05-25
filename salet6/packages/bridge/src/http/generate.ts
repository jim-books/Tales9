import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { DraftDrink } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  brandDescription: z.string(),
  preset: z.string().optional(),
  drinks: z.array(DraftDrink),
});

/** HTTP route: POST /api/generate-plans — three DesignPlan directions from brand + menu. */
export function generateRouter(provider: Provider): Router {
  const r = Router();
  r.post('/generate-plans', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const plans = await provider.generatePlans(parsed.data);
      return okJson(res, plans);
    } catch (err) {
      return errJson(res, 500, 'PROVIDER_ERROR', (err as Error).message);
    }
  });
  return r;
}
