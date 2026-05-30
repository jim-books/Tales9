import { describe, it, expect } from 'vitest'
import { spriteRegistry, getAllSpriteUrls, getFallWaitClip } from '../pixi/SpriteAnimDef'
import { AnimStateMachine, orientationForEdge } from '../pixi/FrameAnimPlayer'

describe('spriteRegistry', () => {
  it('has registered sprite characters with full clip sets', () => {
    expect(spriteRegistry.get('apple_tart')).toBeDefined()
    expect(spriteRegistry.get('irish_coffee')).toBeDefined()
    expect(spriteRegistry.get('mangosticky_rice')).toBeDefined()
    expect(spriteRegistry.get('peanut')).toBeDefined()
    expect(spriteRegistry.get('pistachio')).toBeDefined()
    expect(spriteRegistry.get('sb_cc')).toBeDefined()
    expect(spriteRegistry.get('tangyuan')).toBeDefined()
  })

  it('returns undefined for unregistered characters', () => {
    expect(spriteRegistry.get('pineapple')).toBeUndefined()
    expect(spriteRegistry.get('apple')).toBeUndefined()
  })

  it('irish_coffee fall frameset has 8 frames', () => {
    const def = spriteRegistry.get('irish_coffee')!
    expect(def.fall.frames).toHaveLength(8)
  })

  it('irish_coffee walk frameset has 4 frames', () => {
    const def = spriteRegistry.get('irish_coffee')!
    expect(def.walk.frames).toHaveLength(4)
  })

  it('irish_coffee wave frameset has 8 frames (FALL_WAIT clip)', () => {
    const def = spriteRegistry.get('irish_coffee')!
    expect(getFallWaitClip(def)?.frames).toHaveLength(8)
  })

  it('irish_coffee fall frames follow the /sprites/ path convention', () => {
    const def = spriteRegistry.get('irish_coffee')!
    for (const url of def.fall.frames) {
      expect(url).toMatch(/^\/sprites\/irish-coffee\/fall\/IrishCoffee8bitFall\d+\.png$/)
    }
  })

  it('irish_coffee walk frames follow the /sprites/ path convention', () => {
    const def = spriteRegistry.get('irish_coffee')!
    for (const url of def.walk.frames) {
      expect(url).toMatch(/^\/sprites\/irish-coffee\/walk\/IrishCoffee8bitWalk\d+\.png$/)
    }
  })

  it('irish_coffee fall loops is 2', () => {
    const def = spriteRegistry.get('irish_coffee')!
    expect(def.fall.loops).toBe(2)
  })

  it('irish_coffee walk loops is -1 (infinite)', () => {
    const def = spriteRegistry.get('irish_coffee')!
    expect(def.walk.loops).toBe(-1)
  })

  it('irish_coffee has a positive scale', () => {
    const def = spriteRegistry.get('irish_coffee')!
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

  it('peanut uses yawn frames as idle clip', () => {
    const def = spriteRegistry.get('peanut')!
    expect(def.idle?.frames[0]).toMatch(/Peanut8bitYawn1\.png$/)
  })

  it('tangyuan uses jump frames as idle clip', () => {
    const def = spriteRegistry.get('tangyuan')!
    expect(def.idle?.frames[0]).toMatch(/Tangyuan8bitJump1\.png$/)
  })
})

describe('getAllSpriteUrls', () => {
  /** apple 10+5+9 + irish 8+4+8 + mango 9+4+8 + peanut 8+4+8 + pistachio 8+4+8 + sb_cc 8+8+8 + tangyuan 8+4+8 */
  const EXPECTED_TOTAL_SPRITE_URLS =
    (10 + 5 + 9) + (8 + 4 + 8) + (9 + 4 + 8) + (8 + 4 + 8) + (8 + 4 + 8) + (8 + 8 + 8) + (8 + 4 + 8)

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

  it('includes irish-coffee wave paths for preload', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 8; i++) {
      expect(urls).toContain(`/sprites/irish-coffee/wave/IrishCoffee8bitWave${i}.png`)
    }
  })

  it('includes all 8 irish-coffee fall frame paths', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 8; i++) {
      expect(urls).toContain(`/sprites/irish-coffee/fall/IrishCoffee8bitFall${i}.png`)
    }
  })

  it('includes all 4 irish-coffee walk frame paths', () => {
    const urls = getAllSpriteUrls()
    for (let i = 1; i <= 4; i++) {
      expect(urls).toContain(`/sprites/irish-coffee/walk/IrishCoffee8bitWalk${i}.png`)
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

  it('counter-clockwise walking (walkDir = -1) flips scaleX for all edges', () => {
    const ob = orientationForEdge('bottom', -1)
    expect(ob.scaleX).toBe(-1)
    expect(ob.rotation).toBe(0)

    const ot = orientationForEdge('top', -1)
    expect(ot.scaleX).toBe(-1)
    expect(ot.rotation).toBeCloseTo(Math.PI)

    const or = orientationForEdge('right', -1)
    expect(or.scaleX).toBe(-1)
    expect(or.rotation).toBeCloseTo(-Math.PI / 2)

    const ol = orientationForEdge('left', -1)
    expect(ol.scaleX).toBe(-1)
    expect(ol.rotation).toBeCloseTo(Math.PI / 2)
  })
})
