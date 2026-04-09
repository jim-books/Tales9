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

/** Captured from debug panel: should map to coaster-4 */
const DEBUG_CLUSTER_1: Point[] = [
  { x: 0.372, y: 0.288 },
  { x: 0.405, y: 0.377 },
  { x: 0.334, y: 0.375 },
]

/** Captured from debug panel: should map to coaster-1 */
const DEBUG_CLUSTER_2: Point[] = [
  { x: 0.613, y: 0.581 },
  { x: 0.684, y: 0.651 },
  { x: 0.586, y: 0.681 },
]

function jitter(points: Point[], dx: number, dy: number): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
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

  it('maps calibrated signatures to known coaster IDs', () => {
    const engine = new TrackingEngine(mapper)
    const result = engine.processFrame([...DEBUG_CLUSTER_1, ...DEBUG_CLUSTER_2])
    const ids = result.map((c) => c.id)

    expect(ids).toContain('coaster-4')
    expect(ids).toContain('coaster-1')
  })

  it('keeps known coaster IDs stable with small touch jitter', () => {
    const engine = new TrackingEngine(mapper)
    engine.processFrame([...DEBUG_CLUSTER_1, ...DEBUG_CLUSTER_2])

    const frame2 = engine.processFrame([
      ...jitter(DEBUG_CLUSTER_2, 0.001, -0.001),
      ...jitter(DEBUG_CLUSTER_1, -0.001, 0.001),
    ])
    const ids = frame2.filter((c) => c.active).map((c) => c.id)

    expect(ids).toContain('coaster-4')
    expect(ids).toContain('coaster-1')
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
