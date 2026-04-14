import { describe, it, expect } from 'vitest'
import { TrackingEngine, REMOVAL_DEBOUNCE_MS } from '../engine/TrackingEngine'
import { CalibrationMapper } from '../engine/CalibrationMapper'
import type { Point } from '../types'
import {
  COASTER_CONFIRM_FRAMES,
  COASTER_MM_TO_TOUCH_UNITS,
} from '../engine/CoasterTemplates'

const mapper = new CalibrationMapper()

function mm(v: number): number {
  return v * COASTER_MM_TO_TOUCH_UNITS
}

/** Generate C1 (60, 60, 60) equilateral triangle with centroid at (cx, cy). */
function makeC1Coaster(cx: number, cy: number): Point[] {
  const side = mm(60)
  const h = side * Math.sqrt(3) / 2
  return [
    { x: cx - side / 2, y: cy + h / 3 },
    { x: cx + side / 2, y: cy + h / 3 },
    { x: cx, y: cy - (2 * h) / 3 },
  ]
}

/** Generate C2 (55, 45, 45) isosceles triangle with centroid at (cx, cy). */
function makeC2Coaster(cx: number, cy: number): Point[] {
  const base = mm(55)
  const equal = mm(45)
  const halfBase = base / 2
  const h = Math.sqrt(equal ** 2 - halfBase ** 2)
  return [
    { x: cx - halfBase, y: cy + h / 3 },
    { x: cx + halfBase, y: cy + h / 3 },
    { x: cx, y: cy - (2 * h) / 3 },
  ]
}

describe('TrackingEngine', () => {
  it('starts new matched coaster in preview state', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeC1Coaster(0.5, 0.5)
    const result = engine.processFrame(pts)
    expect(result.coasters).toHaveLength(1)
    expect(result.coasters[0].active).toBe(true)
    expect(result.coasters[0].state).toBe('preview')
    expect(result.coasters[0].id).toBe('coaster-1')
    expect(result.events.some((e) => e.type === 'preview_started')).toBe(true)
  })

  it('confirms coaster after required temporal frames', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeC1Coaster(0.5, 0.5)
    let frame = engine.processFrame(pts)
    expect(frame.coasters[0].state).toBe('preview')
    for (let i = 1; i < COASTER_CONFIRM_FRAMES; i++) {
      frame = engine.processFrame(pts)
    }
    expect(frame.coasters[0].state).toBe('confirmed')
    expect(frame.events.some((e) => e.type === 'confirmed')).toBe(true)
  })

  it('assigns stable template IDs across consecutive frames', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeC2Coaster(0.5, 0.5)
    const first = engine.processFrame(pts)
    const second = engine.processFrame(pts)
    expect(first.coasters[0].id).toBe(second.coasters[0].id)
  })

  it('detects two distinct templates simultaneously', () => {
    const engine = new TrackingEngine(mapper)
    const pts = [
      ...makeC1Coaster(0.2, 0.2),
      ...makeC2Coaster(0.8, 0.8),
    ]
    const result = engine.processFrame(pts)
    expect(result.coasters).toHaveLength(2)
    const ids = result.coasters.map((c) => c.id).sort()
    expect(ids).toEqual(['coaster-1', 'coaster-2'])
  })

  it('rejects candidate cluster that does not match a known template', () => {
    const engine = new TrackingEngine(mapper)
    const tinyFingerish = [
      { x: 0.5, y: 0.5 },
      { x: 0.505, y: 0.5 },
      { x: 0.503, y: 0.502 },
    ]
    const result = engine.processFrame(tinyFingerish)
    expect(result.coasters).toHaveLength(0)
    expect(result.events.some((e) => e.type === 'rejected')).toBe(true)
  })

  it('marks coaster inactive when points disappear before debounce expiry', () => {
    const engine = new TrackingEngine(mapper)
    engine.processFrame(makeC1Coaster(0.5, 0.5))
    engine.processFrame(makeC1Coaster(0.5, 0.5))
    const result = engine.processFrame([])
    expect(result.coasters[0].active).toBe(false)
  })

  it('removes coaster after removal debounce window expires', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    engine.processFrame(makeC1Coaster(0.5, 0.5), t0)
    engine.processFrame(makeC1Coaster(0.5, 0.5), t0 + 16)
    engine.processFrame([], t0 + 1) // absent
    // Before debounce window: still in tracked set
    const before = engine.processFrame([], t0 + REMOVAL_DEBOUNCE_MS - 100)
    expect(before.coasters).toHaveLength(1)
    // After debounce window: purged
    const after = engine.processFrame([], t0 + REMOVAL_DEBOUNCE_MS + 100)
    expect(after.coasters).toHaveLength(0)
    expect(after.events.some((e) => e.type === 'removed')).toBe(true)
  })

  it('returns empty array for empty frame', () => {
    const engine = new TrackingEngine(mapper)
    expect(engine.processFrame([]).coasters).toHaveLength(0)
  })
})
