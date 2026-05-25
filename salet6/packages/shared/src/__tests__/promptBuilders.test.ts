import { describe, expect, it } from 'vitest';
import { buildGeneratePlansPrompt, buildSelectPlanPrompt } from '../promptBuilders.js';

describe('promptBuilders', () => {
  const drinks = [
    { id: 'd1', name: 'Negroni', ingredients: ['Gin', 'Campari'] },
    { id: 'd2', name: 'Mojito', ingredients: ['Rum', 'Mint'] },
  ];

  it('buildGeneratePlansPrompt includes brand, preset, and drink names', () => {
    const prompt = buildGeneratePlansPrompt({
      brandDescription: 'Neon jazz lounge',
      preset: 'jazz',
      drinks,
    });
    expect(prompt).toContain('Neon jazz lounge');
    expect(prompt).toContain('Preset (optional): jazz');
    expect(prompt).toContain('Negroni, Mojito');
    expect(prompt).toContain('Plan A must be conservative/on-brand');
  });

  it('buildGeneratePlansPrompt omits preset when absent', () => {
    const prompt = buildGeneratePlansPrompt({
      brandDescription: 'Ocean bar',
      drinks,
    });
    expect(prompt).toContain('Preset (optional): null');
  });

  it('buildSelectPlanPrompt includes plan JSON and drink menu', () => {
    const selectedPlan = {
      id: 'A',
      name: 'Conservative/On-Brand',
      summary: 'Warm palette',
      preview: {
        palette: {
          primary: '#111111',
          secondary: '#222222',
          accent: '#333333',
          background: '#000000',
          text: '#ffffff',
        },
        motion: { animation: 'Slow Drift', speed: 'Slow', intensity: 'Low' },
        lighting: { glowColor: '#111111', glowIntensity: 'Low' },
      },
    };
    const prompt = buildSelectPlanPrompt({ selectedPlan, drinks });
    expect(prompt).toContain('Conservative/On-Brand');
    expect(prompt).toContain('"d1"');
    expect(prompt).toContain('ingredientSpritePrompt');
  });
});
