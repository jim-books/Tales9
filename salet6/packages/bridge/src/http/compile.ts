import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ThemeConfig, DraftDrink, CoasterRuntimeArtifact, DrinkProfile } from '@salet/shared';
import { compileThemePackage } from '../compile/pixi.js';
import { okJson, errJson } from './_utils.js';

const Body = z.object({
  selectedPlanId: z.string().min(1),
  themeConfig: ThemeConfig,
  drinks: z.array(DraftDrink),
  drinkProfiles: z.array(DrinkProfile).optional(),
  coasterAnimations: z.record(z.string(), CoasterRuntimeArtifact).optional(),
  imageUrls: z.record(z.string(), z.string()).optional(),
  packageVersion: z.string().optional(),
});

export function compileRouter(): Router {
  const r = Router();
  r.post('/compile-runtime', (req: Request, res: Response) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return errJson(res, 400, 'INVALID_BODY', parsed.error.message);
    }
    try {
      const pkg = compileThemePackage(parsed.data);
      return okJson(res, pkg);
    } catch (err) {
      return errJson(res, 500, 'COMPILE_ERROR', (err as Error).message);
    }
  });
  return r;
}
