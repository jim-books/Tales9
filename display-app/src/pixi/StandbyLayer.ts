import { Application, Container, Graphics, type Ticker } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'

const BLOB_COUNT = 12
const BLOB_COLORS = [0x1a3d5c, 0x0d3d3d, 0x0d2a3d, 0x1a2a3d]

interface Blob {
  g: Graphics
  baseAlpha: number
  vx: number
  vy: number
  phase: number
}

interface Particle {
  g: Graphics
  alpha: number
}

/**
 * StandbyLayer
 *
 * Ambient idle animation for the table when no session is active.
 * Renders slow-drifting cloud blobs and a touch-follow particle trail.
 */
export class StandbyLayer {
  readonly container: Container
  private app: Application
  private blobs: Blob[] = []
  private particles: Particle[] = []
  private touchX = -1
  private touchY = -1
  private readonly tickerCb: (t: Ticker) => void

  constructor(app: Application) {
    this.app = app
    this.container = new Container()

    // Initialise ambient blobs
    for (let i = 0; i < BLOB_COUNT; i++) {
      const radius = 60 + Math.random() * 80
      const baseAlpha = 0.06 + Math.random() * 0.06
      const color = BLOB_COLORS[Math.floor(Math.random() * BLOB_COLORS.length)]

      const g = new Graphics()
      g.circle(0, 0, radius).fill({ color, alpha: 1 })
      g.x = Math.random() * CANVAS_SIZE
      g.y = Math.random() * CANVAS_SIZE
      g.alpha = baseAlpha

      this.container.addChild(g)
      this.blobs.push({
        g,
        baseAlpha,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,
      })
    }

    this.tickerCb = (t: Ticker) => this.tick(t)
    app.ticker.add(this.tickerCb)
  }

  mount(): void {
    if (!this.container.parent) {
      this.app.stage.addChild(this.container)
    }
  }

  unmount(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container)
    }
  }

  setTouchPoint(x: number, y: number): void {
    this.touchX = x
    this.touchY = y
  }

  clearTouchPoint(): void {
    this.touchX = -1
    this.touchY = -1
  }

  destroy(): void {
    this.app.ticker.remove(this.tickerCb)
    this.container.destroy({ children: true })
  }

  private tick(ticker: Ticker): void {
    const now = ticker.lastTime

    // Move and pulse blobs
    for (const blob of this.blobs) {
      blob.g.x += blob.vx
      blob.g.y += blob.vy

      // Wrap at canvas edges
      if (blob.g.x < -150) blob.g.x = CANVAS_SIZE + 150
      if (blob.g.x > CANVAS_SIZE + 150) blob.g.x = -150
      if (blob.g.y < -150) blob.g.y = CANVAS_SIZE + 150
      if (blob.g.y > CANVAS_SIZE + 150) blob.g.y = -150

      // Pulse alpha
      blob.g.alpha = blob.baseAlpha * (0.6 + 0.4 * Math.sin(now * 0.0008 + blob.phase))
    }

    // Spawn touch particle
    if (this.touchX >= 0 && this.touchY >= 0) {
      const g = new Graphics()
      g.circle(0, 0, 22).fill({ color: 0x3d8bff, alpha: 1 })
      g.x = this.touchX
      g.y = this.touchY
      g.alpha = 0.18
      this.container.addChild(g)
      this.particles.push({ g, alpha: 0.18 })
    }

    // Fade and cull particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.alpha -= 0.018
      p.g.alpha = p.alpha
      if (p.alpha <= 0.01) {
        this.container.removeChild(p.g)
        p.g.destroy()
        this.particles.splice(i, 1)
      }
    }
  }
}
