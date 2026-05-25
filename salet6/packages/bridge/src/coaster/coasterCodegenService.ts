import { MockProvider } from '../providers/mock.js';
import type { CoasterAnimationInput, CoasterAnimationResult, Provider } from '../providers/index.js';
import { buildCoasterCodegenPrompt } from './coasterCodegenPrompt.js';
import { validateCoasterEntrypoint } from './validateCoasterEntrypoint.js';

const MAX_ATTEMPTS = 3;

export interface GenerateCoasterOptions {
  buildPrompt?: typeof buildCoasterCodegenPrompt;
}

/**
 * Generate coaster Pixi code with validate-and-retry.
 * On repeated failure, falls back to the mock provider stub (always valid).
 */
export async function generateValidatedCoasterAnimation(
  provider: Provider,
  input: CoasterAnimationInput,
  _options: GenerateCoasterOptions = {},
): Promise<CoasterAnimationResult> {
  let validationFeedback: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await provider.generateCoasterAnimation({
      ...input,
      attempt,
      validationFeedback,
    });
    const validation = validateCoasterEntrypoint(result.code);
    if (validation.ok) {
      return { drinkId: result.drinkId, code: result.code };
    }
    validationFeedback = validation.error ?? 'unknown validation error';
    console.warn(
      `[coaster-codegen] ${input.drink.id} attempt ${attempt}/${MAX_ATTEMPTS}: ${validationFeedback}`,
    );
  }

  console.warn(`[coaster-codegen] ${input.drink.id} using mock fallback after ${MAX_ATTEMPTS} failures`);
  return new MockProvider().generateCoasterAnimation(input);
}
