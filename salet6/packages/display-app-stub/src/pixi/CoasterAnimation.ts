import { Container, Graphics, type Ticker } from 'pixi.js';
import type { DrinkProfile } from '@salet/shared';
import { COASTER_ANIMATION_SCALE } from '../engine/constants.js';
import { mountDrinkImageSprite } from './drinkImageSprite.js';

function hexToNum(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

export class CoasterAnimation {
  readonly container: Container;
  private readonly animLayer: Container;
  private graphics: Graphics;
  private phase = 0;

  constructor(
    private readonly profile: DrinkProfile,
    position: { x: number; y: number },
    imageUrl?: string | null,
  ) {
    this.container = new Container();
    this.container.position.set(position.x, position.y);
    this.animLayer = new Container();
    this.animLayer.scale.set(COASTER_ANIMATION_SCALE);
    this.graphics = new Graphics();
    this.animLayer.addChild(this.graphics);
    this.container.addChild(this.animLayer);
    const url = imageUrl ?? profile.imageUrl;
    if (url) {
      void mountDrinkImageSprite(this.container, url, 0);
    }
  }

  mount(stage: Container): void {
    if (!this.container.parent) {
      stage.addChild(this.container);
    }
  }

  unmount(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }

  updatePosition(position: { x: number; y: number }): void {
    this.container.position.set(position.x, position.y);
  }

  tick(ticker: Ticker): void {
    this.phase += ticker.deltaTime * 0.04;
    this.graphics.clear();
    const [c0, c1, c2] = this.profile.colorPalette.map(hexToNum) as [number, number, number];
    switch (this.profile.animationFamily) {
      case 'energetic':
        this.drawEnergetic(c0);
        break;
      case 'elegant':
        this.drawElegant(c1);
        break;
      case 'tropical':
        this.drawTropical(c0, c1, c2);
        break;
      case 'bold':
        this.drawBold(c0);
        break;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private drawEnergetic(color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.phase;
      const dist = 58 + 40 * Math.abs(Math.sin(this.phase * 2 + i));
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      this.graphics.circle(x, y, 5 + 3 * Math.abs(Math.sin(this.phase + i))).fill({ color, alpha: 0.65 });
    }
  }

  private drawElegant(color: number): void {
    const phase = this.phase % (Math.PI * 2);
    const radius = 40 + phase * 15;
    const alpha = 0.55 * (1 - phase / (Math.PI * 2));
    this.graphics.circle(0, 0, radius).stroke({ color, width: 2, alpha });
  }

  private drawTropical(c0: number, c1: number, c2: number): void {
    const colors = [c0, c1, c2];
    for (let i = 0; i < 3; i++) {
      const p = this.phase + (i * Math.PI * 2) / 3;
      const radius = 36 + 26 * Math.abs(Math.sin(p));
      this.graphics.circle(0, 0, radius).stroke({ color: colors[i], width: 2, alpha: 0.45 });
    }
  }

  private drawBold(color: number): void {
    const length = 45 + 28 * Math.sin(this.phase);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x2 = Math.cos(angle) * length;
      const y2 = Math.sin(angle) * length;
      this.graphics.moveTo(0, 0).lineTo(x2, y2).stroke({ color, width: 2, alpha: 0.7 });
    }
  }
}
