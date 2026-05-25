import type {
  ThemeConfig,
  DraftDrink,
  DesignPlan,
  AnimationFamily,
  GeneratePlansResponse,
  SelectPlanResponse,
} from '@salet/shared';

export interface GeneratePlansInput {
  brandDescription: string;
  preset?: string;
  drinks: DraftDrink[];
}

export interface SelectPlanInput {
  selectedPlan: DesignPlan;
  drinks: DraftDrink[];
}

export interface NLEditInput {
  themeConfig: ThemeConfig;
  prompt: string;
  scope?: string;
}

export interface DrinkCharacterInput {
  drink: DraftDrink;
  themeHint?: string;
}

export interface DrinkCharacterResult {
  description: string;
  imageUrl: string | null;
  characterData: {
    spriteCharacter: string;
    description: string;
    animationFamily: AnimationFamily;
    colorPalette: [string, string, string];
  };
}

export interface CoasterAnimationInput {
  themeConfig: ThemeConfig;
  radius: number;
  drink: DraftDrink;
  drinkIndex?: number;
  totalDrinks?: number;
  animationFamily?: AnimationFamily;
  colorPalette?: [string, string, string];
  /** Set by coasterCodegenService on retry attempts. */
  attempt?: number;
  validationFeedback?: string;
}

export interface CoasterAnimationResult {
  drinkId: string;
  code: string;
}

export interface ImagenAssetsInput {
  themeConfig: ThemeConfig;
  assetPrompts: SelectPlanResponse['assetPrompts'];
  drinks: DraftDrink[];
}

export interface ImagenAssetsResult {
  assets: Record<
    string,
    {
      ingredientSprite?: { url: string | null; mimeType?: string };
      coasterTexture?: { url: string | null; mimeType?: string };
    }
  >;
  warnings?: string[];
}

export interface Provider {
  name: 'mock' | 'poe';
  generatePlans(input: GeneratePlansInput): Promise<GeneratePlansResponse>;
  selectPlan(input: SelectPlanInput): Promise<SelectPlanResponse>;
  applyNL(input: NLEditInput): Promise<ThemeConfig>;
  generateDrinkCharacter(input: DrinkCharacterInput): Promise<DrinkCharacterResult>;
  generateCoasterAnimation(input: CoasterAnimationInput): Promise<CoasterAnimationResult>;
  generateImagenAssets(input: ImagenAssetsInput): Promise<ImagenAssetsResult>;
}

export { MockProvider } from './mock.js';
export { PoeProvider } from './poe.js';

export function selectProvider(env: NodeJS.ProcessEnv): Provider {
  const name = (env.PROVIDER ?? 'mock').toLowerCase();
  if (name === 'poe') {
    const key = env.POE_API_KEY;
    if (!key) {
      throw new Error('PROVIDER=poe requires POE_API_KEY in the environment.');
    }
    return new PoeProviderImpl(key);
  }
  return new MockProviderImpl();
}

// Inline class refs to avoid a circular import at runtime.
import { MockProvider as MockProviderImpl } from './mock.js';
import { PoeProvider as PoeProviderImpl } from './poe.js';
