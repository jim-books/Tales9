import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'

const PARTICLE_COUNT = 30
const LINE_DIST = 380
const COLORS = [0xc9a96e, 0xe8c98a, 0x4a9eff, 0x9a8040, 0xffd580]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: number
  radius: number
  phase: number
}

/**
 * AmbientPreviewLayer
 *
 * Toggleable particle-network ambient animation, used as a design placeholder
 * until the final ambient visuals are received from the design team.
 *
 * Toggle via DebugPanel — clearly labeled "DESIGN PREVIEW" on-canvas.
 */
export class AmbientPreviewLayer {
  private readonly container: Container
  private readonly graphics: Graphics
  private readonly particles: Particle[]
  private readonly app: Application

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.graphics = new Graphics()
    this.container.addChild(this.graphics)

    const label = new Text({
      text: '[ AMBIENT ANIMATION — DESIGN PREVIEW ]',
      style: new TextStyle({
        fontSize: 18,
        fill: 0xc9a96e,
        fontFamily: 'monospace',
        letterSpacing: 3,
      }),
    })
    label.anchor.set(0.5, 1)
    label.x = CANVAS_SIZE / 2
    label.y = CANVAS_SIZE - 20
    label.alpha = 0.35
    this.container.addChild(label)

    this.particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      radius: 4 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
    }))

    app.ticker.add(this.tick, this)
  }

  mount(): void {
    if (!this.container.parent) {
      this.app.stage.addChildAt(this.container, 0)
    }
  }

  unmount(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container)
    }
  }

  destroy(): void {
    this.app.ticker.remove(this.tick, this)
    this.container.destroy({ children: true })
  }

  private tick = (): void => {
    this.graphics.clear()

    for (const p of this.particles) {
      p.x = (p.x + p.vx + CANVAS_SIZE) % CANVAS_SIZE
      p.y = (p.y + p.vy + CANVAS_SIZE) % CANVAS_SIZE
      p.phase += 0.012
    }

    // Connecting lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i]
        const b = this.particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < LINE_DIST) {
          const lineAlpha = (1 - dist / LINE_DIST) * 0.2
          this.graphics
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({ color: 0xc9a96e, width: 1, alpha: lineAlpha })
        }
      }
    }

    // Glowing particle dots
    for (const p of this.particles) {
      const pulse = 0.5 + 0.5 * Math.sin(p.phase)
      const alpha = 0.3 + 0.25 * pulse
      const r = p.radius * (0.85 + 0.15 * pulse)
      this.graphics
        .circle(p.x, p.y, r * 2.5)
        .fill({ color: p.color, alpha: alpha * 0.22 })
      this.graphics
        .circle(p.x, p.y, r)
        .fill({ color: p.color, alpha })
    }
  }
}
