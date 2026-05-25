import { Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js';
import { CANVAS_SIZE } from '../engine/constants.js';

const EDGE_MARGIN = 16;
const DROP_SPEED = 3;
const WALK_SPEED = 1.5;
const CORNER_TOLERANCE = 18;

type WalkEdge = 'top' | 'right' | 'bottom' | 'left';

function charToHue(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = (value * 33 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(value) % 360;
}

function hueToColor(hue: number): number {
  const h = hue / 60;
  const x = Math.round(255 * (1 - Math.abs((h % 2) - 1)));
  const sector = Math.floor(h);
  let r = 0;
  let g = 0;
  let b = 0;
  if (sector === 0) {
    r = 255;
    g = x;
  } else if (sector === 1) {
    r = x;
    g = 255;
  } else if (sector === 2) {
    g = 255;
    b = x;
  } else if (sector === 3) {
    g = x;
    b = 255;
  } else if (sector === 4) {
    r = x;
    b = 255;
  } else {
    r = 255;
    b = x;
  }
  return (r << 16) | (g << 8) | b;
}

export class IngredientSprite {
  readonly container: Container;
  private x: number;
  private y: number;
  private edge: WalkEdge = 'bottom';
  private state: 'dropping' | 'walking' = 'dropping';
  private landX = 0;
  private landY = 0;

  constructor(character: string, spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
    this.container = new Container();

    const body = new Graphics();
    body.circle(0, 0, 28).fill({ color: hueToColor(charToHue(character)), alpha: 0.9 });
    body.circle(-10, -8, 6).fill({ color: 0xffffff, alpha: 1 });
    body.circle(10, -8, 6).fill({ color: 0xffffff, alpha: 1 });
    body.circle(-10, -8, 3).fill({ color: 0x000000, alpha: 1 });
    body.circle(10, -8, 3).fill({ color: 0x000000, alpha: 1 });
    this.container.addChild(body);

    const label = new Text({
      text: character.slice(0, 3).toUpperCase(),
      style: new TextStyle({ fontSize: 10, fill: 0xffffff, fontWeight: 'bold' }),
    });
    label.anchor.set(0.5, 0);
    label.y = 16;
    this.container.addChild(label);

    this.computeLanding(spawnX, spawnY);
    this.container.x = this.x;
    this.container.y = this.y;
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

  destroy(): void {
    this.container.destroy({ children: true });
  }

  tick(_ticker: Ticker): void {
    if (this.state === 'dropping') {
      this.stepDrop();
    } else {
      this.stepWalk();
    }
    this.container.x = this.x;
    this.container.y = this.y;
  }

  private computeLanding(spawnX: number, spawnY: number): void {
    const distTop = spawnY;
    const distBottom = CANVAS_SIZE - spawnY;
    const distLeft = spawnX;
    const distRight = CANVAS_SIZE - spawnX;
    const minDist = Math.min(distTop, distBottom, distLeft, distRight);

    if (minDist === distBottom) {
      this.edge = 'bottom';
      this.landX = spawnX;
      this.landY = CANVAS_SIZE - EDGE_MARGIN;
    } else if (minDist === distTop) {
      this.edge = 'top';
      this.landX = spawnX;
      this.landY = EDGE_MARGIN;
    } else if (minDist === distRight) {
      this.edge = 'right';
      this.landX = CANVAS_SIZE - EDGE_MARGIN;
      this.landY = spawnY;
    } else {
      this.edge = 'left';
      this.landX = EDGE_MARGIN;
      this.landY = spawnY;
    }
  }

  private stepDrop(): void {
    const dx = this.landX - this.x;
    const dy = this.landY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 4) {
      this.x = this.landX;
      this.y = this.landY;
      this.state = 'walking';
      return;
    }
    this.x += (dx / distance) * DROP_SPEED;
    this.y += (dy / distance) * DROP_SPEED;
  }

  private stepWalk(): void {
    switch (this.edge) {
      case 'bottom':
        this.x += WALK_SPEED;
        if (this.x >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOLERANCE) {
          this.x = CANVAS_SIZE - EDGE_MARGIN;
          this.edge = 'right';
          this.y = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOLERANCE - 1;
        }
        break;
      case 'right':
        this.y -= WALK_SPEED;
        if (this.y <= EDGE_MARGIN + CORNER_TOLERANCE) {
          this.y = EDGE_MARGIN;
          this.edge = 'top';
          this.x = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOLERANCE - 1;
        }
        break;
      case 'top':
        this.x -= WALK_SPEED;
        if (this.x <= EDGE_MARGIN + CORNER_TOLERANCE) {
          this.x = EDGE_MARGIN;
          this.edge = 'left';
          this.y = EDGE_MARGIN + CORNER_TOLERANCE + 1;
        }
        break;
      case 'left':
        this.y += WALK_SPEED;
        if (this.y >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOLERANCE) {
          this.y = CANVAS_SIZE - EDGE_MARGIN;
          this.edge = 'bottom';
          this.x = EDGE_MARGIN + CORNER_TOLERANCE + 1;
        }
        break;
    }
  }
}
