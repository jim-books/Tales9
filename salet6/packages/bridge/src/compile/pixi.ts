import { createHash } from 'node:crypto';
import { prepareCoasterEntrypoint } from '@salet/shared/coaster-entrypoint';
import type {
  ThemeConfig,
  ThemePackage,
  DrinkProfile,
  CoasterRuntimeArtifact,
  DraftDrink,
  DrinkCategory,
  AnimationFamily,
} from '@salet/shared';

export interface CompileInput {
  selectedPlanId: string;
  themeConfig: ThemeConfig;
  drinks: DraftDrink[];
  drinkProfiles?: DrinkProfile[];
  coasterAnimations?: Record<string, CoasterRuntimeArtifact>;
  imageUrls?: Record<string, string>;
  packageVersion?: string;
}

/**
 * Builds the final ThemePackage handed to the table runtime via WebSocket APPLY_THEME.
 * Merges LLM-generated coaster code (when present) with drink profiles and checksums.
 * Falls back to deterministic Pixi stub strings per drink when no codegen artifact exists.
 */
export function compileThemePackage(input: CompileInput): ThemePackage {
  const drinkProfiles = mergeImageUrlsIntoDrinkProfiles(
    input.drinkProfiles?.length ? input.drinkProfiles : buildDrinkProfiles(input.drinks, input.themeConfig),
    input.imageUrls,
  );
  const coasterAnimations: Record<string, CoasterRuntimeArtifact> = {};
  for (const profile of drinkProfiles) {
    const provided = input.coasterAnimations?.[profile.id];
    const rawSource = provided?.entrypoint ?? renderCoasterStub(profile, input.themeConfig);
    const entrypoint = prepareCoasterEntrypoint(rawSource);
    const checksum = sha256(entrypoint);
    coasterAnimations[profile.id] = {
      artifactType: 'pixiCode',
      entrypoint,
      checksum,
      sourceRef: provided?.sourceRef,
    };
  }

  const themePackage: ThemePackage = {
    packageVersion: input.packageVersion ?? '1.0.0',
    themeConfig: input.themeConfig,
    drinkProfiles,
    runtimeArtifacts: { coasterAnimations },
    createdAt: new Date().toISOString(),
  };
  themePackage.checksum = sha256(JSON.stringify({
    themeConfig: themePackage.themeConfig,
    drinkProfiles: themePackage.drinkProfiles,
    runtimeArtifacts: themePackage.runtimeArtifacts,
  }));
  return themePackage;
}

function renderCoasterStub(profile: DrinkProfile, theme: ThemeConfig): string {
  const palette = profile.colorPalette.join(', ');
  return [
    `// coaster animation stub for ${profile.id} (${profile.name})`,
    `// family=${profile.animationFamily} motion=${theme.motion.animation}/${theme.motion.speed}/${theme.motion.intensity}`,
    `// glow=${theme.lighting.glowColor}/${theme.lighting.glowIntensity} palette=[${palette}]`,
    `export default function mountCoaster(PIXI, ctx) {`,
    `  const { Container, Graphics } = PIXI;`,
    `  const container = new Container();`,
    `  const gfx = new Graphics();`,
    `  container.addChild(gfx);`,
    `  let phase = 0;`,
    `  const hex = (v) => Number.parseInt(String(v || '#ffffff').replace('#',''), 16);`,
    `  const colors = Array.isArray(ctx && ctx.colors) ? ctx.colors : [];`,
    `  const c0 = hex(colors[0] || '${profile.colorPalette[0]}');`,
    `  const c1 = hex(colors[1] || '${profile.colorPalette[1]}');`,
    `  const c2 = hex(colors[2] || '${profile.colorPalette[2]}');`,
    `  const family = String((ctx && ctx.animationFamily) || '${profile.animationFamily}');`,
    `  return {`,
    `    container,`,
    `    tick(ticker) {`,
    `      const dt = ticker && typeof ticker.deltaTime === 'number' ? ticker.deltaTime : 1;`,
    `      phase += dt * 0.04;`,
    `      gfx.clear();`,
    `      const radius = (ctx && typeof ctx.radius === 'number' ? ctx.radius : 48);`,
    `      if (family === 'energetic') {`,
    `        for (let i = 0; i < 8; i++) {`,
    `          const ang = (i / 8) * Math.PI * 2 + phase;`,
    `          const dist = radius + 10 + 10 * Math.abs(Math.sin(phase * 2 + i));`,
    `          const x = Math.cos(ang) * dist;`,
    `          const y = Math.sin(ang) * dist;`,
    `          gfx.circle(x, y, 3 + 2 * Math.abs(Math.sin(phase + i))).fill({ color: c0, alpha: 0.65 });`,
    `        }`,
    `      } else if (family === 'tropical') {`,
    `        for (let i = 0; i < 3; i++) {`,
    `          const p = phase + (i * Math.PI * 2) / 3;`,
    `          const r = radius * 0.75 + 10 * Math.abs(Math.sin(p));`,
    `          const col = i === 0 ? c0 : (i === 1 ? c1 : c2);`,
    `          gfx.circle(0, 0, r).stroke({ color: col, width: 2, alpha: 0.45 });`,
    `        }`,
    `      } else if (family === 'bold') {`,
    `        const len = radius * 0.8 + 12 * Math.sin(phase);`,
    `        for (let i = 0; i < 8; i++) {`,
    `          const ang = (i / 8) * Math.PI * 2;`,
    `          gfx.moveTo(0, 0).lineTo(Math.cos(ang) * len, Math.sin(ang) * len).stroke({ color: c0, width: 2, alpha: 0.7 });`,
    `        }`,
    `      } else {`,
    `        const p = phase % (Math.PI * 2);`,
    `        const r = radius * 0.7 + p * 6;`,
    `        const a = 0.55 * (1 - p / (Math.PI * 2));`,
    `        gfx.circle(0, 0, r).stroke({ color: c1, width: 2, alpha: a });`,
    `      }`,
    `    },`,
    `    destroy() { container.destroy({ children: true }); },`,
    `  };`,
    `}`,
  ].join('\n');
}

function buildDrinkProfiles(
  drinks: DraftDrink[],
  theme: ThemeConfig,
): DrinkProfile[] {
  return drinks.map((drink, idx) => {
    const category: DrinkCategory = 'CLASSICS';
    const families: AnimationFamily[] = ['energetic', 'elegant', 'tropical', 'bold'];
    const family: AnimationFamily = families[idx % families.length] ?? 'elegant';
    const [primary, secondary, accent] = [
      theme.palette.primary,
      theme.palette.secondary,
      theme.palette.accent,
    ];
    const profile: DrinkProfile = {
      id: drink.id,
      name: drink.name,
      category,
      price: 120 + idx * 2,
      flavorProfile: 'Signature',
      ingredients: drink.ingredients,
      animationFamily: family,
      colorPalette: [primary, secondary, accent],
      spriteCharacter: slugify(drink.ingredients[0] || drink.name) || 'sprite',
      description: `${drink.name} — generated profile from draft drink.`,
    };
    return profile;
  });
}

function mergeImageUrlsIntoDrinkProfiles(
  profiles: DrinkProfile[],
  imageUrls: Record<string, string> | undefined,
): DrinkProfile[] {
  if (!imageUrls) return profiles;
  let changed = false;
  const next = profiles.map((p) => {
    if (p.imageUrl) return p;
    const url = imageUrls[p.id];
    if (!url) return p;
    changed = true;
    return { ...p, imageUrl: url };
  });
  return changed ? next : profiles;
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
