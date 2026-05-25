import { createHash } from 'node:crypto';
import type {
  DesignPlan,
  ThemeConfig,
  DraftDrink,
  Palette,
  MotionProfile,
  Lighting,
  AnimationFamily,
  GeneratePlansResponse,
  SelectPlanResponse,
} from '@salet/shared';
import { buildGeneratePlansPrompt, buildSelectPlanPrompt } from '@salet/shared';
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

/**
 * Deterministic mock provider. Same input → same output, derived from sha256(input).
 * Used as the default in dev/CI so the full Concept→Apply flow is testable without burning Poe credit.
 */
/** Deterministic provider for CI and offline demo; mirrors Poe response shapes and shared prompts. */
export class MockProvider implements Provider {
  readonly name = 'mock' as const;

  async generatePlans(input: GeneratePlansInput): Promise<GeneratePlansResponse> {
    const seed = hashSeed({ d: input.brandDescription, p: input.preset, k: input.drinks.map((x) => x.name) });
    return {
      plans: ['A', 'B', 'C'].map((id, i) => buildPlan(id, seed + i)),
      promptUsed: buildGeneratePlansPrompt(input),
    };
  }

  async selectPlan(input: SelectPlanInput): Promise<SelectPlanResponse> {
    const seed = hashSeed({ p: input.selectedPlan.id, t: input.selectedPlan.preview });
    const themeConfig: ThemeConfig = {
      palette: input.selectedPlan.preview.palette,
      motion: input.selectedPlan.preview.motion,
      lighting: input.selectedPlan.preview.lighting,
    };
    const assetPrompts: SelectPlanResponse['assetPrompts'] = {};
    input.drinks.forEach((drink, i) => {
      assetPrompts[drink.id] = {
        ingredientSpritePrompt: `${drink.name} ingredient sprite, minimal flat style, palette ${themeConfig.palette.accent}`,
        coasterTexturePrompt: `${drink.name} coaster texture, subtle grain, ${themeConfig.palette.primary} on ${themeConfig.palette.background}`,
      };
      if (seed && i === -1) {
        assetPrompts[drink.id].ingredientSpritePrompt = '';
      }
    });
    return {
      themeConfig,
      assetPrompts,
      animationConcept: `Ambient ${input.selectedPlan.name} motion with ${themeConfig.motion.animation}.`,
      promptUsed: buildSelectPlanPrompt(input),
    };
  }

  async applyNL(input: NLEditInput): Promise<ThemeConfig> {
    const seed = hashSeed({ p: input.prompt, s: input.scope });
    return mutateThemeConfig(input.themeConfig, seed);
  }

  async generateDrinkCharacter(input: DrinkCharacterInput): Promise<DrinkCharacterResult> {
    const seed = hashSeed({ n: input.drink.name, i: input.drink.ingredients });
    const family = animationFamilies[seed % animationFamilies.length]!;
    const palette = presetPalettes[seed % presetPalettes.length]!;
    const sprite = pickSprite(input.drink.ingredients, seed);
    const flavorAdjectives = ['vibrant', 'smooth', 'bold', 'tropical', 'crisp', 'rich'];
    const adj = flavorAdjectives[seed % flavorAdjectives.length]!;
    return {
      description: `${input.drink.name} — a ${adj} blend of ${input.drink.ingredients.slice(0, 2).join(' and ')}.`,
      imageUrl: null,
      characterData: {
        spriteCharacter: sprite,
        description: `${input.drink.name} — a ${adj} blend of ${input.drink.ingredients.slice(0, 2).join(' and ')}.`,
        animationFamily: family,
        colorPalette: [palette.primary, palette.secondary, palette.accent],
      },
    };
  }

  async generateCoasterAnimation(input: CoasterAnimationInput): Promise<CoasterAnimationResult> {
    const family = input.animationFamily ?? 'elegant';
    const colors = input.colorPalette ?? [
      input.themeConfig.palette.primary,
      input.themeConfig.palette.secondary,
      input.themeConfig.palette.accent,
    ];
    const seed = hashSeed({ id: input.drink.id, c: colors.join('') });
    const code = [
      'function mountCoaster(PIXI, ctx) {',
      '  const { Container, Graphics } = PIXI;',
      '  const container = new Container();',
      '  const gfx = new Graphics();',
      '  container.addChild(gfx);',
      '  let phase = ' + (seed % 100) / 100 + ';',
      '  const hex = (s) => Number.parseInt(String(s || "#ffffff").replace("#", ""), 16);',
      '  const palette = Array.isArray(ctx.colors) ? ctx.colors : ' + JSON.stringify(colors) + ';',
      '  const family = String(ctx.animationFamily || "' + family + '");',
      '  const c0 = hex(palette[0]);',
      '  const c1 = hex(palette[1] || palette[0]);',
      '  const c2 = hex(palette[2] || palette[0]);',
      '  return {',
      '    container,',
      '    tick(ticker) {',
      '      const dt = ticker && typeof ticker.deltaTime === "number" ? ticker.deltaTime : 1;',
      '      phase += dt * 0.04;',
      '      gfx.clear();',
      '      const radius = typeof ctx.radius === "number" ? ctx.radius : 48;',
      '      if (family === "energetic") {',
      '        for (let i = 0; i < 8; i++) {',
      '          const ang = (i / 8) * Math.PI * 2 + phase;',
      '          const dist = radius + 10 + 10 * Math.abs(Math.sin(phase * 2 + i));',
      '          gfx.circle(Math.cos(ang) * dist, Math.sin(ang) * dist, 4).fill({ color: c0, alpha: 0.65 });',
      '        }',
      '      } else if (family === "tropical") {',
      '        for (let i = 0; i < 3; i++) {',
      '          const p = phase + (i * Math.PI * 2) / 3;',
      '          const col = i === 0 ? c0 : (i === 1 ? c1 : c2);',
      '          gfx.circle(0, 0, radius * 0.75 + 10 * Math.abs(Math.sin(p))).stroke({ color: col, width: 2, alpha: 0.45 });',
      '        }',
      '      } else if (family === "bold") {',
      '        const len = radius * 0.8 + 12 * Math.sin(phase);',
      '        for (let i = 0; i < 8; i++) {',
      '          const ang = (i / 8) * Math.PI * 2;',
      '          gfx.moveTo(0, 0).lineTo(Math.cos(ang) * len, Math.sin(ang) * len).stroke({ color: c0, width: 2, alpha: 0.7 });',
      '        }',
      '      } else {',
      '        const p = phase % (Math.PI * 2);',
      '        gfx.circle(0, 0, radius * 0.7 + p * 6).stroke({ color: c1, width: 2, alpha: 0.55 * (1 - p / (Math.PI * 2)) });',
      '      }',
      '    },',
      '    destroy() { container.destroy({ children: true }); }',
      '  };',
      '}',
    ].join('\n');
    return { drinkId: input.drink.id, code };
  }

  async generateImagenAssets(input: ImagenAssetsInput): Promise<ImagenAssetsResult> {
    const assets: ImagenAssetsResult['assets'] = {};
    input.drinks.forEach((drink) => {
      assets[drink.id] = {
        ingredientSprite: { url: null, mimeType: 'image/png' },
        coasterTexture: { url: null, mimeType: 'image/png' },
      };
    });
    return { assets, warnings: ['mock provider does not generate imagen assets'] };
  }
}

// ---- Fixtures and helpers ----

const presetPalettes: Palette[] = [
  { primary: '#FF2A6D', secondary: '#05D9E8', accent: '#D1F7FF', background: '#0D0221', text: '#F5F5F5' },
  { primary: '#C8A951', secondary: '#3C2A21', accent: '#D5B98B', background: '#1A120B', text: '#E5E5CB' },
  { primary: '#2E5F2D', secondary: '#A4DE02', accent: '#76B947', background: '#0E1E0E', text: '#EAF5DC' },
  { primary: '#0099CC', secondary: '#66CCFF', accent: '#FFE066', background: '#001F33', text: '#FFFFFF' },
  { primary: '#FF6B35', secondary: '#FFD23F', accent: '#2EC4B6', background: '#1E1E2E', text: '#FDFFFC' },
  { primary: '#D4AF37', secondary: '#1B1B1B', accent: '#C4B454', background: '#0A0A0A', text: '#F0EAD6' },
];

const animationNames = [
  'Pulse Glitch',
  'Slow Drift',
  'Wave Ripple',
  'Firefly Float',
  'Shimmer Drift',
  'Scanline Scroll',
] as const;
const speeds = ['Slow', 'Moderate', 'Fast'] as const;
const intensities = ['Low', 'Moderate', 'High'] as const;
const glowIntensities = ['VeryLow', 'Low', 'Moderate', 'High', 'Maximum'] as const;
const animationFamilies: AnimationFamily[] = ['energetic', 'elegant', 'tropical', 'bold'];

function buildPlan(id: string, seed: number): DesignPlan {
  const palette = presetPalettes[seed % presetPalettes.length]!;
  const motion: MotionProfile = {
    animation: animationNames[seed % animationNames.length]!,
    speed: speeds[seed % speeds.length]!,
    intensity: intensities[seed % intensities.length]!,
  };
  const lighting: Lighting = {
    glowColor: palette.accent,
    glowIntensity: glowIntensities[seed % glowIntensities.length]!,
  };
  const summaries = [
    'Bold neon contrast with quick pulse motion.',
    'Warm amber lounge palette with slow, elegant drift.',
    'Deep forest tones with shimmering organic motion.',
  ];
  const names = {
    A: 'Conservative/On-Brand',
    B: 'Avant-Garde',
    C: 'Minimalist',
  };
  return {
    id,
    name: names[id as keyof typeof names] ?? `Plan ${id}`,
    summary: summaries[seed % summaries.length]!,
    preview: { palette, motion, lighting },
  };
}

function pickSprite(ingredients: string[], seed: number): string {
  if (ingredients.length === 0) return 'peach';
  return ingredients[seed % ingredients.length]!.toLowerCase().replace(/\s+/g, '_');
}

function mutateThemeConfig(cfg: ThemeConfig, seed: number): ThemeConfig {
  // Cheap deterministic mutation: rotate the palette positions.
  const p = cfg.palette;
  const colors = [p.primary, p.secondary, p.accent, p.background, p.text];
  const rotated = colors.slice(seed % colors.length).concat(colors.slice(0, seed % colors.length));
  return {
    ...cfg,
    palette: {
      primary: rotated[0]!,
      secondary: rotated[1]!,
      accent: rotated[2]!,
      background: rotated[3]!,
      text: rotated[4]!,
    },
    motion: {
      ...cfg.motion,
      speed: speeds[(seed + 1) % speeds.length]!,
    },
  };
}

export function hashSeed(input: unknown): number {
  const h = createHash('sha256').update(JSON.stringify(input)).digest();
  // First 4 bytes as unsigned int
  return h.readUInt32BE(0);
}
