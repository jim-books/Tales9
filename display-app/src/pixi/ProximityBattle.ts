import { Application, Container, Graphics, type Ticker } from 'pixi.js'
import type { Point } from '../types'

const SEGMENTS = 8         // jagged line segments per arc
const JITTER_RATIO = 0.35  // max perpendicular jitter as fraction of segment length

/**
 * ProximityBattle
 *
 * Renders a jagged lightning arc between two nearby coaster centroids.
 * Re-randomises every frame so it flickers like an electric charge.
 * One instance per active coaster pair; destroyed when the pair moves apart.
 */
export class ProximityBattle {
  readonly container: Container
  private readonly g: Graphics
  private a: Point
  private b: Point

  private readonly tickerCb: (t: Ticker) => void

  constructor(private readonly app: Application, a: Point, b: Point) {
    this.a = { ...a }
    this.b = { ...b }
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
    this.tickerCb = (t: Ticker) => this.tick(t)
    this.app.ticker.add(this.tickerCb)
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

  updatePositions(a: Point, b: Point): void {
    this.a = { ...a }
    this.b = { ...b }
  }

  destroy(): void {
    this.app.ticker.remove(this.tickerCb)
    this.container.destroy({ children: true })
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private tick(_ticker: Ticker): void {
    this.g.clear()
    this.drawArc(0xffdd44, 3, 0.75)
    this.drawArc(0xffffff, 1, 0.45)
    this.drawMidGlow()
  }

  /** Draw a jagged arc between this.a and this.b with per-frame random jitter. */
  private drawArc(color: number, width: number, alpha: number): void {
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    // Perpendicular unit vector
    const px = -dy / dist
    const py = dx / dist
    const maxJitter = (dist / SEGMENTS) * JITTER_RATIO

    this.g.moveTo(this.a.x, this.a.y)
    for (let i = 1; i < SEGMENTS; i++) {
      const t = i / SEGMENTS
      const jitter = (Math.random() * 2 - 1) * maxJitter
      const x = this.a.x + dx * t + px * jitter
      const y = this.a.y + dy * t + py * jitter
      this.g.lineTo(x, y)
    }
    this.g.lineTo(this.b.x, this.b.y)
    this.g.stroke({ color, width, alpha })
  }

  /** Pulsing glow at the midpoint collision zone. */
  private drawMidGlow(): void {
    const mx = (this.a.x + this.b.x) / 2
    const my = (this.a.y + this.b.y) / 2
    const radius = 18 + Math.random() * 14
    this.g.circle(mx, my, radius).fill({ color: 0xffaa00, alpha: 0.28 })
  }
}
