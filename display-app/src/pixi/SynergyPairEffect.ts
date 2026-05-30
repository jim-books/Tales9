import { Application, Container, Graphics, type Ticker } from 'pixi.js'
import type { Point } from '../types'
import type { SynergyConfig } from '../data/drinkPairSynergies'

interface Particle {
  t: number // position along path (0 to 1) or angle
  speed: number
  size: number
  color: number
  alpha: number
  offset?: number // perpendicular offset
  r?: number // radial distance for vortex/orbit
  theta?: number // angle for vortex/orbit
}

export class SynergyPairEffect {
  readonly container: Container
  private readonly g: Graphics
  private a: Point
  private b: Point
  private readonly config: SynergyConfig
  private phase = 0
  private particles: Particle[] = []

  private readonly tickerCb: (t: Ticker) => void

  constructor(private readonly app: Application, a: Point, b: Point, config: SynergyConfig) {
    this.a = { ...a }
    this.b = { ...b }
    this.config = config
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)

    this.initParticles()

    this.tickerCb = (t: Ticker) => this.tick(t)
    this.app.ticker.add(this.tickerCb)
  }

  mount(stage: Container): void {
    // Mount behind other objects (use addChildAt index 0 or insert before coasters)
    // In PixiStage, we will mount it to a dedicated background container or at index 0.
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

  private initParticles(): void {
    const count = this.config.particleCount
    const isVortex = this.config.type === 'vortex'
    const isOrbit = this.config.type === 'orbit'

    for (let i = 0; i < count; i++) {
      if (isVortex) {
        this.particles.push({
          t: 0,
          speed: (0.02 + Math.random() * 0.03) * this.config.speed,
          size: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? this.config.primaryColor : this.config.secondaryColor,
          alpha: 0.3 + Math.random() * 0.6,
          r: 50 + Math.random() * 180,
          theta: Math.random() * Math.PI * 2,
        })
      } else if (isOrbit) {
        this.particles.push({
          t: 0,
          speed: (0.015 + Math.random() * 0.02) * this.config.speed,
          size: 2.5 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? this.config.primaryColor : this.config.secondaryColor,
          alpha: 0.4 + Math.random() * 0.5,
          r: 35 + Math.random() * 45, // orbit radius around each coaster
          theta: Math.random() * Math.PI * 2,
          offset: Math.random() > 0.5 ? 0 : 1, // 0 = orbit coaster A, 1 = orbit coaster B
        })
      } else {
        // Linear path particles (magnetic, ribbon, etc.)
        this.particles.push({
          t: Math.random(),
          speed: (0.003 + Math.random() * 0.008) * this.config.speed,
          size: 2 + Math.random() * 3.5,
          color: Math.random() > 0.5 ? this.config.primaryColor : this.config.secondaryColor,
          alpha: 0.3 + Math.random() * 0.7,
          offset: (Math.random() * 2 - 1) * 20, // perpendicular offset
        })
      }
    }
  }

  private tick(ticker: Ticker): void {
    const dt = ticker.deltaTime
    this.phase += 0.03 * this.config.speed * dt
    this.g.clear()

    // Draw the specialized synergy background
    switch (this.config.type) {
      case 'magnetic':
        this.drawMagnetic(dt)
        break
      case 'ribbon':
        this.drawRibbon(dt)
        break
      case 'vortex':
        this.drawVortex(dt)
        break
      case 'aurora':
        this.drawAurora(dt)
        break
      case 'blossom':
        this.drawBlossom(dt)
        break
      case 'orbit':
        this.drawOrbit(dt)
        break
      case 'sparkle':
        this.drawSparkle(dt)
        break
      case 'pulse':
        this.drawPulse(dt)
        break
    }
  }

  /**
   * Type 1: Magnetic
   * Flowing lines representing magnetic fields between the two coasters.
   */
  private drawMagnetic(dt: number): void {
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const px = -dy / dist
    const py = dx / dist

    const numArcs = this.config.customParams?.lineCount ?? 3
    const maxOffset = dist * (this.config.customParams?.arcSpread ?? 0.35)

    // Draw magnetic flux lines (bezier curves)
    for (let i = 0; i < numArcs; i++) {
      const pct = (i / (numArcs - 1)) * 2 - 1 // from -1 to 1
      const ctrlOffset = pct * maxOffset * (0.8 + 0.2 * Math.sin(this.phase + i))

      const mx = (this.a.x + this.b.x) / 2
      const my = (this.a.y + this.b.y) / 2
      const cx = mx + px * ctrlOffset
      const cy = my + py * ctrlOffset

      this.g.moveTo(this.a.x, this.a.y)
      this.g.quadraticCurveTo(cx, cy, this.b.x, this.b.y)
      
      const alpha = 0.08 + (0.05 * Math.sin(this.phase * 1.5 + i)) * this.config.intensity
      const color = i % 2 === 0 ? this.config.primaryColor : this.config.secondaryColor
      this.g.stroke({ color, width: 2, alpha })

      if (this.config.glow) {
        this.g.moveTo(this.a.x, this.a.y)
        this.g.quadraticCurveTo(cx, cy, this.b.x, this.b.y)
        this.g.stroke({ color, width: 6, alpha: alpha * 0.4 })
      }
    }

    // Animate and draw magnetic flux particles
    for (const p of this.particles) {
      p.t += p.speed * dt
      if (p.t > 1) {
        p.t = 0
        p.color = Math.random() > 0.5 ? this.config.primaryColor : this.config.secondaryColor
      }

      // Compute position on a quadratic bezier curve
      // For each particle, assign it to a specific arc offset
      const arcIdx = Math.floor(p.offset! * 10) % numArcs
      const pct = (arcIdx / (numArcs - 1)) * 2 - 1
      const ctrlOffset = pct * maxOffset * (0.8 + 0.2 * Math.sin(this.phase + arcIdx))

      const mx = (this.a.x + this.b.x) / 2
      const my = (this.a.y + this.b.y) / 2
      const cx = mx + px * ctrlOffset
      const cy = my + py * ctrlOffset

      // Bezier interpolation formula
      const mt = 1 - p.t
      const x = mt * mt * this.a.x + 2 * mt * p.t * cx + p.t * p.t * this.b.x
      const y = mt * mt * this.a.y + 2 * mt * p.t * cy + p.t * p.t * this.b.y

      const pulseAlpha = p.alpha * (1 - Math.abs(p.t - 0.5) * 1.6) // fade in and out at ends
      this.g.circle(x, y, p.size).fill({ color: p.color, alpha: pulseAlpha * this.config.intensity })
    }
  }

  /**
   * Type 2: Ribbon
   * Flowing ribbons undulating like a double helix.
   */
  private drawRibbon(dt: number): void {
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const px = -dy / dist
    const py = dx / dist

    const ribbonCount = this.config.customParams?.ribbonCount ?? 2
    const baseAmp = this.config.customParams?.waveHeight ?? 30
    const wavelength = this.config.customParams?.frequency ?? 0.04

    const steps = 30
    for (let r = 0; r < ribbonCount; r++) {
      const color = r % 2 === 0 ? this.config.primaryColor : this.config.secondaryColor
      const phaseOffset = r * Math.PI + this.phase * 1.2
      const amp = baseAmp * this.config.intensity * (1 + 0.15 * Math.sin(this.phase * 2))

      this.g.moveTo(this.a.x, this.a.y)

      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const lx = this.a.x + dx * t
        const ly = this.a.y + dy * t

        // Wave profile that pinches to 0 at the coaster edges so it connects smoothly
        const envelope = Math.sin(t * Math.PI)
        const waveOffset = Math.sin(t * dist * wavelength - phaseOffset) * amp * envelope

        const rx = lx + px * waveOffset
        const ry = ly + py * waveOffset

        if (i === 1) {
          this.g.moveTo(rx, ry)
        } else {
          this.g.lineTo(rx, ry)
        }
      }

      this.g.stroke({ color, width: this.config.customParams?.thickness ?? 2, alpha: 0.15 })
      if (this.config.glow) {
        this.g.stroke({ color, width: this.config.customParams?.thickness ?? 2 + 5, alpha: 0.05 })
      }
    }

    // Ribbons particles
    for (const p of this.particles) {
      p.t += p.speed * dt
      if (p.t > 1) p.t = 0

      const lx = this.a.x + dx * p.t
      const ly = this.a.y + dy * p.t

      const envelope = Math.sin(p.t * Math.PI)
      const pIdx = Math.floor(Math.abs(p.offset!))
      const phaseOffset = (pIdx % ribbonCount) * Math.PI + this.phase * 1.2
      const waveOffset = Math.sin(p.t * dist * wavelength - phaseOffset) * baseAmp * this.config.intensity * envelope

      const rx = lx + px * waveOffset
      const ry = ly + py * waveOffset

      this.g.circle(rx, ry, p.size).fill({ color: p.color, alpha: p.alpha * envelope * this.config.intensity })
    }
  }

  /**
   * Type 3: Vortex
   * Swirling particles centered on the midpoint.
   */
  private drawVortex(dt: number): void {
    const mx = (this.a.x + this.b.x) / 2
    const my = (this.a.y + this.b.y) / 2
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    // Draw subtle glowing vortex spiral rings
    const maxRadius = dist * 0.65

    for (let r = 1; r <= 3; r++) {
      const radius = maxRadius * (r / 3) * (0.8 + 0.15 * Math.sin(this.phase * 0.8))
      this.g.circle(mx, my, radius).stroke({
        color: r % 2 === 0 ? this.config.primaryColor : this.config.secondaryColor,
        width: 1.5,
        alpha: 0.04 * this.config.intensity,
      })
    }

    // Animate and draw spiraling particles
    for (const p of this.particles) {
      p.theta! += p.speed * dt
      // Slowly pulse radius inwards and outwards
      const baseR = p.r! * (1 + 0.1 * Math.sin(this.phase * 0.5 + p.speed * 100))
      // Bind radius within the dynamic distance between the coasters
      const finalR = Math.min(baseR, dist * 0.6)

      const px = mx + Math.cos(p.theta!) * finalR
      const py = my + Math.sin(p.theta!) * finalR

      // Fade out particles that are too far from the center or close to the limits
      const edgeFade = Math.sin((finalR / (dist * 0.6)) * Math.PI)
      const alpha = p.alpha * edgeFade * this.config.intensity

      this.g.circle(px, py, p.size).fill({ color: p.color, alpha })
    }
  }

  /**
   * Type 4: Aurora
   * Translucent curtain of color waving between the coasters.
   */
  private drawAurora(dt: number): void {
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const px = -dy / dist
    const py = dx / dist

    const bands = this.config.customParams?.bandCount ?? 3
    const steps = 25

    // Draw wavy translucent color ribbons that blend into each other
    for (let b = 0; b < bands; b++) {
      const color = b % 2 === 0 ? this.config.primaryColor : this.config.secondaryColor
      const phaseOffset = b * 0.8 + this.phase * 0.7
      const amp = (40 + b * 15) * this.config.intensity
      const alpha = (0.05 / bands) * (1.5 + Math.sin(this.phase + b))

      // Generate a ribbon mesh (filled strip or thick stroked path)
      this.g.moveTo(this.a.x, this.a.y)

      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const lx = this.a.x + dx * t
        const ly = this.a.y + dy * t

        // Wave formula
        const envelope = Math.sin(t * Math.PI)
        const waveOffset = Math.sin(t * 3.5 - phaseOffset) * amp * envelope

        const rx = lx + px * waveOffset
        const ry = ly + py * waveOffset

        this.g.lineTo(rx, ry)
      }

      this.g.stroke({ color, width: 24, alpha })
      this.g.stroke({ color, width: 48, alpha: alpha * 0.4 })
    }

    // Add slow drifting particles
    for (const p of this.particles) {
      p.t += p.speed * 0.2 * dt // move extra slow
      if (p.t > 1) p.t = 0

      const lx = this.a.x + dx * p.t
      const ly = this.a.y + dy * p.t

      const envelope = Math.sin(p.t * Math.PI)
      const waveOffset = Math.sin(p.t * 3.5 - this.phase * 0.7 + p.offset!) * 50 * envelope * this.config.intensity

      const rx = lx + px * waveOffset
      const ry = ly + py * waveOffset

      this.g.circle(rx, ry, p.size * 1.5).fill({ color: p.color, alpha: p.alpha * 0.3 * envelope * this.config.intensity })
    }
  }

  /**
   * Type 5: Blossom
   * Interlocking flower geometries at the midpoint.
   */
  private drawBlossom(dt: number): void {
    const mx = (this.a.x + this.b.x) / 2
    const my = (this.a.y + this.b.y) / 2
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const scale = this.config.customParams?.blossomScale ?? 1.0
    const maxRadius = Math.min(dist * 0.4, 180 * scale)

    // Draw beautiful geometric petals
    const numPetals = this.config.customParams?.petalCount ?? 8
    const rotSpeed = this.config.customParams?.rotSpeed ?? 0.015
    const angleOffset = this.phase * rotSpeed * 30

    // Draw outer rings
    this.g.circle(mx, my, maxRadius).stroke({ color: this.config.primaryColor, width: 1, alpha: 0.05 * this.config.intensity })
    this.g.circle(mx, my, maxRadius * 0.7).stroke({ color: this.config.secondaryColor, width: 1, alpha: 0.04 * this.config.intensity })

    this.g.moveTo(mx, my)

    // Draw mathematical petals: r = base + cos(k * theta)
    const points = 120
    for (let r = 0; r < 2; r++) {
      const color = r === 0 ? this.config.primaryColor : this.config.secondaryColor
      const rScale = r === 0 ? 1.0 : 0.65
      const pulseFactor = 0.85 + 0.15 * Math.sin(this.phase * 1.5 + r)
      const currentRadius = maxRadius * rScale * pulseFactor * this.config.intensity

      this.g.moveTo(mx, my)
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2
        const pRad = currentRadius * (0.6 + 0.4 * Math.cos(numPetals * theta + angleOffset * (r === 0 ? 1 : -1)))
        const px = mx + Math.cos(theta) * pRad
        const py = my + Math.sin(theta) * pRad

        if (i === 0) {
          this.g.moveTo(px, py)
        } else {
          this.g.lineTo(px, py)
        }
      }
      this.g.stroke({ color, width: 1.5, alpha: 0.1 })
      if (this.config.glow) {
        this.g.stroke({ color, width: 5, alpha: 0.03 })
      }
    }

    // Blossom particle rings
    for (const p of this.particles) {
      p.t += p.speed * dt
      if (p.t > 1) p.t = 0

      const orbitRad = maxRadius * p.t * this.config.intensity
      const theta = p.offset! * Math.PI * 2 + this.phase * 0.5

      const px = mx + Math.cos(theta) * orbitRad
      const py = my + Math.sin(theta) * orbitRad

      const fade = Math.sin(p.t * Math.PI)
      this.g.circle(px, py, p.size).fill({ color: p.color, alpha: p.alpha * fade * 0.4 * this.config.intensity })
    }
  }

  /**
   * Type 6: Orbit
   * Double-ring orbits or infinity figure-8 loops.
   */
  private drawOrbit(dt: number): void {
    const mx = (this.a.x + this.b.x) / 2
    const my = (this.a.y + this.b.y) / 2
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    // Draw orbital path guidelines
    this.g.circle(this.a.x, this.a.y, dist * 0.28).stroke({ color: this.config.primaryColor, width: 1, alpha: 0.04 * this.config.intensity })
    this.g.circle(this.b.x, this.b.y, dist * 0.28).stroke({ color: this.config.secondaryColor, width: 1, alpha: 0.04 * this.config.intensity })

    // Figure-8 infinity path centered on midpoint
    this.g.moveTo(mx, my)
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2
      // Lemniscate of Bernoulli
      const denom = 1 + Math.sin(t) * Math.sin(t)
      const scale = dist * 0.42 * this.config.intensity
      const lx = (scale * Math.cos(t)) / denom
      const ly = (scale * Math.sin(t) * Math.cos(t)) / denom

      // Rotate layout to align with the axis
      const angle = Math.atan2(dy, dx)
      const rx = mx + lx * Math.cos(angle) - ly * Math.sin(angle)
      const ry = my + lx * Math.sin(angle) + ly * Math.cos(angle)

      if (i === 0) {
        this.g.moveTo(rx, ry)
      } else {
        this.g.lineTo(rx, ry)
      }
    }
    this.g.stroke({ color: this.config.primaryColor, width: 1.5, alpha: 0.08 * this.config.intensity })

    // Animate figure-8 and coaster orbit particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      p.theta! += p.speed * dt

      if (i % 2 === 0) {
        // Orbit around coaster A or B
        const center = p.offset === 0 ? this.a : this.b
        const r = dist * 0.28 * (0.9 + 0.1 * Math.sin(this.phase + i))
        const px = center.x + Math.cos(p.theta!) * r
        const py = center.y + Math.sin(p.theta!) * r

        this.g.circle(px, py, p.size).fill({ color: p.color, alpha: p.alpha * 0.4 * this.config.intensity })
      } else {
        // Infinity loop cross-over particle
        const t = p.theta! % (Math.PI * 2)
        const denom = 1 + Math.sin(t) * Math.sin(t)
        const scale = dist * 0.42 * this.config.intensity
        const lx = (scale * Math.cos(t)) / denom
        const ly = (scale * Math.sin(t) * Math.cos(t)) / denom

        const angle = Math.atan2(dy, dx)
        const px = mx + lx * Math.cos(angle) - ly * Math.sin(angle)
        const py = my + lx * Math.sin(angle) + ly * Math.cos(angle)

        this.g.circle(px, py, p.size * 1.2).fill({ color: p.color, alpha: p.alpha * 0.8 * this.config.intensity })
      }
    }
  }

  /**
   * Type 7: Sparkle
   * Sparkling particles rising up from the connecting axis.
   */
  private drawSparkle(dt: number): void {
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const px = -dy / dist
    const py = dx / dist

    // Draw glowing line connecting them
    this.g.moveTo(this.a.x, this.a.y)
    this.g.lineTo(this.b.x, this.b.y)
    const lineAlpha = 0.08 * (1 + 0.3 * Math.sin(this.phase * 2)) * this.config.intensity
    this.g.stroke({ color: this.config.primaryColor, width: 2, alpha: lineAlpha })

    // Animate sparkles
    for (const p of this.particles) {
      p.t += p.speed * dt
      if (p.t > 1) {
        p.t = 0
        p.offset = (Math.random() * 2 - 1) * 35 // reset random drift distance
      }

      // Linear interpolation between coaster A and coaster B
      const lx = this.a.x + dx * p.t
      const ly = this.a.y + dy * p.t

      // Floating drift perpendicular to the axis
      const floatDist = p.offset! * Math.sin(p.t * Math.PI)
      const rx = lx + px * floatDist
      const ry = ly + py * floatDist

      // Draw sparkle as crosshair + star point
      const size = p.size * (1.2 + 0.3 * Math.sin(this.phase * 3 + p.t * 20))
      const fade = Math.sin(p.t * Math.PI)
      const alpha = p.alpha * fade * this.config.intensity

      // Twinkling cross star
      this.g.moveTo(rx - size, ry)
      this.g.lineTo(rx + size, ry)
      this.g.moveTo(rx, ry - size)
      this.g.lineTo(rx, ry + size)
      this.g.stroke({ color: p.color, width: 1.2, alpha: alpha * 0.9 })

      this.g.circle(rx, ry, size * 0.4).fill({ color: 0xffffff, alpha: alpha * 0.95 })
    }
  }

  /**
   * Type 8: Pulse
   * Concentric breathing shockwaves.
   */
  private drawPulse(dt: number): void {
    const mx = (this.a.x + this.b.x) / 2
    const my = (this.a.y + this.b.y) / 2
    const dx = this.b.x - this.a.x
    const dy = this.b.y - this.a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    // Draw central pulsing node
    const heartbeat = this.config.customParams?.heartbeat ?? false
    let pulseScale = 1.0
    if (heartbeat) {
      // Classic double-beat wave: beat1 and beat2
      const t = this.phase * 2.5 % Math.PI
      pulseScale = 0.9 + 0.25 * Math.pow(Math.sin(t), 8) + 0.1 * Math.pow(Math.sin(t * 2), 12)
    } else {
      pulseScale = 0.95 + 0.15 * Math.sin(this.phase * 1.8)
    }

    const maxRadius = dist * 0.45 * this.config.intensity * pulseScale

    // Layered pulsing rings
    for (let i = 0; i < 3; i++) {
      const ringPct = ((this.phase * 0.4 + i * 0.3) % 1.0)
      const ringRadius = maxRadius * ringPct
      const ringAlpha = (1 - ringPct) * 0.15 * this.config.intensity
      const color = i % 2 === 0 ? this.config.primaryColor : this.config.secondaryColor

      this.g.circle(mx, my, ringRadius).stroke({ color, width: 2, alpha: ringAlpha })
      if (this.config.glow) {
        this.g.circle(mx, my, ringRadius).stroke({ color, width: 6, alpha: ringAlpha * 0.4 })
      }
    }

    // Midpoint core glowing orb
    const coreRad = 20 + 8 * Math.sin(this.phase * 3)
    this.g.circle(mx, my, coreRad).fill({ color: this.config.primaryColor, alpha: 0.08 * this.config.intensity })

    // Pulse drift particles
    for (const p of this.particles) {
      p.t += p.speed * dt
      if (p.t > 1) {
        p.t = 0
        p.theta = Math.random() * Math.PI * 2
      }

      const pRadius = maxRadius * p.t
      const px = mx + Math.cos(p.theta!) * pRadius
      const py = my + Math.sin(p.theta!) * pRadius

      const fade = Math.sin(p.t * Math.PI)
      this.g.circle(px, py, p.size).fill({ color: p.color, alpha: p.alpha * fade * 0.5 * this.config.intensity })
    }
  }
}
