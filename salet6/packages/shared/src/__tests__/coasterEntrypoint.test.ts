import { describe, it, expect } from 'vitest';
import {
  prepareCoasterEntrypoint,
  typescriptToRunnableJs,
  buildCoasterFactoryReturn,
} from '../coasterEntrypoint.js';

describe('typescriptToRunnableJs', () => {
  it('strips export and return types from Poe-style functions', () => {
    const src = `export function createNeonBlade6(PIXI: any, ctx: any): { container: any; destroy: () => void } {
  const container = new PIXI.Container();
  return { container, destroy() {} };
}`;
    const js = typescriptToRunnableJs(src);
    expect(js).not.toMatch(/\bexport\b/);
    expect(js).not.toMatch(/:\s*any\b/);
    expect(js).not.toContain('destroy: ()');
    expect(js).toContain('function createNeonBlade6(PIXI, ctx)');
    expect(() => new Function(js)).not.toThrow();
  });

  it('removes `as` casts without breaking ternaries', () => {
    const src = `function demo(PIXI, ctx) {
  const x = cond ? a : b;
  const g = foo as any;
}`;
    const js = typescriptToRunnableJs(src);
    expect(js).toContain('cond ? a : b');
    expect(js).not.toMatch(/\sas\s/);
    expect(() => new Function(js)).not.toThrow();
  });

  it('unwraps mock leading return function', () => {
    const src = `return function mountCoaster(PIXI, ctx) {
  return { container: {}, destroy() {} };
};`;
    const js = typescriptToRunnableJs(src);
    expect(js.startsWith('function mountCoaster')).toBe(true);
  });
});

describe('buildCoasterFactoryReturn', () => {
  it('resolves drink-specific factory names', () => {
    const js = 'function createChromeFlux2(PIXI, ctx) { return { container: {}, destroy() {} }; }';
    const ret = buildCoasterFactoryReturn(js);
    expect(ret).toContain('createChromeFlux2');
    expect(ret).toContain('mountCoaster');
  });
});

describe('prepareCoasterEntrypoint', () => {
  it('transpiles inline ctx object types via esbuild', () => {
    const src = `export function createPixiCoasterPulseGlitch(
  PIXI: any,
  ctx: {
    radius?: number;
    colors?: Partial<{ primary: string }>;
  }
): { container: any; destroy: () => void } {
  const container = new PIXI.Container();
  const t = ctx.speed === "Fast" ? 3 : 5;
  return { container, destroy() { container.destroy({ children: true }); } };
}`;
    const prepared = prepareCoasterEntrypoint(src);
    expect(() => new Function('PIXI', 'ctx', prepared)).not.toThrow();
    expect(prepared).toContain('createPixiCoasterPulseGlitch');
  });

  it('evaluates and returns a factory for Poe-style code', () => {
    const prepared = prepareCoasterEntrypoint(`export function createTestDrink(PIXI: any, ctx: any): { container: any; destroy: () => void } {
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
      gfx.circle(0, 0, 40 + phase).stroke({ color: 0xff00ff, width: 2, alpha: 0.7 });
    },
    destroy() { container.destroy({ children: true }); },
  };
}`);
    const PIXI = {
      Container: class {
        children: unknown[] = [];
        addChild(c: unknown) {
          this.children.push(c);
        }
        destroy() {}
      },
      Graphics: class {
        clear() {}
        circle() {
          return this;
        }
        stroke() {
          return this;
        }
      },
    };
    const factory = new Function('PIXI', 'ctx', prepared);
    const createFn = factory(PIXI, { radius: 48, colors: ['#ff00ff', '#00ff00', '#0000ff'] });
    expect(typeof createFn).toBe('function');
    const instance = createFn(PIXI, { radius: 48 });
    expect(instance.container).toBeTruthy();
    expect(typeof instance.destroy).toBe('function');
  });
});
