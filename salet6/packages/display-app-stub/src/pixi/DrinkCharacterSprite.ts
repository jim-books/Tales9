import { Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js';
import { CANVAS_SIZE } from '../engine/constants.js';

const EDGE_MARGIN = 16;
const CHARACTER_SIZE = 64;

type CharacterStyle = 'friendly' | 'mysterious' | 'energetic' | 'calm' | 'elegant' | 'playful';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function hexToNumber(hex: string): number {
  const rgb = hexToRgb(hex);
  return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
}

export class DrinkCharacterSprite {
  readonly container: Container;
  private x: number;
  private y: number;

  constructor(
    drinkName: string,
    palette: ColorPalette,
    styleIndex: number,
    ingredientCount: number
  ) {
    this.x = CANVAS_SIZE / 2;
    this.y = CANVAS_SIZE / 2;
    this.container = new Container();

    const styles: CharacterStyle[] = [
      'friendly',
      'mysterious',
      'energetic',
      'calm',
      'elegant',
      'playful',
    ];
    const style = styles[styleIndex % styles.length];

    // Background circle
    const bg = new Graphics();
    bg.circle(0, 0, CHARACTER_SIZE / 2).fill({
      color: hexToNumber(palette.background),
    });
    this.container.addChild(bg);

    // Ingredient indicator dots
    const ingrCount = Math.min(ingredientCount, 5);
    for (let i = 0; i < ingrCount; i++) {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const px = (CHARACTER_SIZE / 4) * Math.cos(angle);
      const py = (CHARACTER_SIZE / 4) * Math.sin(angle);
      const dot = new Graphics();
      dot.circle(px, py, 3).fill({
        color: hexToNumber(palette.secondary),
        alpha: 0.7,
      });
      this.container.addChild(dot);
    }

    // Body shape based on style
    const body = new Graphics();
    const primaryColor = hexToNumber(palette.primary);
    const accentColor = hexToNumber(palette.accent);

    if (style === 'friendly' || style === 'playful') {
      // Ellipse
      body
        .ellipse(0, 8, 18, 20)
        .fill({ color: primaryColor })
        .stroke({ color: accentColor, width: 1.5 });
    } else if (style === 'elegant') {
      // Tapered shape (path approximation using polygon)
      body
        .rect(-10, -8, 20, 30)
        .fill({ color: primaryColor })
        .stroke({ color: accentColor, width: 1.5 });
    } else {
      // Rectangle with radius
      body
        .rect(-14, -6, 28, 32)
        .fill({ color: primaryColor })
        .stroke({ color: accentColor, width: 1.5 });
    }
    this.container.addChild(body);

    // Face elements based on style
    const face = new Graphics();
    face.strokeColor = accentColor;
    face.fillStyle.color = accentColor;

    if (style === 'friendly') {
      // Two circle eyes
      face.circle(-8, 4, 2).fill({ color: accentColor });
      face.circle(8, 4, 2).fill({ color: accentColor });
      // Smile (arc approximation with polygon)
      this.drawSmile(face, 0, 10, 10, accentColor);
    } else if (style === 'mysterious') {
      // Two lines for eyes
      face.moveTo(-10, 4).lineTo(-4, 4).stroke({ color: accentColor, width: 1.5 });
      face.moveTo(4, 4).lineTo(10, 4).stroke({ color: accentColor, width: 1.5 });
      // Dot mouth
      face.circle(0, 12, 1.5).fill({ color: accentColor });
    } else if (style === 'energetic') {
      // Triangle eyes
      face
        .polygon([
          [-8, 2],
          [-6, 6],
          [-10, 6],
        ])
        .fill({ color: accentColor });
      face
        .polygon([
          [8, 2],
          [10, 6],
          [6, 6],
        ])
        .fill({ color: accentColor });
      // Square mouth
      face.rect(-4, 10, 8, 2.5).fill({ color: accentColor });
    } else if (style === 'calm') {
      // Arc eyes
      face.moveTo(-10, 6).quadraticCurveTo(-8, 2, -6, 6).stroke({
        color: accentColor,
        width: 1,
      });
      face.moveTo(6, 6).quadraticCurveTo(8, 2, 10, 6).stroke({
        color: accentColor,
        width: 1,
      });
      // Straight mouth
      face.moveTo(-5, 12).lineTo(5, 12).stroke({ color: accentColor, width: 1 });
    } else if (style === 'elegant') {
      // Dot eyes
      face.circle(-8, 6, 1.5).fill({ color: accentColor });
      face.circle(8, 6, 1.5).fill({ color: accentColor });
      // Arc mouth
      this.drawSmile(face, 0, 12, 6, accentColor);
    } else {
      // Playful eyes - larger circles
      face.circle(-8, 6, 2.5).fill({ color: accentColor });
      face.circle(8, 6, 2.5).fill({ color: accentColor });
      // Oval mouth
      face.ellipse(0, 12, 4, 2.5).fill({ color: hexToNumber(palette.secondary) });
    }
    this.container.addChild(face);

    // Initial letter label
    const initial = drinkName.charAt(0).toUpperCase();
    const label = new Text({
      text: initial,
      style: new TextStyle({
        fontSize: 12,
        fill: accentColor,
        fontWeight: 'bold',
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.y = -20;
    this.container.addChild(label);

    this.container.x = this.x;
    this.container.y = this.y;
  }

  private drawSmile(
    graphics: Graphics,
    cx: number,
    cy: number,
    width: number,
    color: number
  ): void {
    // Approximate smile with quadratic curve using arc
    graphics
      .moveTo(cx - width / 2, cy)
      .quadraticCurveTo(cx, cy + width / 3, cx + width / 2, cy)
      .stroke({ color, width: 1.5 });
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
    // Subtle bobbing animation
    this.container.y = this.y + Math.sin(_ticker.lastTime * 0.003) * 4;
  }
}
