import { describe, it, expect } from 'vitest'
import { TrackingEngine, REMOVAL_DEBOUNCE_MS } from '../engine/TrackingEngine'
import { CalibrationMapper } from '../engine/CalibrationMapper'
import type { Point } from '../types'
import {
  COASTER_CONFIRM_FRAMES,
  DEFAULT_COASTER_TEMPLATE_SPECS,
  COASTER_MM_TO_TOUCH_UNITS,
} from '../engine/CoasterTemplates'

const mapper = new CalibrationMapper()

function unitsToTouch(v: number): number {
  return v * COASTER_MM_TO_TOUCH_UNITS
}

function makeTemplateCoaster(templateId: 'coaster-1' | 'coaster-2', cx: number, cy: number): Point[] {
  const spec = DEFAULT_COASTER_TEMPLATE_SPECS.find((t) => t.id === templateId)
  if (!spec) throw new Error(`Missing template ${templateId}`)
  const [s1, s2, s3] = [...spec.sideLengthsMm].sort((a, b) => a - b)
  const a = unitsToTouch(s1) // BC
  const b = unitsToTouch(s2) // AC
  const c = unitsToTouch(s3) // AB (base)

  // Place A=(0,0), B=(c,0), solve C=(x,y)
  const x = (b * b + c * c - a * a) / (2 * c)
  const y = Math.sqrt(Math.max(b * b - x * x, 0))
  const A: Point = { x: 0, y: 0 }
  const B: Point = { x: c, y: 0 }
  const C: Point = { x, y }
  const centroid = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
  }
  return [
    { x: A.x - centroid.x + cx, y: A.y - centroid.y + cy },
    { x: B.x - centroid.x + cx, y: B.y - centroid.y + cy },
    { x: C.x - centroid.x + cx, y: C.y - centroid.y + cy },
  ]
}

describe('TrackingEngine', () => {
  it('starts new matched coaster in preview state', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeTemplateCoaster('coaster-1', 0.5, 0.5)
    const result = engine.processFrame(pts)
    expect(result.coasters).toHaveLength(1)
    expect(result.coasters[0].active).toBe(true)
    expect(result.coasters[0].state).toBe('preview')
    expect(result.coasters[0].id).toBe('coaster-1')
    expect(result.events.some((e) => e.type === 'preview_started')).toBe(true)
  })

  it('confirms coaster after required temporal frames', () => {
    const engine = new TrackingEngine(mapper)
    const pts = makeTemplateCoaster('coaster-1', 0.5, 0.5)
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
    const pts = makeTemplateCoaster('coaster-2', 0.5, 0.5)
    const first = engine.processFrame(pts)
    const second = engine.processFrame(pts)
    expect(first.coasters[0].id).toBe(second.coasters[0].id)
  })

  it('detects two distinct templates simultaneously', () => {
    const engine = new TrackingEngine(mapper)
    const pts = [
      ...makeTemplateCoaster('coaster-1', 0.2, 0.2),
      ...makeTemplateCoaster('coaster-2', 0.8, 0.8),
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
    engine.processFrame(makeTemplateCoaster('coaster-1', 0.5, 0.5))
    engine.processFrame(makeTemplateCoaster('coaster-1', 0.5, 0.5))
    const result = engine.processFrame([])
    expect(result.coasters[0].active).toBe(false)
  })

  it('removes coaster after removal debounce window expires', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    engine.processFrame(makeTemplateCoaster('coaster-1', 0.5, 0.5), t0)
    engine.processFrame(makeTemplateCoaster('coaster-1', 0.5, 0.5), t0 + 16)
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
