import { describe, it, expect } from 'vitest'
import { spriteRegistry, getAllSpriteUrls, getFallWaitClip } from '../pixi/SpriteAnimDef'
import { AnimStateMachine, orientationForEdge } from '../pixi/FrameAnimPlayer'

describe('spriteRegistry', () => {
  it('has registered sprite characters with full clip sets', () => {
    expect(spriteRegistry.get('apple')).toBeDefined()
    expect(spriteRegistry.get('mangosticky_rice')).toBeDefined()
    expect(spriteRegistry.get('sb_cc')).toBeDefined()
  })

  it('returns undefined for unregistered characters', () => {
    expect(spriteRegistry.get('pineapple')).toBeUndefined()
    expect(spriteRegistry.get('peach')).toBeUndefined()
    expect(spriteRegistry.get('coffee_bean')).toBeUndefined()
  })

  it('apple fall frameset has 10 frames', () => {
    const def = spriteRegistry.get('apple')!
    expect(def.fall.frames).toHaveLength(10)
  })

  it('apple walk frameset has 5 frames', () => {
    const def = spriteRegistry.get('apple')!
    expect(def.walk.frames).toHaveLength(5)
  })

  it('apple wave frameset has 9 frames (FALL_WAIT clip)', () => {
    const def = spriteRegistry.get('apple')!
    expect(getFallWaitClip(def)?.frames).toHaveLength(9)
  })

  it('apple fall frames follow the /sprites/ path convention', () => {
    const def = spriteRegistry.get('apple')!
    for (const url of def.fall.frames) {
      expect(url).toMatch(/^\/sprites\/apple-tart\/fall\/Apple8bitFallSep\d+\.png$/)
    }
  })

  it('apple walk frames follow the /sprites/ path convention', () => {
    const def = spriteRegistry.get('apple')!
    for (const url of def.walk.frames) {
      expect(url).toMatch(/^\/sprites\/apple-tart\/walk\/Apple8bitWalkSep\d+\.png$/)
    }
  })

  it('apple fall loops is 2', () => {
    const def = spriteRegistry.get('apple')!
    expect(def.fall.loops).toBe(2)
  })

  it('apple walk loops is -1 (infinite)', () => {
    const def = spriteRegistry.get('apple')!
    expect(def.walk.loops).toBe(-1)
  })

  it('apple has a positive scale', () => {
    const def = spriteRegistry.get('apple')!
    expect(def.scale).toBeGreaterThan(0)
  })

  it('mangosticky_rice fall/walk/idle frame counts match shipped assets', () => {
    const def = spriteRegistry.get('mangosticky_rice')!
    expect(def.fall.frames).toHaveLength(9)
    expect(def.walk.frames).toHaveLength(4)
    expect(getFallWaitClip(def)?.frames).toHaveLength(8)
  })

  it('sb_cc fall/walk/idle frame counts match shipped assets', () => {
    const def = spriteRegistry.get('sb_cc')!
    expect(def.fall.frames).toHaveLength(8)
    expect(def.walk.frames).toHaveLength(8)
    expect(getFallWaitClip(def)?.frames).toHaveLength(8)
  })
})

describe('getAllSpriteUrls', () => {
  /** apple 10+5+9 + mangosticky 9+4+8 + sb_cc 8+8+8 */
  const EXPECTED_TOTAL_SPRITE_URLS =
    (10 + 5 + 9) + (9 + 4 + 8) + (8 + 8 + 8)

  it('returns all preload URLs for fall + walk + fall-wait clips', () => {
    expect(getAllSpriteUrls()).toHaveLength(EXPECTED_TOTAL_SPRITE_URLS)
  })

  it('returns unique URLs', () => {
    const urls = getAllSpriteUrls()
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('all returned URLs start with /sprites/', () => {
    for (const url of getAllSpriteUrls()) {
      expect(url).toMatch(/^\/sprites\//)
    }
  })

  it('includes apple-tart wave paths for preload', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 9; i++) {
      expect(urls).toContain(`/sprites/apple-tart/wave/Apple8bitWave${i}.png`)
    }
  })

  it('includes all 10 apple fall frame paths', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 10; i++) {
      expect(urls).toContain(`/sprites/apple-tart/fall/Apple8bitFallSep${i}.png`)
    }
  })

  it('includes all 5 apple walk frame paths', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 5; i++) {
      expect(urls).toContain(`/sprites/apple-tart/walk/Apple8bitWalkSep${i}.png`)
    }
  })
})

describe('AnimStateMachine', () => {
  it('starts in FALL_ANIM phase with 0 loops completed', () => {
    const sm = new AnimStateMachine()
    expect(sm.phase).toBe('FALL_ANIM')
    expect(sm.loopsCompleted).toBe(0)
    expect(sm.readyToWalk).toBe(false)
  })

  it('onLoop increments loopsCompleted', () => {
    const sm = new AnimStateMachine()
    sm.onLoop()
    expect(sm.loopsCompleted).toBe(1)
  })

  it('two onLoop calls in FALL_ANIM do not yet transition (no physics landed)', () => {
    const sm = new AnimStateMachine()
    sm.onLoop()
    sm.onLoop()
    // Still in FALL_ANIM until physics lands
    expect(sm.phase).toBe('FALL_ANIM')
    expect(sm.readyToWalk).toBe(false)
  })

  it('onPhysicsLanded before 2 loops transitions to FALL_WAIT', () => {
    const sm = new AnimStateMachine()
    sm.onLoop()        // 1 loop
    sm.onPhysicsLanded()
    expect(sm.phase).toBe('FALL_WAIT')
    expect(sm.readyToWalk).toBe(false)
  })

  it('onPhysicsLanded after 2+ loops transitions directly to WALK', () => {
    const sm = new AnimStateMachine()
    sm.onLoop()
    sm.onLoop()
    sm.onPhysicsLanded()
    expect(sm.phase).toBe('WALK')
    expect(sm.readyToWalk).toBe(true)
  })

  it('second onLoop in FALL_WAIT transitions to WALK', () => {
    const sm = new AnimStateMachine()
    sm.onLoop()           // loop 1 → still FALL_ANIM
    sm.onPhysicsLanded()  // → FALL_WAIT
    sm.onLoop()           // loop 2 → WALK
    expect(sm.phase).toBe('WALK')
    expect(sm.readyToWalk).toBe(true)
  })

  it('phase does not regress from WALK back to FALL_ANIM', () => {
    const sm = new AnimStateMachine()
    sm.onLoop(); sm.onLoop(); sm.onPhysicsLanded()
    expect(sm.phase).toBe('WALK')
    sm.onLoop()
    sm.onPhysicsLanded()
    expect(sm.phase).toBe('WALK')
  })
})

describe('orientationForEdge', () => {
  it('bottom edge: no flip, no rotation', () => {
    const o = orientationForEdge('bottom')
    expect(o.scaleX).toBe(1)
    expect(o.rotation).toBe(0)
  })

  it('top edge: no flip, π rotation (body extends down into canvas, character faces left)', () => {
    const o = orientationForEdge('top')
    expect(o.scaleX).toBe(1)
    expect(o.rotation).toBeCloseTo(Math.PI)
  })

  it('right edge: no flip, -π/2 rotation (body extends left into canvas, character faces up)', () => {
    const o = orientationForEdge('right')
    expect(o.scaleX).toBe(1)
    expect(o.rotation).toBeCloseTo(-Math.PI / 2)
  })

  it('left edge: no flip, +π/2 rotation (body extends right into canvas, character faces down)', () => {
    const o = orientationForEdge('left')
    expect(o.scaleX).toBe(1)
    expect(o.rotation).toBeCloseTo(Math.PI / 2)
  })
})
