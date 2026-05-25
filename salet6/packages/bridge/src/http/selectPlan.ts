import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { DraftDrink, DesignPlan } from '@salet/shared';
import type { Provider } from '../providers/index.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  selectedPlan: DesignPlan,
  drinks: z.array(DraftDrink),
});

export function selectPlanRouter(provider: Provider): Router {
  const r = Router();
  r.post('/select-plan', async (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const result = await provider.selectPlan(parsed.data);
      return okJson(res, result);
    } catch (err) {
      return errJson(res, 500, 'PROVIDER_ERROR', (err as Error).message);
    }
  });
  return r;
}
