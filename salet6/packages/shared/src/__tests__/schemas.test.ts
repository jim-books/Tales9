import { describe, it, expect } from 'vitest';
import {
  Palette,
  ThemeConfig,
  ThemePackage,
  DraftDrink,
  DesignPlan,
  Asset,
  Draft,
  validateThemePackage,
} from '../schemas.js';
import { validateMessage, ApplyTheme, ClientHello } from '../messages.js';

const validPalette = {
  primary: '#112233',
  secondary: '#445566',
  accent: '#778899',
  background: '#000000',
  text: '#ffffff',
};

const validThemeConfig = {
  palette: validPalette,
  motion: { animation: 'Pulse Glitch', speed: 'Slow', intensity: 'Low' },
  lighting: { glowColor: '#aabbcc', glowIntensity: 'Moderate' },
};

const validDrinkProfile = {
  id: 'd1',
  name: 'Test',
  category: 'CLASSICS' as const,
  price: 100,
  flavorProfile: 'Fizzy/Sour',
  ingredients: ['Gin', 'Lemon'],
  animationFamily: 'energetic' as const,
  colorPalette: ['#aaaaaa', '#bbbbbb', '#cccccc'] as [string, string, string],
  spriteCharacter: 'peach',
  description: 'Test drink.',
};

const validThemePackage = {
  packageVersion: '1.0.0',
  themeConfig: validThemeConfig,
  drinkProfiles: [validDrinkProfile],
  createdAt: new Date().toISOString(),
};

describe('Palette', () => {
  it('accepts valid hex colors', () => {
    expect(Palette.safeParse(validPalette).success).toBe(true);
  });

  it('rejects 3-digit hex', () => {
    expect(Palette.safeParse({ ...validPalette, primary: '#abc' }).success).toBe(false);
  });

  it('rejects non-hex string', () => {
    expect(Palette.safeParse({ ...validPalette, primary: 'red' }).success).toBe(false);
  });
});

describe('ThemeConfig', () => {
  it('accepts a valid config', () => {
    expect(ThemeConfig.safeParse(validThemeConfig).success).toBe(true);
  });

  it('rejects an unknown animation name', () => {
    const bad = {
      ...validThemeConfig,
      motion: { ...validThemeConfig.motion, animation: 'Discotech' },
    };
    expect(ThemeConfig.safeParse(bad).success).toBe(false);
  });

  it('accepts perDrinkOverrides', () => {
    const cfg = {
      ...validThemeConfig,
      perDrinkOverrides: {
        d1: { spriteCharacter: 'peach', palette: { primary: '#111111' } },
      },
    };
    expect(ThemeConfig.safeParse(cfg).success).toBe(true);
  });
});

describe('ThemePackage', () => {
  it('round-trips through JSON', () => {
    const json = JSON.parse(JSON.stringify(validThemePackage));
    const result = validateThemePackage(json);
    expect(result.success).toBe(true);
  });

  it('requires ISO createdAt', () => {
    const bad = { ...validThemePackage, createdAt: 'yesterday' };
    expect(validateThemePackage(bad).success).toBe(false);
  });

  it('accepts a runtimeArtifacts.coasterAnimations record', () => {
    const pkg = {
      ...validThemePackage,
      runtimeArtifacts: {
        coasterAnimations: {
          d1: { artifactType: 'pixiCode' as const, entrypoint: 'export default ()=>{}', checksum: 'abc' },
        },
      },
    };
    expect(validateThemePackage(pkg).success).toBe(true);
  });
});

describe('DraftDrink', () => {
  it('requires non-empty name and id', () => {
    expect(DraftDrink.safeParse({ id: '', name: '', ingredients: [] }).success).toBe(false);
    expect(DraftDrink.safeParse({ id: '1', name: 'X', ingredients: [] }).success).toBe(true);
  });
});

describe('DesignPlan', () => {
  it('requires name plus preview', () => {
    const base = { id: 'A', name: 'Conservative/On-Brand', summary: 's', preview: validThemeConfig };
    expect(DesignPlan.safeParse(base).success).toBe(true);
    expect(DesignPlan.safeParse({ id: 'A', summary: 's', preview: validThemeConfig }).success).toBe(false);
  });
});

describe('Asset', () => {
  it('round-trips with optional fields', () => {
    const a = {
      id: 'a1',
      type: 'logo' as const,
      mimeType: 'image/png',
      storageRef: '/uploads/a1.png',
      createdAt: new Date().toISOString(),
    };
    expect(Asset.safeParse(a).success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const a = {
      id: 'a1',
      type: 'mystery',
      mimeType: 'image/png',
      storageRef: '/x',
      createdAt: new Date().toISOString(),
    };
    expect(Asset.safeParse(a).success).toBe(false);
  });
});

describe('Draft', () => {
  it('accepts a minimal CONCEPT draft', () => {
    const now = new Date().toISOString();
    const d = {
      id: 'd1',
      createdAt: now,
      updatedAt: now,
      step: 'CONCEPT' as const,
      brandDescription: '',
      drinks: [],
    };
    expect(Draft.safeParse(d).success).toBe(true);
  });
});

describe('Bridge messages', () => {
  it('parses a valid CLIENT_HELLO', () => {
    expect(ClientHello.safeParse({ type: 'CLIENT_HELLO', role: 'authoring' }).success).toBe(true);
  });

  it('parses a valid APPLY_THEME', () => {
    const msg = { type: 'APPLY_THEME', requestId: 'r1', themePackage: validThemePackage };
    expect(ApplyTheme.safeParse(msg).success).toBe(true);
  });

  it('discriminated union dispatches by type', () => {
    const ack = validateMessage({ type: 'APPLY_THEME_ACK', requestId: 'r1', ok: true });
    expect(ack.success).toBe(true);
    const unknown = validateMessage({ type: 'NOT_A_MESSAGE' });
    expect(unknown.success).toBe(false);
  });
});
