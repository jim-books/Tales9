import { describe, it, expect } from 'vitest';
import { MockProvider } from '../providers/mock.js';
import { selectProvider } from '../providers/index.js';

const sampleThemeConfig = {
  palette: {
    primary: '#FF2A6D',
    secondary: '#05D9E8',
    accent: '#D1F7FF',
    background: '#0D0221',
    text: '#F5F5F5',
  },
  motion: { animation: 'Pulse Glitch' as const, speed: 'Fast' as const, intensity: 'High' as const },
  lighting: { glowColor: '#D1F7FF', glowIntensity: 'High' as const },
};

describe('MockProvider.generatePlans', () => {
  it('returns 3 plans labeled A/B/C', async () => {
    const p = new MockProvider();
    const res = await p.generatePlans({ brandDescription: 'a dim jazz lounge', drinks: [] });
    expect(res.plans.map((x) => x.id)).toEqual(['A', 'B', 'C']);
    expect(res.promptUsed).toContain('a dim jazz lounge');
    for (const plan of res.plans) {
      expect(plan.preview.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(plan.name.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for identical inputs', async () => {
    const p = new MockProvider();
    const a = await p.generatePlans({ brandDescription: 'same', drinks: [] });
    const b = await p.generatePlans({ brandDescription: 'same', drinks: [] });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('varies output for different brand descriptions', async () => {
    const p = new MockProvider();
    const a = await p.generatePlans({ brandDescription: 'cyberpunk neon', drinks: [] });
    const b = await p.generatePlans({ brandDescription: 'amber jazz lounge', drinks: [] });
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });
});

describe('MockProvider.selectPlan', () => {
  it('returns themeConfig + asset prompts', async () => {
    const p = new MockProvider();
    const out = await p.selectPlan({
      selectedPlan: {
        id: 'A',
        name: 'Conservative/On-Brand',
        summary: 'Test',
        preview: sampleThemeConfig,
      },
      drinks: [
        { id: 'd1', name: 'Sour', ingredients: ['Gin', 'Lemon'] },
        { id: 'd2', name: 'Pisco', ingredients: ['Pisco', 'Pineapple'] },
      ],
    });
    expect(out.themeConfig.palette.primary).toBe(sampleThemeConfig.palette.primary);
    expect(Object.keys(out.assetPrompts)).toHaveLength(2);
    expect(out.animationConcept.length).toBeGreaterThan(0);
    expect(out.promptUsed).toContain('Conservative/On-Brand');
  });
});

describe('MockProvider.applyNL', () => {
  it('returns a valid ThemeConfig shape', async () => {
    const p = new MockProvider();
    const next = await p.applyNL({ themeConfig: sampleThemeConfig, prompt: 'make it warmer' });
    expect(next.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(next.palette.text).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('selectProvider', () => {
  it('returns mock by default', () => {
    expect(selectProvider({}).name).toBe('mock');
  });

  it('returns mock when PROVIDER=mock', () => {
    expect(selectProvider({ PROVIDER: 'mock' }).name).toBe('mock');
  });

  it('throws when PROVIDER=poe and POE_API_KEY is missing', () => {
    expect(() => selectProvider({ PROVIDER: 'poe' })).toThrow(/POE_API_KEY/);
  });

  it('returns poe when both env vars are set', () => {
    expect(selectProvider({ PROVIDER: 'poe', POE_API_KEY: 'sk-test' }).name).toBe('poe');
  });
});
