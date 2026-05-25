import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { createApp } from '../app.js';
import { MockProvider } from '../providers/mock.js';

const provider = new MockProvider();
const uploadsDir = mkdtempSync(path.join(tmpdir(), 'salet6-uploads-'));
const app = createApp({ provider, uploadsDir });

const sampleThemeConfig = {
  palette: {
    primary: '#FF2A6D',
    secondary: '#05D9E8',
    accent: '#D1F7FF',
    background: '#0D0221',
    text: '#F5F5F5',
  },
  motion: { animation: 'Pulse Glitch', speed: 'Fast', intensity: 'High' },
  lighting: { glowColor: '#D1F7FF', glowIntensity: 'High' },
};

describe('GET /api/health', () => {
  it('returns ok with provider name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.provider).toBe('mock');
  });
});

describe('POST /api/generate-plans', () => {
  it('returns 3 plans for valid input', async () => {
    const res = await request(app).post('/api/generate-plans').send({
      brandDescription: 'cyberpunk neon',
      drinks: [],
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.plans).toHaveLength(3);
    expect(res.body.data.promptUsed).toContain('cyberpunk neon');
  });

  it('rejects invalid body with 400', async () => {
    const res = await request(app).post('/api/generate-plans').send({ brandDescription: 5 });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.errorCode).toBe('INVALID_BODY');
  });
});

describe('POST /api/select-plan', () => {
  it('returns themeConfig + asset prompts', async () => {
    const res = await request(app).post('/api/select-plan').send({
      selectedPlan: {
        id: 'A',
        name: 'Conservative/On-Brand',
        summary: 'test',
        preview: sampleThemeConfig,
      },
      drinks: [{ id: 'd1', name: 'Sour', ingredients: ['Gin'] }],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.themeConfig.palette.primary).toBe(sampleThemeConfig.palette.primary);
    expect(res.body.data.assetPrompts.d1.ingredientSpritePrompt).toBeTruthy();
    expect(res.body.data.promptUsed).toContain('Conservative/On-Brand');
  });

  it('rejects when selectedPlan is missing', async () => {
    const res = await request(app).post('/api/select-plan').send({
      drinks: [],
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/nl-edit', () => {
  it('returns a mutated ThemeConfig', async () => {
    const res = await request(app).post('/api/nl-edit').send({
      themeConfig: sampleThemeConfig,
      prompt: 'make it more vibrant',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('POST /api/generate-coaster-animation', () => {
  it('returns code for a drink', async () => {
    const res = await request(app).post('/api/generate-coaster-animation').send({
      themeConfig: sampleThemeConfig,
      radius: 48,
      drink: { id: 'd1', name: 'Sour', ingredients: ['Gin'] },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.drinkId).toBe('d1');
    expect(typeof res.body.data.code).toBe('string');
  });
});

describe('POST /api/generate-imagen-assets', () => {
  it('returns assets record keyed by drink id', async () => {
    const res = await request(app).post('/api/generate-imagen-assets').send({
      themeConfig: sampleThemeConfig,
      assetPrompts: {
        d1: { ingredientSpritePrompt: 'sprite', coasterTexturePrompt: 'coaster' },
      },
      drinks: [{ id: 'd1', name: 'Sour', ingredients: ['Gin'] }],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.assets.d1).toBeTruthy();
  });
});

describe('GET /api/asset-proxy', () => {
  it('rejects non-http(s) urls', async () => {
    const res = await request(app).get('/api/asset-proxy').query({ url: 'file:///etc/passwd' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/compile-runtime', () => {
  it('returns a valid ThemePackage with runtime artifacts', async () => {
    const res = await request(app).post('/api/compile-runtime').send({
      selectedPlanId: 'A',
      themeConfig: sampleThemeConfig,
      drinks: [{ id: 'd1', name: 'Test', ingredients: ['Gin'] }],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.packageVersion).toBe('1.0.0');
    expect(res.body.data.drinkProfiles).toHaveLength(1);
    expect(res.body.data.runtimeArtifacts.coasterAnimations.d1.artifactType).toBe('pixiCode');
    expect(res.body.data.runtimeArtifacts.coasterAnimations.d1.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('POST /api/assets', () => {
  const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const SVG_BYTES = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');

  it('accepts a valid PNG logo upload', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'logo')
      .attach('file', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('logo');
    expect(res.body.data.mimeType).toBe('image/png');
    const files = await readdir(uploadsDir);
    expect(files.some((f) => f.endsWith('.png'))).toBe(true);
  });

  it('accepts a valid JPEG icon upload', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'icon')
      .attach('file', JPEG_BYTES, { filename: 'a.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('icon');
  });

  it('accepts a valid SVG upload', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'logo')
      .attach('file', SVG_BYTES, { filename: 'a.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(200);
    expect(res.body.data.mimeType).toBe('image/svg+xml');
  });

  it('rejects an unsupported MIME', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'logo')
      .attach('file', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.errorCode).toBe('UNSUPPORTED_MIME');
  });

  it('rejects mismatched magic bytes (PNG MIME, JPEG bytes)', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'logo')
      .attach('file', JPEG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(415);
    expect(res.body.errorCode).toBe('MAGIC_BYTES_MISMATCH');
  });

  it('rejects missing file field', async () => {
    const res = await request(app).post('/api/assets').field('type', 'logo');
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('NO_FILE');
  });

  it('rejects invalid asset type', async () => {
    const res = await request(app)
      .post('/api/assets')
      .field('type', 'mystery')
      .attach('file', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_TYPE');
  });
});
