import { Container, Graphics, type Ticker } from 'pixi.js'
import type { DrinkProfile, OrbitalPreset } from '../types'
import { COASTER_PHASE_RATE } from './animationTiming'

const COASTER_ANIMATION_SCALE = 2.975

/** Convert CSS hex string (#RRGGBB) to PixiJS colour number */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

/** Robust default preset for fallback */
export const DEFAULT_PRESET: OrbitalPreset = {
  lines: [
    { radius: 45, width: 1.5, speed: 0.1, alpha: 0.5, colorIndex: 0 },
    { radius: 60, width: 1.0, dashCount: 24, speed: -0.15, alpha: 0.4, colorIndex: 1 }
  ],
  particles: [
    { radius: 45, count: 2, size: 2.5, speed: 0.3, alpha: 0.7, colorIndex: 2 }
  ],
  waves: [
    { radius: 52, width: 2.0, amplitude: 4, wavelength: 6, speed: 0.2, alpha: 0.6, colorIndex: 1 }
  ],
  spokes: []
}

/**
 * Shared renderer for drawing custom orbital presets in both confirmed and preview states.
 */
export function drawOrbitalPreset(
  g: Graphics,
  cx: number,
  cy: number,
  preset: OrbitalPreset,
  phase: number,
  colorPalette: [number, number, number],
  scaleFn: (size: number) => number
): void {
  // 1. Draw spokes
  if (preset.spokes) {
    for (const spoke of preset.spokes) {
      const color = colorPalette[spoke.colorIndex] ?? colorPalette[0]
      const count = spoke.count
      const speed = spoke.speed
      const alpha = spoke.alpha
      const width = scaleFn(spoke.width)
      const innerR = scaleFn(spoke.innerRadius)
      const outerR = scaleFn(spoke.outerRadius)
      
      const angleStep = (Math.PI * 2) / count
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep + phase * speed
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const x1 = cx + cos * innerR
        const y1 = cy + sin * innerR
        const x2 = cx + cos * outerR
        const y2 = cy + sin * outerR
        
        g.moveTo(x1, y1).lineTo(x2, y2)
      }
      g.stroke({ color, width, alpha })
    }
  }

  // 2. Draw lines
  if (preset.lines) {
    for (const line of preset.lines) {
      const color = colorPalette[line.colorIndex] ?? colorPalette[0]
      const speed = line.speed
      const alpha = line.alpha
      const width = scaleFn(line.width)
      
      const breatheSpeed = line.breathe?.speed ?? 0
      const breatheAmp = line.breathe?.amp ?? 0
      const currentBreathe = breatheSpeed ? Math.sin(phase * breatheSpeed) * breatheAmp : 0
      const r = scaleFn(line.radius + currentBreathe)
      
      const angleOffset = phase * speed

      if (line.dashCount) {
        const count = line.dashCount
        const ratio = line.dashRatio ?? 0.5
        const angleStep = (Math.PI * 2) / count
        const dashArc = angleStep * ratio
        
        for (let i = 0; i < count; i++) {
          const startAngle = i * angleStep + angleOffset
          
          // Draw arc segment
          const steps = Math.max(3, Math.floor(r * dashArc / 6))
          for (let step = 0; step <= steps; step++) {
            const a = startAngle + (step / steps) * dashArc
            const x = cx + Math.cos(a) * r
            const y = cy + Math.sin(a) * r
            if (step === 0) {
              g.moveTo(x, y)
            } else {
              g.lineTo(x, y)
            }
          }
        }
        g.stroke({ color, width, alpha })
      } else {
        g.circle(cx, cy, r).stroke({ color, width, alpha })
      }
    }
  }

  // 3. Draw waves
  if (preset.waves) {
    for (const wave of preset.waves) {
      const color = colorPalette[wave.colorIndex] ?? colorPalette[0]
      const speed = wave.speed
      const alpha = wave.alpha
      const width = scaleFn(wave.width)
      const amplitude = scaleFn(wave.amplitude)
      const wavelength = wave.wavelength
      
      const breatheSpeed = wave.breathe?.speed ?? 0
      const breatheAmp = wave.breathe?.amp ?? 0
      const currentBreathe = breatheSpeed ? Math.sin(phase * breatheSpeed) * breatheAmp : 0
      const r = scaleFn(wave.radius + currentBreathe)
      
      const pointsCount = Math.max(64, Math.floor(r * 1.5))
      const step = (Math.PI * 2) / pointsCount
      
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i <= pointsCount; i++) {
        const angle = i * step
        const waveOffset = amplitude * Math.sin(wavelength * angle - phase * speed)
        const curR = r + waveOffset
        const x = cx + Math.cos(angle) * curR
        const y = cy + Math.sin(angle) * curR
        pts.push({ x, y })
      }
      
      if (wave.glow) {
        g.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
          g.lineTo(pts[i].x, pts[i].y)
        }
        g.stroke({ color, width: width * 3.5, alpha: alpha * 0.25 })
      }
      
      g.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        g.lineTo(pts[i].x, pts[i].y)
      }
      g.stroke({ color, width, alpha })
    }
  }

  // 4. Draw particles
  if (preset.particles) {
    for (const part of preset.particles) {
      const color = colorPalette[part.colorIndex] ?? colorPalette[0]
      const count = part.count
      const size = scaleFn(part.size)
      const speed = part.speed
      const alpha = part.alpha
      const r = scaleFn(part.radius)
      
      const angleStep = (Math.PI * 2) / count
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep + phase * speed
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        g.circle(x, y, size).fill({ color, alpha })
      }
    }
  }
}

/**
 * CoasterAnimation
 *
 * Renders per-drink visual effects around a coaster centroid in the Common Space.
 * One instance per active coaster with an assigned drink.
 * Driven by the drink's customized orbitalPreset config.
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

  setAlpha(alpha: number): void {
    this.container.alpha = alpha
  }

  tick(ticker: Ticker): void {
    this.phase += ticker.deltaTime * COASTER_PHASE_RATE
    this.g.clear()

    const colors = this.profile.colorPalette.map(hexToNum) as [number, number, number]
    const preset = this.profile.orbitalPreset ?? DEFAULT_PRESET

    drawOrbitalPreset(
      this.g,
      this.cx,
      this.cy,
      preset,
      this.phase,
      colors,
      (size) => this.scaled(size)
    )
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  private scaled(size: number): number {
    return size * COASTER_ANIMATION_SCALE
  }
}
