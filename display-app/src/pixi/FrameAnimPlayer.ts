import { AnimatedSprite, Assets, Container, Texture, type Ticker } from 'pixi.js'
import { getFallWaitClip, type SpriteAnimDef } from './SpriteAnimDef'

export type WalkEdge = 'top' | 'right' | 'bottom' | 'left'

// ─── Pure state machine (no PixiJS — fully testable) ─────────────────────────

export type AnimPhase = 'FALL_ANIM' | 'FALL_WAIT' | 'WALK'

/**
 * AnimStateMachine
 *
 * Tracks the drop→walk lifecycle purely as data. FrameAnimPlayer drives this
 * from AnimatedSprite callbacks; the logic is kept separate so it can be
 * unit-tested without a renderer.
 *
 * Transitions:
 *   FALL_ANIM ──(physics landed, loops < 2)──► FALL_WAIT
 *   FALL_ANIM ──(physics landed, loops ≥ 2)──► WALK (direct)
 *   FALL_WAIT ──(2nd onLoop fires)───────────► WALK
 *   WALK is terminal.
 */
export class AnimStateMachine {
  phase: AnimPhase = 'FALL_ANIM'
  loopsCompleted = 0

  /** Called each time the active clip wraps back to frame 0. */
  onLoop(): void {
    if (this.phase === 'WALK') return
    this.loopsCompleted++
    if (this.phase === 'FALL_WAIT' && this.loopsCompleted >= 2) {
      this.phase = 'WALK'
    }
  }

  /** Called by FrameAnimPlayer when IngredientSprite physics reaches the edge. */
  onPhysicsLanded(): void {
    if (this.phase === 'WALK') return
    if (this.loopsCompleted >= 2) {
      this.phase = 'WALK'
    } else {
      this.phase = 'FALL_WAIT'
    }
  }

  get readyToWalk(): boolean {
    return this.phase === 'WALK'
  }
}

// ─── Orientation helper (pure — testable) ────────────────────────────────────

/**
 * Returns the scaleX and rotation to apply to the walk sprite so it faces the
 * direction of clockwise perimeter travel on a y-down 1900×1900 canvas.
 *
 * Assumes anchor(0.5, 1.0) — feet at the registration point, body extends
 * in the local -y direction. Each rotation ensures the body extends INTO the
 * canvas (away from the edge) and the character faces its direction of travel.
 *
 * PixiJS rotation is CW-positive, y-down:
 *   bottom → right (+x) : rotation=0      body goes up    (-y→-y)   faces right ✓
 *   right  → up   (-y)  : rotation=-π/2   body goes left  (-y→-x)   faces up    ✓
 *   top    → left (-x)  : rotation=π      body goes down  (-y→+y)   faces left  ✓
 *   left   → down (+y)  : rotation=+π/2   body goes right (-y→+x)   faces down  ✓
 */
export function orientationForEdge(edge: WalkEdge): { scaleX: 1 | -1; rotation: number } {
  switch (edge) {
    case 'bottom': return { scaleX: 1, rotation: 0 }
    case 'right':  return { scaleX: 1, rotation: -Math.PI / 2 }
    case 'top':    return { scaleX: 1, rotation: Math.PI }
    case 'left':   return { scaleX: 1, rotation: Math.PI / 2 }
  }
}

// ─── FrameAnimPlayer ─────────────────────────────────────────────────────────

/**
 * FrameAnimPlayer
 *
 * Manages AnimatedSprite clips for one IngredientSprite: fall, optional fall-wait
 * (idle or wave), then walk. Textures must already be in the Assets cache when
 * this is constructed (pre-loaded by PixiStage on startup).
 *
 * autoUpdate is set to false on sprites — the caller must pass the Ticker to
 * tick() each frame so all animation is driven by the shared app ticker.
 */
export class FrameAnimPlayer {
  private readonly fallSprite: AnimatedSprite
  private readonly walkSprite: AnimatedSprite
  private readonly fallWaitSprite: AnimatedSprite | null
  private readonly container: Container
  private readonly stateMachine = new AnimStateMachine()
  private walkingMounted = false

  constructor(def: SpriteAnimDef, container: Container) {
    this.container = container

    const loopHandler = (): void => {
      this.stateMachine.onLoop()
      if (this.stateMachine.readyToWalk) {
        this.switchToWalk()
      }
    }

    // Build textures from cache (Assets.load already called by PixiStage)
    const fallTextures = def.fall.frames.map((url) => {
      const tex = Assets.get<Texture>(url)
      if (!tex) throw new Error(`FrameAnimPlayer: texture not cached for ${url}`)
      return tex
    })
    const walkTextures = def.walk.frames.map((url) => {
      const tex = Assets.get<Texture>(url)
      if (!tex) throw new Error(`FrameAnimPlayer: texture not cached for ${url}`)
      return tex
    })

    const waitDef = getFallWaitClip(def)
    if (waitDef) {
      const waitTextures = waitDef.frames.map((url) => {
        const tex = Assets.get<Texture>(url)
        if (!tex) throw new Error(`FrameAnimPlayer: texture not cached for ${url}`)
        return tex
      })
      this.fallWaitSprite = new AnimatedSprite(waitTextures)
      this.fallWaitSprite.autoUpdate = false
      this.fallWaitSprite.animationSpeed = waitDef.animationSpeed
      this.fallWaitSprite.anchor.set(0.5, 1.0)
      this.fallWaitSprite.scale.set(def.scale)
      this.fallWaitSprite.loop = true
      this.fallWaitSprite.onLoop = loopHandler
    } else {
      this.fallWaitSprite = null
    }

    this.fallSprite = new AnimatedSprite(fallTextures)
    this.fallSprite.autoUpdate = false
    this.fallSprite.animationSpeed = def.fall.animationSpeed
    this.fallSprite.anchor.set(0.5, 1.0)
    this.fallSprite.scale.set(def.scale)
    this.fallSprite.loop = true  // onLoop fires each cycle; we stop externally
    this.fallSprite.onLoop = loopHandler
    this.fallSprite.play()
    container.addChild(this.fallSprite)

    this.walkSprite = new AnimatedSprite(walkTextures)
    this.walkSprite.autoUpdate = false
    this.walkSprite.animationSpeed = def.walk.animationSpeed
    this.walkSprite.anchor.set(0.5, 1.0)
    this.walkSprite.scale.set(def.scale)
    this.walkSprite.loop = true
    this.walkSprite.play()
    // Walk sprite added to container only on transition
  }

  /** Called by IngredientSprite when its drop physics reaches the landing position. */
  notifyPhysicsLanded(): void {
    this.stateMachine.onPhysicsLanded()
    if (
      this.fallWaitSprite &&
      this.stateMachine.phase === 'FALL_WAIT'
    ) {
      this.fallSprite.stop()
      if (this.fallSprite.parent) {
        this.container.removeChild(this.fallSprite)
      }
      this.container.addChild(this.fallWaitSprite)
      this.fallWaitSprite.play()
    }
    if (this.stateMachine.readyToWalk) {
      this.switchToWalk()
    }
  }

  /**
   * Called by IngredientSprite each tick during the walk phase.
   * Applies the correct flip/rotation so the sprite faces its direction of travel.
   */
  updateWalkOrientation(edge: WalkEdge): void {
    if (!this.isWalking) return
    const { scaleX, rotation } = orientationForEdge(edge)
    this.walkSprite.scale.x = Math.abs(this.walkSprite.scale.x) * scaleX
    this.walkSprite.rotation = rotation
  }

  /** Drives the active AnimatedSprite. Must be called every tick. */
  tick(ticker: Ticker): void {
    if (this.isWalking) {
      this.walkSprite.update(ticker)
    } else if (
      this.stateMachine.phase === 'FALL_WAIT' &&
      this.fallWaitSprite?.parent
    ) {
      this.fallWaitSprite.update(ticker)
    } else {
      this.fallSprite.update(ticker)
    }
  }

  /** True once the walk phase has begun. */
  get isWalking(): boolean {
    return this.stateMachine.readyToWalk
  }

  /** Destroys AnimatedSprite instances. Does NOT destroy textures (cache owns them). */
  destroy(): void {
    this.fallSprite.destroy({ texture: false, textureSource: false })
    this.walkSprite.destroy({ texture: false, textureSource: false })
    this.fallWaitSprite?.destroy({ texture: false, textureSource: false })
  }

  private switchToWalk(): void {
    if (this.walkingMounted) return
    this.walkingMounted = true
    this.fallSprite.stop()
    this.fallWaitSprite?.stop()
    if (this.fallSprite.parent) {
      this.container.removeChild(this.fallSprite)
    }
    if (this.fallWaitSprite?.parent) {
      this.container.removeChild(this.fallWaitSprite)
    }
    this.container.addChild(this.walkSprite)
  }
}
