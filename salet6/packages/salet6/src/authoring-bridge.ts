/**
 * Vite module loaded by packages/salet6/index.html.
 * Exposes shared prompt builders and Pixi preview coaster mounting on window.Salet6Authoring.
 */
import {
  buildGeneratePlansPrompt,
  buildSelectPlanPrompt,
} from '@salet/shared';
import { prepareCoasterEntrypoint } from '@salet/shared/coaster-entrypoint-core';
import { Application, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';

export { buildGeneratePlansPrompt, buildSelectPlanPrompt, prepareCoasterEntrypoint };

export interface PreviewCoasterCtx {
  radius: number;
  colors: string[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  speed: string;
  intensity: string;
  drinkId: string;
  animationFamily?: string;
}

export interface PreviewCoasterMount {
  destroy: () => void;
}

const PIXI = { Container, Graphics, Sprite, Texture, Ticker };

/**
 * Mount generated coaster Pixi code into a preview spot element.
 * Mirrors display-app-stub PixiRuntime createRuntimeCoasterAnimation pattern.
 */
export function mountPreviewCoaster(
  spotEl: HTMLElement,
  code: string,
  ctx: PreviewCoasterCtx,
): PreviewCoasterMount | null {
  try {
    const canvasHost = spotEl.querySelector('.coaster-pixi-host') as HTMLElement | null;
    if (!canvasHost) return null;

    const script = prepareCoasterEntrypoint(code);
    const factory = new Function('PIXI', 'ctx', script) as (
      pixi: typeof PIXI,
      c: PreviewCoasterCtx,
    ) => (pixi: typeof PIXI, c: PreviewCoasterCtx) => {
      container: Container;
      destroy: () => void;
      tick?: (ticker: Ticker) => void;
    } | null;

    const createFn = factory(PIXI, ctx);
    if (typeof createFn !== 'function') return null;

    const instance = createFn(PIXI, ctx);
    if (!instance?.container || typeof instance.destroy !== 'function') return null;

    const size = spotEl.clientWidth || 68;
    const app = new Application();
    let tickerBound = false;

    void app
      .init({
        width: size,
        height: size,
        backgroundAlpha: 0,
        antialias: true,
      })
      .then(() => {
        canvasHost.innerHTML = '';
        canvasHost.appendChild(app.canvas as HTMLCanvasElement);

        const root = new Container();
        app.stage.addChild(root);

        const scale = (size * 0.85) / (ctx.radius * 2);
        instance.container.scale.set(scale);
        instance.container.position.set(size / 2, size / 2);
        root.addChild(instance.container);

        if (typeof instance.tick === 'function' && !tickerBound) {
          tickerBound = true;
          app.ticker.add((t) => instance.tick!(t));
        }
      });

    return {
      destroy: () => {
        try {
          instance.destroy();
        } catch {
          /* ignore */
        }
        try {
          app.destroy(true, { children: true });
        } catch {
          /* ignore */
        }
        canvasHost.innerHTML = '';
      },
    };
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    Salet6Authoring?: {
      buildGeneratePlansPrompt: typeof buildGeneratePlansPrompt;
      buildSelectPlanPrompt: typeof buildSelectPlanPrompt;
      prepareCoasterEntrypoint: typeof prepareCoasterEntrypoint;
      mountPreviewCoaster: typeof mountPreviewCoaster;
    };
  }
}

window.Salet6Authoring = {
  buildGeneratePlansPrompt,
  buildSelectPlanPrompt,
  prepareCoasterEntrypoint,
  mountPreviewCoaster,
};

window.dispatchEvent(new CustomEvent('salet6-authoring-ready'));
