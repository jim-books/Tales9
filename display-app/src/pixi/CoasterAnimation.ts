import { Container, Graphics, type Ticker } from 'pixi.js'
import type { DrinkProfile } from '../types'

/** Convert CSS hex string (#RRGGBB) to PixiJS colour number */
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

/**
 * CoasterAnimation
 *
 * Renders per-drink visual effects around a coaster centroid in the Common Space.
 * One instance per active coaster with an assigned drink.
 * Driven by the drink's animationFamily and colorPalette.
 */
export class CoasterAnimation {
  readonly container: Container
  private g: Graphics
  private cx: number
  private cy: number
  private phase = 0

  constructor(private readonly profile: DrinkProfile, centroid: { x: number; y: number }) {
    this.cx = centroid.x
    this.cy = centroid.y
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
  }

  mount(stage: Container): void {
    if (!this.container.parent) {
      stage.addChild(this.container)
    }
  }

  unmount(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container)
    }
  }

  updatePosition(centroid: { x: number; y: number }): void {
    this.cx = centroid.x
    this.cy = centroid.y
  }

  tick(ticker: Ticker): void {
    this.phase += ticker.deltaTime * 0.04
    this.g.clear()

    const [c0, c1, c2] = this.profile.colorPalette.map(hexToNum) as [number, number, number]

    switch (this.profile.animationFamily) {
      case 'energetic':
        this.drawEnergetic(c0)
        break
      case 'elegant':
        this.drawElegant(c1)
        break
      case 'tropical':
        this.drawTropical(c0, c1, c2)
        break
      case 'bold':
        this.drawBold(c0)
        break
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  private drawEnergetic(color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.phase
      const dist = 60 + 60 * Math.abs(Math.sin(this.phase * 2 + i))
      const x = this.cx + Math.cos(angle) * dist
      const y = this.cy + Math.sin(angle) * dist
      this.g.circle(x, y, 5 + 3 * Math.abs(Math.sin(this.phase + i))).fill({ color, alpha: 0.65 })
    }
  }

  private drawElegant(color: number): void {
    const ringPhase = this.phase % (Math.PI * 2)
    const radius = 40 + ringPhase * 15
    const alpha = 0.5 * (1 - ringPhase / (Math.PI * 2))
    this.g.circle(this.cx, this.cy, radius).stroke({ color, width: 2, alpha })
  }

  private drawTropical(c0: number, c1: number, c2: number): void {
    const colors = [c0, c1, c2]
    for (let i = 0; i < 3; i++) {
      const offsetPhase = this.phase + (i * Math.PI * 2) / 3
      const radius = 40 + 30 * Math.abs(Math.sin(offsetPhase))
      this.g.circle(this.cx, this.cy, radius).stroke({ color: colors[i], width: 2, alpha: 0.45 })
    }
  }

  private drawBold(color: number): void {
    const spokeLen = 50 + 30 * Math.sin(this.phase)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const x2 = this.cx + Math.cos(angle) * spokeLen
      const y2 = this.cy + Math.sin(angle) * spokeLen
      this.g.moveTo(this.cx, this.cy).lineTo(x2, y2).stroke({ color, width: 2, alpha: 0.7 })
    }
  }
}
