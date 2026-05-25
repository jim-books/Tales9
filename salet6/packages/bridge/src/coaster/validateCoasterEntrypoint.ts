import { prepareCoasterEntrypoint } from '@salet/shared/coaster-entrypoint';

export interface CoasterValidationResult {
  ok: boolean;
  prepared?: string;
  error?: string;
}

/** Minimal Pixi stand-ins so bridge can dry-run LLM output before compile. */
function createMockPixi(): {
  Container: new () => MockContainer;
  Graphics: new () => MockGraphics;
  Sprite: new () => MockSprite;
  Texture: { from: () => object };
  Ticker: { shared: { add: () => void } };
} {
  class MockGraphics {
    circle(): this {
      return this;
    }
    stroke(): this {
      return this;
    }
    fill(): this {
      return this;
    }
    moveTo(): this {
      return this;
    }
    lineTo(): this {
      return this;
    }
    clear(): void {}
  }
  class MockContainer {
    position = { set: () => {} };
    addChild(): void {}
    destroy(): void {}
  }
  class MockSprite {
    anchor = { set: () => {} };
    scale = { set: () => {} };
    position = { set: () => {} };
  }
  return {
    Container: MockContainer,
    Graphics: MockGraphics,
    Sprite: MockSprite,
    Texture: { from: () => ({}) },
    Ticker: { shared: { add: () => {} } },
  };
}

const DEFAULT_CTX = {
  radius: 48,
  colors: ['#2ecc71', '#1a5c2a', '#7dffb3'],
  palette: {
    primary: '#2ecc71',
    secondary: '#1a5c2a',
    accent: '#7dffb3',
    background: '#0a120e',
    text: '#c8e6d0',
  },
  speed: 'Slow',
  intensity: 'Moderate',
  drinkId: 'validate-drink',
  animationFamily: 'elegant',
};

/**
 * Validates raw LLM coaster code the same way the display stub runs it:
 * prepareCoasterEntrypoint → new Function → factory → instance shape.
 */
export function validateCoasterEntrypoint(rawCode: string): CoasterValidationResult {
  if (!rawCode?.trim()) {
    return { ok: false, error: 'empty code' };
  }
  let prepared: string;
  try {
    prepared = prepareCoasterEntrypoint(rawCode);
  } catch (err) {
    return { ok: false, error: `prepare failed: ${(err as Error).message}` };
  }
  if (!/function\s+mountCoaster\s*\(/.test(prepared)) {
    return { ok: false, error: 'prepared script missing mountCoaster' };
  }
  try {
    const PIXI = createMockPixi();
    const factory = new Function('PIXI', 'ctx', prepared) as (
      pixi: ReturnType<typeof createMockPixi>,
      ctx: typeof DEFAULT_CTX,
    ) => unknown;
    const createFn = factory(PIXI, DEFAULT_CTX);
    if (typeof createFn !== 'function') {
      return { ok: false, error: 'script did not return mountCoaster factory function' };
    }
    const instance = (createFn as (pixi: ReturnType<typeof createMockPixi>, ctx: typeof DEFAULT_CTX) => {
      container?: MockContainer;
      destroy?: () => void;
      tick?: (t: { deltaTime: number }) => void;
    })(PIXI, DEFAULT_CTX);
    if (!instance?.container) {
      return { ok: false, error: 'instance missing container' };
    }
    if (typeof instance.destroy !== 'function') {
      return { ok: false, error: 'instance missing destroy()' };
    }
    if (typeof instance.tick === 'function') {
      instance.tick({ deltaTime: 1 });
    }
    instance.destroy();
    return { ok: true, prepared };
  } catch (err) {
    return { ok: false, error: `runtime dry-run failed: ${(err as Error).message}` };
  }
}
