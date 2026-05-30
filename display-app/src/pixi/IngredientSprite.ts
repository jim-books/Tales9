import { Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { DROP_SPEED, WALK_SPEED } from './animationTiming'
import { spriteRegistry } from './SpriteAnimDef'
import { FrameAnimPlayer, type WalkEdge } from './FrameAnimPlayer'

const EDGE_MARGIN = 16   // px from canvas edge when "landed"
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
  private state: 'dropping' | 'walking' | 'interacting' = 'dropping'
  private x: number
  private y: number
  private edge: WalkEdge = 'bottom'
  private landX = 0
  private landY = 0
  private walkDir: 1 | -1 = 1
  private walkSpeed: number
  private nextDirSwitchTime = 0
  private lastDirSwitchTime = 0
  private interactionEndTime = 0
  private nextInteractionAllowedTime = 0
  private partnerId: string | null = null

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

    // Walk direction: randomly 1 or -1
    this.walkDir = Math.random() < 0.5 ? 1 : -1

    // Speed: base WALK_SPEED varied by +/- 15% randomly per instance
    this.walkSpeed = WALK_SPEED * (0.85 + Math.random() * 0.3)

    this.lastDirSwitchTime = performance.now()
    this.resetDirSwitchTimer()

    const def = spriteRegistry.get(character)
    if (def) {
      // Real frame-based animation
      this.player = new FrameAnimPlayer(def, this.container, this.edge, this.walkDir)
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

  setAlpha(alpha: number): void {
    this.container.alpha = alpha
  }

  destroy(): void {
    this.player?.destroy()
    this.container.destroy({ children: true })
  }

  tick(_ticker: Ticker): void {
    if (this.state === 'dropping') {
      this.stepDrop()
    } else if (this.state === 'walking') {
      // Check for direction switch
      const now = performance.now()
      if (now >= this.nextDirSwitchTime) {
        this.flipDirection()
      }
      this.stepWalk()
      this.player?.updateWalkOrientation(this.edge, this.walkDir)
    } else if (this.state === 'interacting') {
      const now = performance.now()
      if (now >= this.interactionEndTime) {
        this.endInteraction()
      }
    }
    this.player?.tick(_ticker)
    this.container.x = this.x
    this.container.y = this.y
  }

  resetDirSwitchTimer(): void {
    const minInterval = 5000 // 5 seconds
    const maxInterval = 12000 // 12 seconds
    this.nextDirSwitchTime = performance.now() + minInterval + Math.random() * (maxInterval - minInterval)
  }

  flipDirection(): void {
    this.walkDir = this.walkDir === 1 ? -1 : 1
    this.lastDirSwitchTime = performance.now()
    this.resetDirSwitchTimer()
  }

  getState(): 'dropping' | 'walking' | 'interacting' {
    return this.state
  }

  get xCoord(): number {
    return this.x
  }

  get yCoord(): number {
    return this.y
  }

  getEdge(): WalkEdge {
    return this.edge
  }

  getWalkDir(): 1 | -1 {
    return this.walkDir
  }

  setWalkDir(dir: 1 | -1): void {
    this.walkDir = dir
    this.resetDirSwitchTimer()
  }

  startInteraction(partnerId: string, durationMs: number): void {
    this.state = 'interacting'
    this.partnerId = partnerId
    this.interactionEndTime = performance.now() + durationMs
    this.player?.setInteracting(true)
  }

  getPartnerId(): string | null {
    return this.partnerId
  }

  getInteractionEndTime(): number {
    return this.interactionEndTime
  }

  endInteraction(partnerX?: number, partnerY?: number): void {
    this.state = 'walking'
    this.partnerId = null
    this.interactionEndTime = 0
    this.nextInteractionAllowedTime = performance.now() + 10000 // 10 seconds cooldown
    this.player?.setInteracting(false)
    
    if (partnerX !== undefined && partnerY !== undefined) {
      // Determine which direction moves us AWAY from the partner's position
      let testX1 = this.x
      let testY1 = this.y
      let testX2 = this.x
      let testY2 = this.y
      
      const step = 10
      
      if (this.edge === 'bottom') {
        testX1 += step; testX2 -= step
      } else if (this.edge === 'right') {
        testY1 -= step; testY2 += step
      } else if (this.edge === 'top') {
        testX1 -= step; testX2 += step
      } else if (this.edge === 'left') {
        testY1 += step; testY2 -= step
      }
      
      const distSq1 = (testX1 - partnerX) ** 2 + (testY1 - partnerY) ** 2
      const distSq2 = (testX2 - partnerX) ** 2 + (testY2 - partnerY) ** 2
      
      // Set direction to whichever moves us further from the partner
      this.walkDir = distSq1 > distSq2 ? 1 : -1
    } else {
      this.resetDirSwitchTimer()
    }
    this.lastDirSwitchTime = performance.now()
  }

  canInteract(): boolean {
    return this.state === 'walking' && performance.now() >= this.nextInteractionAllowedTime
  }

  steerToward(targetX: number, targetY: number): void {
    let mvX = 0
    let mvY = 0
    if (this.edge === 'bottom') mvX = this.walkSpeed * this.walkDir
    else if (this.edge === 'right') mvY = -this.walkSpeed * this.walkDir
    else if (this.edge === 'top') mvX = -this.walkSpeed * this.walkDir
    else if (this.edge === 'left') mvY = this.walkSpeed * this.walkDir

    const toTargetX = targetX - this.x
    const toTargetY = targetY - this.y
    const dot = mvX * toTargetX + mvY * toTargetY

    if (dot < 0) {
      const now = performance.now()
      if (now - this.lastDirSwitchTime > 2500) {
        if (Math.random() < 0.005) {
          this.flipDirection()
        }
      }
    }
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
        this.x += this.walkSpeed * this.walkDir
        if (this.x >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.x = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'right'; this.y = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL - 1
        } else if (this.x <= EDGE_MARGIN + CORNER_TOL) {
          this.x = EDGE_MARGIN; this.edge = 'left'; this.y = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL - 1
        }
        break
      case 'right':
        this.y -= this.walkSpeed * this.walkDir
        if (this.y <= EDGE_MARGIN + CORNER_TOL) {
          this.y = EDGE_MARGIN; this.edge = 'top'; this.x = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL - 1
        } else if (this.y >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.y = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'bottom'; this.x = CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL - 1
        }
        break
      case 'top':
        this.x -= this.walkSpeed * this.walkDir
        if (this.x <= EDGE_MARGIN + CORNER_TOL) {
          this.x = EDGE_MARGIN; this.edge = 'left'; this.y = EDGE_MARGIN + CORNER_TOL + 1
        } else if (this.x >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.x = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'right'; this.y = EDGE_MARGIN + CORNER_TOL + 1
        }
        break
      case 'left':
        this.y += this.walkSpeed * this.walkDir
        if (this.y >= CANVAS_SIZE - EDGE_MARGIN - CORNER_TOL) {
          this.y = CANVAS_SIZE - EDGE_MARGIN; this.edge = 'bottom'; this.x = EDGE_MARGIN + CORNER_TOL + 1
        } else if (this.y <= EDGE_MARGIN + CORNER_TOL) {
          this.y = EDGE_MARGIN; this.edge = 'top'; this.x = EDGE_MARGIN + CORNER_TOL + 1
        }
        break
    }
  }

  private drawBody(color: number): void {
    if (!this.body) return
    // Body circle
    this.body.circle(0, 0, 28).fill({ color, alpha: 0.9 })
    // Eyes
    this.body.circle(-10, -8, 6).fill({ color: 0xffffff, alpha: 1 })
    this.body.circle(10, -8, 6).fill({ color: 0xffffff, alpha: 1 })
    this.body.circle(-10, -8, 3).fill({ color: 0x000000, alpha: 1 })
    this.body.circle(10, -8, 3).fill({ color: 0x000000, alpha: 1 })
  }
}
