import { Application, Container, Graphics } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'

const BLOB_COLORS = [0xb87333, 0x1e2a5e, 0x6b3050, 0x1a4a4a, 0xa08020] as const

interface AmbientBlob {
  graphics: Graphics
  baseX: number
  baseY: number
  phaseX: number
  phaseY: number
  speedX: number
  speedY: number
  ampX: number
  ampY: number
}

interface BlobDef {
  color: number
  radius: number
  alpha: number
}

/**
 * AmbientPreviewLayer
 *
 * Subtle animated background made of large soft radial-style blobs.
 * Each blob is drawn once and only translated per frame to keep updates light.
 */
export class AmbientPreviewLayer {
  private readonly container: Container
  private readonly blobs: AmbientBlob[]
  private readonly app: Application
  private time = 0

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.blobs = BLOB_COLORS.map((color) => {
      const graphics = new Graphics()
      const def: BlobDef = {
        color,
        radius: 350 + Math.random() * 100,
        alpha: 0.06 + Math.random() * 0.05,
      }
      this.drawBlob(graphics, def)
      this.container.addChild(graphics)
      return {
        graphics,
        baseX: Math.random() * CANVAS_SIZE,
        baseY: Math.random() * CANVAS_SIZE,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: 0.00015 + Math.random() * 0.00015,
        speedY: 0.00015 + Math.random() * 0.00015,
        ampX: 80 + Math.random() * 100,
        ampY: 80 + Math.random() * 100,
      }
    })

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

  private drawBlob(graphics: Graphics, def: BlobDef): void {
    const layers = 8
    for (let i = layers; i >= 1; i--) {
      const t = i / layers
      const radius = def.radius * t
      const alpha = def.alpha * (1 - t * 0.7)
      graphics.circle(0, 0, radius).fill({ color: def.color, alpha })
    }
  }

  private tick = (): void => {
    this.time += this.app.ticker.deltaMS
    for (const blob of this.blobs) {
      blob.graphics.x = blob.baseX + Math.sin(this.time * blob.speedX + blob.phaseX) * blob.ampX
      blob.graphics.y = blob.baseY + Math.sin(this.time * blob.speedY + blob.phaseY) * blob.ampY
    }
  }
}
