import { prepareCoasterEntrypoint } from '@salet/shared/coaster-entrypoint-core';
import { Application, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import type { AnimationDispatcher } from '../engine/AnimationDispatcher.js';
import { CANVAS_SIZE, COASTER_ANIMATION_SCALE } from '../engine/constants.js';
import { CoasterAnimation } from './CoasterAnimation.js';
import { mountDrinkImageSprite } from './drinkImageSprite.js';
import { IngredientSprite } from './IngredientSprite.js';
import { DrinkCharacterSprite } from './DrinkCharacterSprite.js';

/** Single Pixi Application for the table surface; subscribes to AnimationDispatcher commands. */
export class PixiRuntime {
  private app: Application | null = null;
  private mounted = false;
  private readonly stage = new Container();
  private readonly coasterAnimations = new Map<
    string,
    | { kind: 'fallback'; instance: CoasterAnimation }
    | {
        kind: 'runtime';
        root: Container;
        destroy: () => void;
        tick?: (ticker: Ticker) => void;
      }
  >();
  private readonly sprites = new Map<string, IngredientSprite>();
  private readonly drinkCharacterSprites = new Map<string, DrinkCharacterSprite>();
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly host: HTMLDivElement, private readonly dispatcher: AnimationDispatcher) {}

  async init(): Promise<void> {
    if (this.mounted) return;
    const app = new Application();
    await app.init({
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: 0x0d0d0d,
      antialias: true,
      resolution: 1,
      autoDensity: false,
    });

    this.app = app;
    app.stage.addChild(this.stage);
    this.host.appendChild(app.canvas);
    app.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';

    this.unsubscribe = this.dispatcher.subscribe((cmd) => {
      if (!this.app) return;
      if (cmd.action === 'PLAY') {
        const existing = this.coasterAnimations.get(cmd.coasterId);
        if (existing) {
          if (existing.kind === 'fallback') {
            existing.instance.updatePosition(cmd.position);
          } else {
            existing.root.position.set(cmd.position.x, cmd.position.y);
          }
          return;
        }
        const runtime = cmd.artifact && cmd.themeConfig
          ? createRuntimeCoasterAnimation(cmd.artifact, cmd.profile, cmd.themeConfig)
          : null;
        if (runtime) {
          const root = wrapCoasterWithDrinkLayer(
            runtime.container,
            cmd.position,
            cmd.profile.imageUrl,
          );
          this.stage.addChild(root);
          this.coasterAnimations.set(cmd.coasterId, {
            kind: 'runtime',
            root,
            destroy: runtime.destroy,
            tick: runtime.tick,
          });
        } else {
          const animation = new CoasterAnimation(cmd.profile, cmd.position, cmd.profile.imageUrl);
          animation.mount(this.stage);
          this.coasterAnimations.set(cmd.coasterId, { kind: 'fallback', instance: animation });
        }
      } else if (cmd.action === 'STOP') {
        this.removeCoasterAnimation(cmd.coasterId);
      } else if (cmd.action === 'SPAWN_SPRITE') {
        if (cmd.isDrinkCharacter && cmd.palette && cmd.styleIndex !== undefined) {
          const existing = this.drinkCharacterSprites.get(cmd.coasterId);
          if (existing) return;
          const character = new DrinkCharacterSprite(
            cmd.character,
            cmd.palette,
            cmd.styleIndex,
            cmd.ingredientCount ?? 0
          );
          character.mount(this.stage);
          this.drinkCharacterSprites.set(cmd.coasterId, character);
        } else {
          const existing = this.sprites.get(cmd.coasterId);
          if (existing) return;
          const sprite = new IngredientSprite(cmd.character, cmd.position.x, cmd.position.y);
          sprite.mount(this.stage);
          this.sprites.set(cmd.coasterId, sprite);
        }
      } else if (cmd.action === 'DESPAWN_SPRITE') {
        this.removeSprite(cmd.coasterId);
      }
    });

    app.ticker.add((ticker) => {
      this.coasterAnimations.forEach((entry) => {
        if (entry.kind === 'fallback') {
          entry.instance.tick(ticker);
        } else if (entry.tick) {
          entry.tick(ticker);
        }
      });
      this.sprites.forEach((sprite) => sprite.tick(ticker));
      this.drinkCharacterSprites.forEach((sprite) => sprite.tick(ticker));
    });

    this.mounted = true;
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.clearAllVisuals();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.mounted = false;
  }

  /** Remove all coasters and sprites; keep the Pixi app running for the next theme. */
  reset(): void {
    this.clearAllVisuals();
  }

  private clearAllVisuals(): void {
    this.coasterAnimations.forEach((animation) => {
      if (animation.kind === 'fallback') {
        animation.instance.unmount();
        animation.instance.destroy();
        return;
      }
      if (animation.root.parent) {
        animation.root.parent.removeChild(animation.root);
      }
      animation.destroy();
    });
    this.coasterAnimations.clear();
    this.sprites.forEach((sprite) => {
      sprite.unmount();
      sprite.destroy();
    });
    this.sprites.clear();
    this.drinkCharacterSprites.forEach((sprite) => {
      sprite.unmount();
      sprite.destroy();
    });
    this.drinkCharacterSprites.clear();
  }

  private removeCoasterAnimation(coasterId: string): void {
    const animation = this.coasterAnimations.get(coasterId);
    if (!animation) return;
    if (animation.kind === 'fallback') {
      animation.instance.unmount();
      animation.instance.destroy();
    } else {
      if (animation.root.parent) {
        animation.root.parent.removeChild(animation.root);
      }
      animation.destroy();
    }
    this.coasterAnimations.delete(coasterId);
  }

  private removeSprite(coasterId: string): void {
    const drinkChar = this.drinkCharacterSprites.get(coasterId);
    if (drinkChar) {
      drinkChar.unmount();
      drinkChar.destroy();
      this.drinkCharacterSprites.delete(coasterId);
      return;
    }
    const sprite = this.sprites.get(coasterId);
    if (!sprite) return;
    sprite.unmount();
    sprite.destroy();
    this.sprites.delete(coasterId);
  }
}

function wrapCoasterWithDrinkLayer(
  animContainer: Container,
  position: { x: number; y: number },
  imageUrl?: string | null,
): Container {
  const root = new Container();
  root.position.set(position.x, position.y);
  const animLayer = new Container();
  animLayer.scale.set(COASTER_ANIMATION_SCALE);
  animContainer.position.set(0, 0);
  animLayer.addChild(animContainer);
  root.addChild(animLayer);
  if (imageUrl) {
    void mountDrinkImageSprite(root, imageUrl, 0);
  }
  return root;
}

function createRuntimeCoasterAnimation(
  artifact: { entrypoint: string },
  profile: { id: string; colorPalette: string[]; imageUrl?: string | null; animationFamily?: string },
  themeConfig: { palette: { primary: string; secondary: string; accent: string; background: string; text: string }; motion: { speed: string; intensity: string } },
): { container: Container; destroy: () => void; tick?: (ticker: Ticker) => void } | null {
  try {
    const ctx = {
      radius: 48,
      colors: profile.colorPalette,
      palette: themeConfig.palette,
      speed: themeConfig.motion.speed,
      intensity: themeConfig.motion.intensity,
      drinkId: profile.id,
      animationFamily: profile.animationFamily,
    };
    const script = prepareCoasterEntrypoint(artifact.entrypoint);
    const factory = new Function('PIXI', 'ctx', script);
    const createFn = factory({ Container, Graphics, Sprite, Texture, Ticker }, ctx);
    if (typeof createFn !== 'function') {
      return null;
    }
    const instance = createFn({ Container, Graphics, Sprite, Texture, Ticker }, ctx);
    if (!instance || !instance.container || typeof instance.destroy !== 'function') {
      return null;
    }
    return instance;
  } catch {
    return null;
  }
}
