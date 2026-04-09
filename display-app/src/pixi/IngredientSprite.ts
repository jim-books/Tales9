import { Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { spriteRegistry } from './SpriteAnimDef'
import { FrameAnimPlayer, type WalkEdge } from './FrameAnimPlayer'

const EDGE_MARGIN = 16   // px from canvas edge when "landed"
const DROP_SPEED  = 3    // px per frame while dropping
const WALK_SPEED  = 1.5  // px per frame while walking
const CORNER_TOL  = 18   // px tolerance for corner transitions

/** Simple string hash → hue 0–360 */
function charToHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % 360
}

/** HSL hue (0–360) → PixiJS colour number (rough approximation) */
function hueToColor(hue: number): number {
  const h = hue / 60
  const x = Math.round(255 * (1 - Math.abs((h % 2) - 1)))
  const sector = Math.floor(h)
  let r = 0, g = 0, b = 0
  if (sector === 0) { r = 255; g = x }
  else if (sector === 1) { r = x; g = 255 }
  else if (sector === 2) { g = 255; b = x }
  else if (sector === 3) { g = x; b = 255 }
  else if (sector === 4) { r = x; b = 255 }
  else { r = 255; b = x }
  return (r << 16) | (g << 8) | b
}

/**
 * IngredientSprite
 *
 * Spawns near a coaster, drops to the nearest canvas edge, then walks
 * clockwise around the perimeter.
 *
 * When the character key is registered in spriteRegistry, a real frame-based
 * animation (FrameAnimPlayer) is used. Otherwise falls back to a procedural
 * Graphics placeholder so unregistered characters still render.
 */
export class IngredientSprite {
  readonly container: Container
  private state: 'dropping' | 'walking' = 'dropping'
  private x: number
  private y: number
  private edge: WalkEdge = 'bottom'
  private landX = 0
  private landY = 0
  private walkDir: 1 | -1 = 1
  // Placeholder graphics — only used when no SpriteAnimDef is registered
  private body?: Graphics
  private label?: Text
  // Frame-based animation — used when a SpriteAnimDef is registered
  private player?: FrameAnimPlayer

  constructor(character: string, spawnX: number, spawnY: number) {
    this.x = spawnX
    this.y = spawnY
    this.container = new Container()

    // Determine nearest edge and landing position
    const distTop    = spawnY
    const distBottom = CANVAS_SIZE - spawnY
    const distLeft   = spawnX
    const distRight  = CANVAS_SIZE - spawnX
    const minDist = Math.min(distTop, distBottom, distLeft, distRight)

    if (minDist === distBottom) {
      this.edge = 'bottom'; this.landX = spawnX; this.landY = CANVAS_SIZE - EDGE_MARGIN
    } else if (minDist === distTop) {
      this.edge = 'top'; this.landX = spawnX; this.landY = EDGE_MARGIN
    } else if (minDist === distRight) {
      this.edge = 'right'; this.landX = CANVAS_SIZE - EDGE_MARGIN; this.landY = spawnY
    } else {
      this.edge = 'left'; this.landX = EDGE_MARGIN; this.landY = spawnY
    }

    // Walk direction: always clockwise
    this.walkDir = 1

    const def = spriteRegistry.get(character)
    if (def) {
      // Real frame-based animation
      this.player = new FrameAnimPlayer(def, this.container)
    } else {
      // Procedural placeholder
      const hue = charToHue(character)
      const color = hueToColor(hue)
      this.body = new Graphics()
      this.drawBody(color)
      this.container.addChild(this.body)

      const labelText = character.slice(0, 3).toUpperCase()
      this.label = new Text({
        text: labelText,
        style: new TextStyle({ fontSize: 10, fill: 0xffffff, fontWeight: 'bold' }),
      })
      this.label.anchor.set(0.5, 0)
      this.label.y = 16
      this.container.addChild(this.label)
    }

    this.container.x = this.x
    this.container.y = this.y
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

  destroy(): void {
    this.player?.destroy()
    this.container.destroy({ children: true })
  }

  tick(_ticker: Ticker): void {
    if (this.state === 'dropping') {
      this.stepDrop()
    } else {
      this.stepWalk()
      this.player?.updateWalkOrientation(this.edge)
    }
    this.player?.tick(_ticker)
    this.container.x = this.x
    this.container.y = this.y
  }

  private stepDrop(): void {
    const dx = this.landX - this.x
    const dy = this.landY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 4) {
      this.x = this.landX
      this.y = this.landY
      this.player?.notifyPhysicsLanded()
      this.state = 'walking'
      return
    }
    this.x += (dx / dist) * DROP_SPEED
    this.y += (dy / dist) * DROP_SPEED
  }

  private stepWalk(): void {
    switch (this.edge) {
      case 'bottom':
        this.x += WALK_SPEED * this.walkDir
        if (this.x >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.x = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'right'; this.y = CANVAS_SIZE - EDGE_MARGIN
        } else if (this.x <= EDGE_MARGIN + CORNER_TOL) {
          this.x = EDGE_MARGIN; this.edge = 'left'; this.y = CANVAS_SIZE - EDGE_MARGIN
        }
        break
      case 'right':
        this.y -= WALK_SPEED * this.walkDir
        if (this.y <= EDGE_MARGIN + CORNER_TOL) {
          this.y = EDGE_MARGIN; this.edge = 'top'; this.x = CANVAS_SIZE - EDGE_MARGIN
        } else if (this.y >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.y = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'bottom'; this.x = CANVAS_SIZE - EDGE_MARGIN
        }
        break
      case 'top':
        this.x -= WALK_SPEED * this.walkDir
        if (this.x <= EDGE_MARGIN + CORNER_TOL) {
          this.x = EDGE_MARGIN; this.edge = 'left'; this.y = EDGE_MARGIN
        } else if (this.x >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.x = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'right'; this.y = EDGE_MARGIN
        }
        break
      case 'left':
        this.y += WALK_SPEED * this.walkDir
        if (this.y >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.y = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'bottom'; this.x = EDGE_MARGIN
        } else if (this.y <= EDGE_MARGIN + CORNER_TOL) {
          this.y = EDGE_MARGIN; this.edge = 'top'; this.x = EDGE_MARGIN
        }
        break
    }
  }

  private drawBody(color: number): void {
    if (!this.body) return
    // Body circle
    this.body.circle(0, 0, 14).fill({ color, alpha: 0.9 })
    // Eyes
    this.body.circle(-5, -4, 3).fill({ color: 0xffffff, alpha: 1 })
    this.body.circle(5, -4, 3).fill({ color: 0xffffff, alpha: 1 })
    this.body.circle(-5, -4, 1.5).fill({ color: 0x000000, alpha: 1 })
    this.body.circle(5, -4, 1.5).fill({ color: 0x000000, alpha: 1 })
  }
}
