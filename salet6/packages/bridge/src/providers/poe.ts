import type {
  ThemeConfig,
  AnimationFamily,
  GeneratePlansResponse,
  SelectPlanResponse,
} from '@salet/shared';
import type {
  Provider,
  GeneratePlansInput,
  SelectPlanInput,
  NLEditInput,
  DrinkCharacterInput,
  DrinkCharacterResult,
  CoasterAnimationInput,
  CoasterAnimationResult,
  ImagenAssetsInput,
  ImagenAssetsResult,
} from './index.js';
import { MockProvider } from './mock.js';
import { unfenceCoasterSource } from '@salet/shared/coaster-entrypoint-core';
import { buildCoasterCodegenPrompt } from '../coaster/coasterCodegenPrompt.js';
import { extractImageUrlFromPoeContent } from './extractImageUrl.js';
import {
  GeneratePlansResponse as GeneratePlansResponseZod,
  SelectPlanResponse as SelectPlanResponseZod,
  ThemeConfig as ThemeConfigZod,
  buildGeneratePlansPrompt,
  buildSelectPlanPrompt,
} from '@salet/shared';

const POE_BASE_URL = process.env.POE_BASE_URL ?? 'https://api.poe.com/v1';
const TEXT_MODEL = process.env.POE_TEXT_MODEL ?? 'gpt-5.2-instant';
const EDIT_MODEL = process.env.POE_EDIT_MODEL ?? 'gemini-3.5-flash';
const CODE_MODEL = process.env.POE_CODE_MODEL ?? 'gemini-3.5-flash';
const IMAGE_MODEL = process.env.POE_IMAGE_MODEL ?? 'imagen-4-fast';

type PoeOutputItem = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type PoeResponsesPayload = {
  output_text?: string;
  output?: PoeOutputItem[];
};

/** Extract assistant text from Poe /v1/responses (top-level output_text or nested message content). */
export function extractPoeResponseText(data: PoeResponsesPayload): string | null {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }
  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part.type === 'output_text' && typeof part.text === 'string' && part.text) {
        chunks.push(part.text);
      }
    }
  }
  const joined = chunks.join('').trim();
  return joined || null;
}

/** Fill missing themeConfig / assetPrompts from the selected plan when Poe returns partial JSON. */
function normalizeSelectPlanParsed(
  parsed: Omit<SelectPlanResponse, 'promptUsed'>,
  input: SelectPlanInput,
): Omit<SelectPlanResponse, 'promptUsed'> {
  const preview = input.selectedPlan.preview;
  const tc = parsed.themeConfig ?? ({} as Partial<ThemeConfig>);
  const themeConfig: ThemeConfig = {
    palette: {
      primary: tc.palette?.primary ?? preview.palette.primary,
      secondary: tc.palette?.secondary ?? preview.palette.secondary,
      accent: tc.palette?.accent ?? preview.palette.accent,
      background: tc.palette?.background ?? preview.palette.background,
      text: tc.palette?.text ?? preview.palette.text,
    },
    motion: {
      animation: tc.motion?.animation ?? preview.motion.animation,
      speed: tc.motion?.speed ?? preview.motion.speed,
      intensity: tc.motion?.intensity ?? preview.motion.intensity,
    },
    lighting: {
      glowColor: tc.lighting?.glowColor ?? preview.lighting.glowColor,
      glowIntensity: tc.lighting?.glowIntensity ?? preview.lighting.glowIntensity,
    },
    ...(tc.perDrinkOverrides ? { perDrinkOverrides: tc.perDrinkOverrides } : {}),
  };
  const assetPrompts: SelectPlanResponse['assetPrompts'] = { ...(parsed.assetPrompts ?? {}) };
  input.drinks.forEach((drink) => {
    if (!assetPrompts[drink.id]) {
      assetPrompts[drink.id] = {
        ingredientSpritePrompt: `${drink.name} ingredient sprite, minimal flat style, palette ${themeConfig.palette.accent}`,
        coasterTexturePrompt: `${drink.name} coaster texture, subtle grain, ${themeConfig.palette.primary} on ${themeConfig.palette.background}`,
      };
    }
  });
  return {
    themeConfig,
    assetPrompts,
    animationConcept:
      parsed.animationConcept ??
      `Ambient ${input.selectedPlan.name} motion with ${themeConfig.motion.animation}.`,
  };
}

/**
 * Real Poe provider (OpenAI-compatible API at api.poe.com/v1).
 *
 * Text: POE_TEXT_MODEL (plans, select-plan). Edit/code: gemini via POE_EDIT_MODEL / POE_CODE_MODEL.
 * Images: POE_IMAGE_MODEL (drink previews). On parse/HTTP failure, falls back to MockProvider.
 */
export class PoeProvider implements Provider {
  readonly name = 'poe' as const;
  private readonly fallback = new MockProvider();

  constructor(private readonly apiKey: string) {}

  async generatePlans(input: GeneratePlansInput): Promise<GeneratePlansResponse> {
    const promptUsed = buildGeneratePlansPrompt(input);

    const parsed = await this.completeJson<Omit<GeneratePlansResponse, 'promptUsed'>>(
      promptUsed,
      TEXT_MODEL,
      'generatePlans',
    );
    const validated = parsed && GeneratePlansResponseZod.safeParse({ ...parsed, promptUsed });
    if (!validated?.success) {
      console.warn('[poe] generatePlans fell back to mock');
      const fallback = await this.fallback.generatePlans(input);
      return { ...fallback, promptUsed };
    }
    return validated.data;
  }

  async selectPlan(input: SelectPlanInput): Promise<SelectPlanResponse> {
    const promptUsed = buildSelectPlanPrompt(input);

    const parsed = await this.completeJson<Omit<SelectPlanResponse, 'promptUsed'>>(
      promptUsed,
      TEXT_MODEL,
      'selectPlan',
    );
    if (!parsed) {
      console.warn('[poe] selectPlan fell back to mock');
      const fallback = await this.fallback.selectPlan(input);
      return { ...fallback, promptUsed };
    }
    const normalized = normalizeSelectPlanParsed(parsed, input);
    const validated = SelectPlanResponseZod.safeParse({ ...normalized, promptUsed });
    if (!validated.success) {
      console.warn('[poe] selectPlan fell back to mock');
      const fallback = await this.fallback.selectPlan(input);
      return { ...fallback, promptUsed };
    }
    return validated.data;
  }

  async generateDrinkCharacter(input: DrinkCharacterInput): Promise<DrinkCharacterResult> {
    const { drink, themeHint } = input;

    // Step 1: text generation — description + character metadata
    const textPrompt = [
      'You are a creative cocktail brand AI. Given a drink name and its ingredients, return a JSON object with these fields:',
      '{ spriteCharacter: string (one ingredient slug, e.g. "pineapple"), description: string (1-2 sentences, evocative), animationFamily: "energetic"|"elegant"|"tropical"|"bold", colorPalette: [hex, hex, hex] }',
      `Drink: ${drink.name}`,
      `Ingredients: ${drink.ingredients.join(', ')}`,
      themeHint ? `Theme context: ${themeHint}` : '',
      'Return ONLY valid JSON.',
    ].filter(Boolean).join('\n');

    type TextResult = { spriteCharacter: string; description: string; animationFamily: AnimationFamily; colorPalette: [string, string, string] };
    const textData = await this.completeJson<TextResult>(textPrompt, TEXT_MODEL, 'generateDrinkCharacter');

    // Validate enum before using
    const validFamilies: AnimationFamily[] = ['energetic', 'elegant', 'tropical', 'bold'];
    const characterData: DrinkCharacterResult['characterData'] = textData && validFamilies.includes(textData.animationFamily)
      ? {
          spriteCharacter: textData.spriteCharacter,
          description: textData.description,
          animationFamily: textData.animationFamily,
          colorPalette: Array.isArray(textData.colorPalette) && textData.colorPalette.length >= 3
            ? [textData.colorPalette[0]!, textData.colorPalette[1]!, textData.colorPalette[2]!]
            : ['#FF2A6D', '#05D9E8', '#D1F7FF'],
        }
      : (await this.fallback.generateDrinkCharacter(input)).characterData;

    const description = textData?.description ?? characterData.description;

    // Step 2: image generation — visual preview via imagen-4-fast
    const imagePrompt = `Cocktail drink illustration for "${drink.name}": ${drink.ingredients.slice(0, 3).join(', ')}. Vibrant, stylized, top-down bar coaster view. Dark background.`;
    const imageUrl = await this.generateImage(imagePrompt);

    return { description, imageUrl, characterData };
  }

  async applyNL(input: NLEditInput): Promise<ThemeConfig> {
    const prompt = [
      'You are a precise theme editor. Output only valid JSON matching the ThemeConfig schema.',
      'Never add or remove fields. Only modify values directly implied by the user request.',
      'Preserve all other values exactly.',
      'If user requests unsupported animation, ignore that change and keep current value.',
      'If user uses color names, convert to closest valid hex.',
      `Current ThemeConfig: ${JSON.stringify(input.themeConfig)}`,
      `User request: ${input.prompt}`,
    ].filter(Boolean).join('\n');

    const parsed = await this.completeJson<ThemeConfig>(prompt, EDIT_MODEL, 'applyNL');
    const validated = parsed && ThemeConfigZod.safeParse(parsed);
    if (!validated?.success) {
      console.warn('[poe] applyNL fell back to mock');
      return this.fallback.applyNL(input);
    }
    return validated.data;
  }

  async generateCoasterAnimation(input: CoasterAnimationInput): Promise<CoasterAnimationResult> {
    const prompt = buildCoasterCodegenPrompt(input, {
      attempt: input.attempt,
      validationFeedback: input.validationFeedback,
    });

    let content: string | null = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      content = await this.completeText(prompt, CODE_MODEL, 'generateCoasterAnimation');
      if (content) break;
    }
    if (!content) {
      console.warn('[poe] generateCoasterAnimation fell back to mock');
      return this.fallback.generateCoasterAnimation(input);
    }
    const cleaned = unfenceCoasterSource(content);
    return { drinkId: input.drink.id, code: cleaned };
  }

  async generateImagenAssets(input: ImagenAssetsInput): Promise<ImagenAssetsResult> {
    const assets: ImagenAssetsResult['assets'] = {};
    const warnings: string[] = [];
    for (const drink of input.drinks) {
      const prompts = input.assetPrompts?.[drink.id];
      const ingredientPrompt = prompts?.ingredientSpritePrompt ?? `abstract stylized ${drink.name} element`;
      const coasterPrompt = prompts?.coasterTexturePrompt ?? `${drink.name} coaster texture`;
      const ingredientUrl = await this.generateImage(ingredientPrompt);
      const coasterUrl = await this.generateImage(coasterPrompt);
      assets[drink.id] = {
        ingredientSprite: { url: ingredientUrl, mimeType: inferMime(ingredientUrl) },
        coasterTexture: { url: coasterUrl, mimeType: inferMime(coasterUrl) },
      };
      if (!ingredientUrl || !coasterUrl) {
        warnings.push(`imagen assets missing for drink ${drink.id}`);
      }
    }
    return warnings.length ? { assets, warnings } : { assets };
  }

  private async generateImage(prompt: string): Promise<string | null> {
    try {
      const imageModel = IMAGE_MODEL;
      const res = await fetch(`${POE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: imageModel,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn('[poe] imagen non-OK', res.status, body.slice(0, 200));
        return null;
      }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string | unknown[] } }> };
      const rawContent = data.choices?.[0]?.message?.content;
      const content =
        typeof rawContent === 'string'
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent
                .map((part) =>
                  typeof part === 'object' && part && 'text' in part
                    ? String((part as { text?: string }).text ?? '')
                    : typeof part === 'object' && part && 'image_url' in part
                      ? String((part as { image_url?: { url?: string } }).image_url?.url ?? '')
                      : '',
                )
                .join('\n')
            : '';
      const imageUrl = extractImageUrlFromPoeContent(content);
      if (!imageUrl) {
        console.warn('[poe] imagen content has no URL', content.slice(0, 200));
      }
      return imageUrl;
    } catch (err) {
      console.warn('[poe] generateImage(chat) failed', (err as Error).message);
      return null;
    }
  }

  private async completeJson<T>(prompt: string, model: string, operation = 'unknown'): Promise<T | null> {
    try {
      const input = `You are a strict JSON generator. Respond with valid JSON only. No prose.\n\n${prompt}`;
      const payload = { model, input };
      const bodyKeys = Object.keys(JSON.parse(JSON.stringify(payload)) as Record<string, unknown>);
      const res = await fetch(`${POE_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn('[poe] non-OK response', res.status, body.slice(0, 200));
        return null;
      }
      const data = (await res.json()) as PoeResponsesPayload;
      const content = extractPoeResponseText(data);
      if (!content) {
        console.warn('[poe] responses missing extractable text', {
          outputItems: data.output?.length ?? 0,
        });
        return null;
      }
      // Tolerate optional triple-backtick fences.
      const cleaned = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch (parseErr) {
        console.warn('[poe] JSON parse failed', (parseErr as Error).message, cleaned.slice(0, 120));
        return null;
      }
    } catch (err) {
      console.warn('[poe] request failed', (err as Error).message);
      return null;
    }
  }

  private async completeText(prompt: string, model: string, operation = 'unknown'): Promise<string | null> {
    try {
      const payload = { model, input: prompt };
      const bodyKeys = Object.keys(JSON.parse(JSON.stringify(payload)) as Record<string, unknown>);
      const res = await fetch(`${POE_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn('[poe] non-OK response', res.status, body.slice(0, 200));
        return null;
      }
      const data = (await res.json()) as PoeResponsesPayload;
      return extractPoeResponseText(data);
    } catch (err) {
      console.warn('[poe] request failed', (err as Error).message);
      return null;
    }
  }
}

function inferMime(url: string | null): string | undefined {
  if (!url) return undefined;
  if (/\.(png|webp)(\?|$)/i.test(url)) return 'image/png';
  if (/\.(jpg|jpeg)(\?|$)/i.test(url)) return 'image/jpeg';
  if (/\.svg(\?|$)/i.test(url)) return 'image/svg+xml';
  return undefined;
}
