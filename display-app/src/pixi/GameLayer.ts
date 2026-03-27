import { Application, Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import type { GameType, Point } from '../types'

const CENTER: Point = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }
const SPIN_DURATION = 4000  // ms — Truth or Dare arrow spin
const KING_FLY_DURATION = 1500  // ms — crowns fly to positions
const KING_CHOOSE_DURATION = 1500  // ms — winner pulses, others fade

type AnimState = 'idle' | 'spinning' | 'king-flying' | 'king-choosing'

interface CrownObject {
  container: Container
  crown: Graphics
}

/**
 * GameLayer
 *
 * PixiJS animations for Truth or Dare (spinning arrow) and King's Game (crown bounce).
 * Mounts to app.stage. Self-ticks via app.ticker. Call stop() to clear all visuals.
 */
export class GameLayer {
  readonly container: Container
  private readonly spotlightG: Graphics
  private labelText: Text | null = null

  private arrowContainer: Container | null = null
  private crownObjects: CrownObject[] = []

  private animState: AnimState = 'idle'
  private elapsed = 0
  private totalRotation = 0
  private winnerIdx = 0
  private winnerPositions: Point[] = []
  private onComplete: ((idx: number) => void) | null = null

  private readonly tickerCb: (t: Ticker) => void

  constructor(private readonly app: Application) {
    this.container = new Container()
    this.spotlightG = new Graphics()
    this.container.addChild(this.spotlightG)
    this.tickerCb = (t: Ticker) => this.tick(t)
    this.app.ticker.add(this.tickerCb)
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

  /**
   * Halt any running animation and clear all visuals.
   */
  stop(): void {
    if (this.arrowContainer) {
      this.container.removeChild(this.arrowContainer)
      this.arrowContainer.destroy({ children: true })
      this.arrowContainer = null
    }
    for (const c of this.crownObjects) {
      this.container.removeChild(c.container)
      c.container.destroy({ children: true })
    }
    this.crownObjects = []
    this.hideSpotlight()
    this.animState = 'idle'
    this.onComplete = null
  }

  /**
   * Spin a directional arrow from center, slowing to land on a random user position.
   * Calls onChosen(idx) when the arrow stops.
   */
  startTruthOrDare(positions: Point[], onChosen: (idx: number) => void): void {
    this.stop()
    if (positions.length === 0) return

    this.winnerIdx = Math.floor(Math.random() * positions.length)
    this.winnerPositions = positions
    this.onComplete = onChosen
    this.elapsed = 0

    // Compute rotation so arrow (pointing "up" at rotation=0) ends facing winner
    const w = positions[this.winnerIdx]
    const targetAngle = Math.atan2(w.y - CENTER.y, w.x - CENTER.x) + Math.PI / 2
    // 3 full spins + land at target angle
    this.totalRotation = Math.PI * 6 + targetAngle

    const arrowContainer = new Container()
    arrowContainer.x = CENTER.x
    arrowContainer.y = CENTER.y

    const arrow = new Graphics()
    // Arrow head: triangle pointing up in local space
    arrow.poly([-18, 60, 0, -120, 18, 60, 0, -10]).fill({ color: 0xff3344, alpha: 0.92 })
    // Pivot dot
    arrow.circle(0, 0, 14).fill({ color: 0xffffff, alpha: 0.7 })

    arrowContainer.addChild(arrow)
    this.container.addChild(arrowContainer)
    this.arrowContainer = arrowContainer
    this.animState = 'spinning'
  }

  /**
   * Animate N crowns flying from center to each user position.
   * Winner's crown pulses and stays; others fade. Calls onChosen(idx) when done.
   */
  startKingsGame(positions: Point[], onChosen: (idx: number) => void): void {
    this.stop()
    if (positions.length === 0) return

    this.winnerIdx = Math.floor(Math.random() * positions.length)
    this.winnerPositions = positions
    this.onComplete = onChosen
    this.elapsed = 0

    this.crownObjects = positions.map((_, i) => {
      const container = new Container()
      container.x = CENTER.x
      container.y = CENTER.y

      const isWinner = i === this.winnerIdx
      const crown = this.buildCrown(isWinner ? 0xffd700 : 0x888888)
      container.addChild(crown)
      this.container.addChild(container)
      return { container, crown }
    })

    this.animState = 'king-flying'
  }

  /**
   * Render a spotlight glow and text label at the given canvas position.
   */
  showSpotlight(position: Point, label: string): void {
    this.spotlightG.clear()
    if (this.labelText) {
      this.container.removeChild(this.labelText)
      this.labelText.destroy()
      this.labelText = null
    }

    // Layered glow rings
    for (let i = 4; i >= 1; i--) {
      this.spotlightG
        .circle(position.x, position.y, i * 55)
        .fill({ color: 0xffffff, alpha: 0.05 * i })
    }
    this.spotlightG.circle(position.x, position.y, 44).fill({ color: 0xffffff, alpha: 0.22 })

    const style = new TextStyle({ fontSize: 38, fill: '#ffffff', fontWeight: 'bold', align: 'center' })
    this.labelText = new Text({ text: label, style })
    this.labelText.anchor.set(0.5, 0.5)
    this.labelText.x = position.x
    this.labelText.y = position.y - 110
    this.container.addChild(this.labelText)
  }

  hideSpotlight(): void {
    this.spotlightG.clear()
    if (this.labelText) {
      this.container.removeChild(this.labelText)
      this.labelText.destroy()
      this.labelText = null
    }
  }

  destroy(): void {
    this.app.ticker.remove(this.tickerCb)
    this.container.destroy({ children: true })
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private tick(ticker: Ticker): void {
    if (this.animState === 'idle') return
    this.elapsed += ticker.deltaMS

    if (this.animState === 'spinning') {
      this.tickSpinning()
    } else if (this.animState === 'king-flying') {
      this.tickKingFlying()
    } else if (this.animState === 'king-choosing') {
      this.tickKingChoosing()
    }
  }

  private tickSpinning(): void {
    const progress = Math.min(this.elapsed / SPIN_DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 3)  // ease-out cubic
    if (this.arrowContainer) {
      this.arrowContainer.rotation = eased * this.totalRotation
    }
    if (progress >= 1) {
      this.animState = 'idle'
      const cb = this.onComplete
      this.onComplete = null
      cb?.(this.winnerIdx)
    }
  }

  private tickKingFlying(): void {
    const progress = Math.min(this.elapsed / KING_FLY_DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 2)  // ease-out quad
    for (let i = 0; i < this.crownObjects.length; i++) {
      const { container } = this.crownObjects[i]
      const target = this.winnerPositions[i]
      container.x = CENTER.x + (target.x - CENTER.x) * eased
      container.y = CENTER.y + (target.y - CENTER.y) * eased
    }
    if (progress >= 1) {
      this.animState = 'king-choosing'
      this.elapsed = 0
    }
  }

  private tickKingChoosing(): void {
    const progress = Math.min(this.elapsed / KING_CHOOSE_DURATION, 1)
    for (let i = 0; i < this.crownObjects.length; i++) {
      const { container } = this.crownObjects[i]
      if (i === this.winnerIdx) {
        container.scale.set(1 + 0.3 * Math.sin(progress * Math.PI * 5))
        container.alpha = 1
      } else {
        container.alpha = Math.max(0, 1 - progress * 2)
      }
    }
    if (progress >= 1) {
      this.animState = 'idle'
      const cb = this.onComplete
      this.onComplete = null
      cb?.(this.winnerIdx)
    }
  }

  /** Draw a simple crown shape with 3 spikes, centered at origin. */
  private buildCrown(color: number): Graphics {
    const g = new Graphics()
    // Crown silhouette: base + 3 upward spikes, centred at (0, 0)
    g.poly([
      -32, 12,   // bottom-left
      -32, -6,   // top of base-left
      -20, -28,  // tip of left spike
      -9,  -6,   // inner-left valley
       0,  -40,  // tip of centre spike
       9,  -6,   // inner-right valley
       20, -28,  // tip of right spike
       32, -6,   // top of base-right
       32, 12,   // bottom-right
    ]).fill({ color, alpha: 0.95 })
    return g
  }

  // Kept for potential external callers that pass gameType as a string
  getType(): GameType | null {
    if (this.animState === 'idle' && this.crownObjects.length === 0 && !this.arrowContainer) {
      return null
    }
    return this.crownObjects.length > 0 ? 'kings_game' : 'truth_or_dare'
  }
}
