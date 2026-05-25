import { z } from 'zod';

export const HexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'expected 6-digit hex color like #aabbcc');

export const AnimationName = z.enum([
  'Pulse Glitch',
  'Slow Drift',
  'Wave Ripple',
  'Firefly Float',
  'Shimmer Drift',
  'Scanline Scroll',
]);

export const Speed = z.enum(['Slow', 'Moderate', 'Fast']);
export const Intensity = z.enum(['Low', 'Moderate', 'High']);
export const GlowIntensity = z.enum(['VeryLow', 'Low', 'Moderate', 'High', 'Maximum']);

export const Palette = z.object({
  primary: HexColor,
  secondary: HexColor,
  accent: HexColor,
  background: HexColor,
  text: HexColor,
});

export const MotionProfile = z.object({
  animation: AnimationName,
  speed: Speed,
  intensity: Intensity,
});

export const Lighting = z.object({
  glowColor: HexColor,
  glowIntensity: GlowIntensity,
});

export const PerDrinkOverride = z
  .object({
    spriteCharacter: z.string().optional(),
    coasterAnimationRef: z.string().optional(),
    palette: Palette.partial().optional(),
    motion: MotionProfile.partial().optional(),
    lighting: Lighting.partial().optional(),
  })
  .partial();

export const ThemeConfig = z.object({
  palette: Palette,
  motion: MotionProfile,
  lighting: Lighting,
  perDrinkOverrides: z.record(z.string(), PerDrinkOverride).optional(),
});

export const DrinkCategory = z.enum(['CLASSICS', 'COFFEE_BASED', 'DESSERT_INSPIRED']);
export const AnimationFamily = z.enum(['energetic', 'elegant', 'tropical', 'bold']);

export const DrinkProfile = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: DrinkCategory,
  price: z.number().nonnegative(),
  flavorProfile: z.string(),
  ingredients: z.array(z.string()),
  animationFamily: AnimationFamily,
  colorPalette: z.tuple([HexColor, HexColor, HexColor]),
  spriteCharacter: z.string(),
  description: z.string(),
  /** Optional Imagen preview URL from Salet6 generate-drink-character. */
  imageUrl: z.string().optional(),
});

export const DraftDrink = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ingredients: z.array(z.string()),
  photoAssetId: z.string().optional(),
});

export const DesignPlan = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string(),
  preview: z.object({
    palette: Palette,
    motion: MotionProfile,
    lighting: Lighting,
  }),
});

export const GeneratePlansResponse = z.object({
  plans: z.array(DesignPlan).length(3),
  promptUsed: z.string().optional(),
});

export const SelectPlanResponse = z.object({
  themeConfig: ThemeConfig,
  assetPrompts: z.record(
    z.string(),
    z.object({
      ingredientSpritePrompt: z.string(),
      coasterTexturePrompt: z.string(),
    }),
  ),
  animationConcept: z.string(),
  promptUsed: z.string().optional(),
});

export const CoasterRuntimeArtifact = z.object({
  artifactType: z.literal('pixiCode'),
  entrypoint: z.string(),
  sourceRef: z.string().optional(),
  checksum: z.string().optional(),
});

export const ThemePackage = z.object({
  packageVersion: z.string().min(1),
  themeConfig: ThemeConfig,
  drinkProfiles: z.array(DrinkProfile),
  assetRefs: z.array(z.string()).optional(),
  runtimeArtifacts: z
    .object({
      coasterAnimations: z.record(z.string(), CoasterRuntimeArtifact).optional(),
    })
    .optional(),
  checksum: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const AssetType = z.enum([
  'logo',
  'icon',
  'drinkPhoto',
  'ingredientSprite',
  'coasterTexture',
  'drinkCharacter',
]);

export const Asset = z.object({
  id: z.string().min(1),
  type: AssetType,
  mimeType: z.string(),
  bytes: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  storageRef: z.string(),
  createdAt: z.string().datetime(),
});

export const GenerateImagenAssetsResponse = z.object({
  assets: z.record(
    z.string(),
    z.object({
      ingredientSprite: Asset.optional(),
      coasterTexture: Asset.optional(),
    }),
  ),
  warnings: z.array(z.string()).optional(),
});

export const DraftStep = z.enum(['CONCEPT', 'GENERATE', 'COMPARE', 'EDIT', 'APPLY']);

export const DraftAssetsStatus = z.enum(['none', 'generating', 'ready', 'error']);

export const Draft = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  step: DraftStep,
  brandDescription: z.string(),
  preset: z.string().optional(),
  drinks: z.array(DraftDrink),
  plans: z.array(DesignPlan).optional(),
  selectedPlanId: z.string().optional(),
  themeConfig: ThemeConfig.optional(),
  assets: z
    .object({
      status: DraftAssetsStatus,
      error: z.string().optional(),
    })
    .optional(),
  assetIds: z.array(z.string()).optional(),
});

export function validateThemePackage(input: unknown) {
  return ThemePackage.safeParse(input);
}
