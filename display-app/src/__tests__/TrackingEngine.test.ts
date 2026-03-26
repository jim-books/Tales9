import { describe, it, expect } from 'vitest'
import { TrackingEngine, REMOVAL_DEBOUNCE_MS } from '../engine/TrackingEngine'
import { CalibrationMapper } from '../engine/CalibrationMapper'
import type { Point } from '../types'

const mapper = new CalibrationMapper()

/** Generate a symmetric coaster triangle (isoceles) */
function makeCoasterPoints(cx: number, cy: number, spread = 0.03): Point[] {
  return [
    { x: cx, y: cy },
    { x: cx + spread, y: cy },
    { x: cx + spread / 2, y: cy + spread },
  ]
}

/** Generate an asymmetric coaster triangle with clearly different side ratios */
function makeAsymmetricCoaster(cx: number, cy: number): Point[] {
  return [
    { x: cx, y: cy },
    { x: cx + 0.05, y: cy },           // 0.05 to the right
    { x: cx + 0.005, y: cy + 0.04 },  // mostly upward, slight right
  ]
}

describe('TrackingEngine', () => {
  it('detects a single coaster from three clustered points', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeCoasterPoints(0.5, 0.5)
    const result = engine.processFrame(pts)
    expect(result).toHaveLength(1)
    expect(result[0].active).toBe(true)
  })

  it('assigns stable IDs across consecutive frames', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeCoasterPoints(0.5, 0.5)
    const first = engine.processFrame(pts)
    const second = engine.processFrame(pts)
    expect(first[0].id).toBe(second[0].id)
  })

  it('detects two distinct coasters simultaneously', () => {
    const engine = new TrackingEngine(mapper)
    // Coasters must have different geometric signatures (different triangle shapes)
    const pts = [
      ...makeCoasterPoints(0.2, 0.2),         // symmetric (isoceles)
      ...makeAsymmetricCoaster(0.8, 0.8),      // asymmetric (scalene)
    ]
    const result = engine.processFrame(pts)
    expect(result).toHaveLength(2)
  })

  it('marks coaster inactive when points disappear', () => {
    const engine = new TrackingEngine(mapper)
    engine.processFrame(makeCoasterPoints(0.5, 0.5))
    const result = engine.processFrame([])
    expect(result[0].active).toBe(false)
  })

  it('removes coaster after removal debounce window expires', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    engine.processFrame(makeCoasterPoints(0.5, 0.5), t0)
    engine.processFrame([], t0 + 1) // absent
    // Before debounce window: still in tracked set
    const before = engine.processFrame([], t0 + REMOVAL_DEBOUNCE_MS - 100)
    expect(before).toHaveLength(1)
    // After debounce window: purged
    const after = engine.processFrame([], t0 + REMOVAL_DEBOUNCE_MS + 100)
    expect(after).toHaveLength(0)
  })

  it('returns empty array for empty frame', () => {
    const engine = new TrackingEngine(mapper)
    expect(engine.processFrame([])).toHaveLength(0)
  })
})
