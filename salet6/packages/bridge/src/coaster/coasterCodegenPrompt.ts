import type { AnimationFamily, ThemeConfig } from '@salet/shared';
import type { CoasterAnimationInput } from '../providers/index.js';

export interface CoasterCodegenPromptOptions {
  attempt?: number;
  validationFeedback?: string;
}

/** Canonical runtime contract the display stub executes via `new Function('PIXI','ctx', script)`. */
export const COASTER_RUNTIME_CONTRACT = `
## Runtime contract (mandatory)
- Output ONE markdown fenced block tagged \`javascript\` containing plain JS only.
- Declare: function mountCoaster(PIXI, ctx) { ... }
- mountCoaster MUST return an object: { container, destroy(), tick?(ticker) }
  - container: PIXI.Container at local origin (0,0); runtime sets screen position.
  - destroy(): remove listeners/tickers and destroy container with children.
  - tick(ticker): optional; advance animation using ticker.deltaTime (do NOT create new Ticker).
- Use ONLY: PIXI.Container, PIXI.Graphics, PIXI.Sprite, PIXI.Texture, PIXI.Ticker from the PIXI argument.
- PixiJS v8 Graphics chaining: gfx.circle(x,y,r).fill({ color, alpha }) and .stroke({ color, width, alpha }).
- ctx fields: radius (number), colors (hex string[]), palette { primary, secondary, accent, background, text },
  speed ("Slow"|"Moderate"|"Fast"), intensity ("Low"|"Moderate"|"High"), drinkId (string), animationFamily (string).
- Deterministic math only — no Math.random().
- No imports, exports, TypeScript, types, interfaces, or \`as\` casts.
- No document/window/fetch/eval/Function/require.
`.trim();

const FAMILY_GUIDANCE: Record<AnimationFamily, string> = {
  energetic: '8 orbiting dots with pulsing radius (particles burst outward).',
  elegant: 'expanding ring stroke that fades (ripple / sonar).',
  tropical: '3 offset sine rings in colors[0..2].',
  bold: '8 radial spokes from center with oscillating length.',
};

/**
 * Builds the LLM prompt for per-drink coaster Pixi codegen.
 * Kept in one module so Poe/mock and docs stay aligned with runtime execution.
 */
export function buildCoasterCodegenPrompt(
  input: CoasterAnimationInput,
  options: CoasterCodegenPromptOptions = {},
): string {
  const family = input.animationFamily ?? 'elegant';
  const colors = input.colorPalette ?? [
    input.themeConfig.palette.primary,
    input.themeConfig.palette.secondary,
    input.themeConfig.palette.accent,
  ];
  const motion = input.themeConfig.motion;
  const lighting = input.themeConfig.lighting;
  const drinkIndex = input.drinkIndex ?? 0;
  const totalDrinks = input.totalDrinks ?? 1;
  const variantSeed = (drinkIndex % 3) + 1;

  const sections = [
    'You are a senior PixiJS v8 graphics engineer generating Tales9 smart-table coaster animations.',
    COASTER_RUNTIME_CONTRACT,
    '',
    '## Visual goal',
    `Drink: ${input.drink.name} (${input.drink.id})`,
    `Ingredients: ${input.drink.ingredients.join(', ') || 'none'}`,
    `Animation family: ${family} — ${FAMILY_GUIDANCE[family]}`,
    `Theme motion: ${motion.animation} / ${motion.speed} / ${motion.intensity}`,
    `Glow: ${lighting.glowColor} @ ${lighting.glowIntensity}`,
    `Palette primary/secondary/accent: ${colors.join(', ')}`,
    `Coaster radius (ctx.radius): ${input.radius}`,
    `Variant ${variantSeed} of ${totalDrinks} — make motion visually distinct from other drinks.`,
    '',
    '## Implementation checklist',
    '1. const { Container, Graphics } = PIXI;',
    '2. const container = new Container(); const gfx = new Graphics(); container.addChild(gfx);',
    '3. let phase = 0; in tick: phase += ticker.deltaTime * speedFactor (Slow=0.03, Moderate=0.05, Fast=0.08).',
    '4. Each tick: gfx.clear(); redraw using ctx.colors and family pattern.',
    '5. Parse hex: const hex = (s) => Number.parseInt(String(s||"#ffffff").replace("#",""), 16);',
    '6. return { container, tick(ticker){...}, destroy(){ container.destroy({ children: true }); } };',
    '',
    '## Reference skeleton (adapt, do not copy verbatim)',
    '```javascript',
    'function mountCoaster(PIXI, ctx) {',
    '  const { Container, Graphics } = PIXI;',
    '  const container = new Container();',
    '  const gfx = new Graphics();',
    '  container.addChild(gfx);',
    '  let phase = 0;',
    '  const hex = (s) => Number.parseInt(String(s || "#ffffff").replace("#", ""), 16);',
    '  const colors = Array.isArray(ctx.colors) ? ctx.colors : [];',
    '  const radius = typeof ctx.radius === "number" ? ctx.radius : 48;',
    '  const family = String(ctx.animationFamily || "elegant");',
    '  const speedFactor = ctx.speed === "Fast" ? 0.08 : ctx.speed === "Moderate" ? 0.05 : 0.03;',
    '  return {',
    '    container,',
    '    tick(ticker) {',
    '      const dt = ticker && typeof ticker.deltaTime === "number" ? ticker.deltaTime : 1;',
    '      phase += dt * speedFactor;',
    '      gfx.clear();',
    '      const c0 = hex(colors[0] || "#ffffff");',
    '      // draw family-specific pattern here',
    '    },',
    '    destroy() { container.destroy({ children: true }); },',
    '  };',
    '}',
    '```',
  ];

  if (options.validationFeedback) {
    sections.push(
      '',
      `## Fix previous attempt (attempt ${options.attempt ?? 2})`,
      'The last output failed bridge validation:',
      options.validationFeedback,
      'Return corrected JavaScript only. Ensure mountCoaster exists and returns { container, destroy, tick? }.',
    );
  }

  return sections.join('\n');
}

/** JSON snapshot passed to compile/logging. */
export function coasterCodegenContext(input: CoasterAnimationInput): Record<string, unknown> {
  return {
    drinkId: input.drink.id,
    drinkName: input.drink.name,
    animationFamily: input.animationFamily,
    colorPalette: input.colorPalette,
    radius: input.radius,
    motion: input.themeConfig.motion,
    lighting: input.themeConfig.lighting,
    drinkIndex: input.drinkIndex,
    totalDrinks: input.totalDrinks,
  };
}
