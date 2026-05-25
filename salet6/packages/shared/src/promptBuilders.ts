/**
 * Canonical LLM prompt strings for generate-plans and select-plan.
 * Shared by the bridge (Poe/mock providers) and the Salet6 authoring UI
 * so the Generate loader can display the exact prompt sent (`promptUsed`).
 */
import type { DesignPlan, DraftDrink } from './types.js';

export interface GeneratePlansPromptInput {
  brandDescription: string;
  preset?: string;
  drinks: DraftDrink[];
}

export interface SelectPlanPromptInput {
  selectedPlan: DesignPlan;
  drinks: DraftDrink[];
}

/** Canonical LLM prompt for POST /generate-plans (shared by bridge + authoring UI). */
export function buildGeneratePlansPrompt(input: GeneratePlansPromptInput): string {
  return [
    'You are a senior visual systems designer for Tales9 interactive bar tables.',
    'Output only valid JSON. Never include markdown, explanations, or extra text.',
    'Rules:',
    '- Use only these animation values: Pulse Glitch, Slow Drift, Wave Ripple, Firefly Float, Shimmer Drift, Scanline Scroll.',
    '- Use only these speed values: Slow, Moderate, Fast.',
    '- Use only these intensity values: Low, Moderate, High.',
    '- Use only these glowIntensity values: VeryLow, Low, Moderate, High, Maximum.',
    '- Colors must be valid 6-digit hex (#RRGGBB). Example: #A1B2C3.',
    '- Plan A must be conservative/on-brand, Plan B bold/experimental, Plan C sleek/minimalist.',
    '- Summary <= 280 chars.',
    '- Do not invent fields outside schema.',
    'Output JSON object: { "plans": [ { id:"A"|"B"|"C", name:string, summary:string, preview:{ palette:{primary,secondary,accent,background,text}, motion:{animation,speed,intensity}, lighting:{glowColor,glowIntensity} } } ] }',
    `Brand description: ${input.brandDescription}`,
    input.preset ? `Preset (optional): ${input.preset}` : 'Preset (optional): null',
    `Drink menu (names only): ${input.drinks.map((d) => d.name).join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Canonical LLM prompt for POST /select-plan (shared by bridge + authoring UI). */
export function buildSelectPlanPrompt(input: SelectPlanPromptInput): string {
  return [
    'You are an expert digital asset director. Output only valid JSON. No markdown or commentary.',
    'Refine the provided plan into a final ThemeConfig.',
    'For each drink, create concise, visually precise prompts for imagen-4-fast.',
    'Keep prompts under 120 characters when possible. Use consistent lighting/style language derived from the theme.',
    'If ingredients are missing, default to "abstract stylized [drinkName] element".',
    'Output JSON: { "themeConfig": { ... }, "assetPrompts": { "drinkId": { "ingredientSpritePrompt": "...", "coasterTexturePrompt": "..." } }, "animationConcept": "..." }',
    `Selected plan: ${JSON.stringify(input.selectedPlan)}`,
    `Drink menu with ingredients: ${JSON.stringify(input.drinks)}`,
  ].join('\n');
}
