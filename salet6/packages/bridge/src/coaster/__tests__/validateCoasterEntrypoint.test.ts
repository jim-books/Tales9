import { describe, expect, it } from 'vitest';
import { validateCoasterEntrypoint } from '../validateCoasterEntrypoint.js';

const VALID = `
function mountCoaster(PIXI, ctx) {
  const { Container, Graphics } = PIXI;
  const container = new Container();
  const gfx = new Graphics();
  container.addChild(gfx);
  let phase = 0;
  return {
    container,
    tick(ticker) {
      phase += ticker.deltaTime * 0.04;
      gfx.clear();
      gfx.circle(0, 0, 40).stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
    },
    destroy() { container.destroy({ children: true }); },
  };
}
`;

describe('validateCoasterEntrypoint', () => {
  it('accepts valid mountCoaster script', () => {
    const result = validateCoasterEntrypoint(VALID);
    expect(result.ok).toBe(true);
    expect(result.prepared).toContain('mountCoaster');
  });

  it('rejects empty code', () => {
    expect(validateCoasterEntrypoint('').ok).toBe(false);
  });

  it('accepts Poe-style ```javascript fence after partial backtick strip', () => {
    const poeBroken = 'javascript\n' + VALID.trim();
    const result = validateCoasterEntrypoint(poeBroken);
    expect(result.ok).toBe(true);
  });

  it('rejects script without container', () => {
    const bad = `
function mountCoaster(PIXI, ctx) {
  return { destroy() {} };
}
`;
    expect(validateCoasterEntrypoint(bad).ok).toBe(false);
  });
});
