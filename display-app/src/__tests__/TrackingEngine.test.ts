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

function makeTemplateCoaster(templateId: string, cx: number, cy: number): Point[] {
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
    expect(result.coasters[0].templateId).toBe('coaster-1')
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
    expect(first.coasters[0].id).toBe('coaster-2')
    expect(first.coasters[0].id).toBe(second.coasters[0].id)
    expect(second.coasters[0].templateId).toBe('coaster-2')
  })

  it('never creates duplicate confirmed coasters for the same template id', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    const pts = makeTemplateCoaster('coaster-1', 0.5, 0.5)
    for (let i = 0; i < COASTER_CONFIRM_FRAMES; i++) {
      engine.processFrame(pts, t0 + i * 16)
    }
    const confirmed = engine.processFrame(pts, t0 + 64)
    const coasterOnes = confirmed.coasters.filter((c) => c.templateId === 'coaster-1')
    expect(coasterOnes).toHaveLength(1)
    expect(coasterOnes[0].state).toBe('confirmed')
    expect(coasterOnes[0].id).toBe('coaster-1')
  })

  it('detects two distinct templates simultaneously', () => {
    const engine = new TrackingEngine(mapper)
    const pts = [
      ...makeTemplateCoaster('coaster-1', 0.2, 0.2),
      ...makeTemplateCoaster('coaster-2', 0.8, 0.8),
    ]
    const result = engine.processFrame(pts)
    expect(result.coasters).toHaveLength(2)
    const ids = result.coasters.map((c) => c.templateId).sort()
    expect(ids).toEqual(['coaster-1', 'coaster-2'])
  })

  it('rejects candidate cluster that does not match a known template', () => {
    const engine = new TrackingEngine(mapper)
    const fingerish = [
      { x: 0.5, y: 0.5 },
      { x: 0.64, y: 0.5 },
      { x: 0.635, y: 0.515 },
    ]
    const result = engine.processFrame(fingerish)
    expect(result.coasters).toHaveLength(0)
    expect(result.events.some((e) => e.type === 'rejected')).toBe(true)
  })

  it('stays lost until removal debounce expires', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    const pts = makeTemplateCoaster('coaster-1', 0.5, 0.5)
    engine.processFrame(pts, t0)
    engine.processFrame(pts, t0 + 16)
    engine.processFrame(pts, t0 + 32)
    const lost = engine.processFrame([], t0 + 200)
    expect(lost.coasters[0].state).toBe('lost')
    const stillLost = engine.processFrame([], t0 + REMOVAL_DEBOUNCE_MS - 100)
    expect(stillLost.coasters[0].state).toBe('lost')
  })

  it('removes coaster after removal debounce window expires', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 1000
    const pts = makeTemplateCoaster('coaster-1', 0.5, 0.5)
    engine.processFrame(pts, t0)
    engine.processFrame(pts, t0 + 16)
    engine.processFrame(pts, t0 + 32)
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

  it('keeps four moving coasters associated under noise', () => {
    const engine = new TrackingEngine(mapper)
    const idsByTemplate = new Map<string, string>()

    for (let frame = 0; frame < COASTER_CONFIRM_FRAMES + 2; frame++) {
      const drift = frame * 0.01
      const points = [
        ...makeTemplateCoaster('coaster-1', 0.2 + drift, 0.2),
        ...makeTemplateCoaster('coaster-2', 0.8 - drift, 0.2 + drift),
        ...makeTemplateCoaster('coaster-3', 0.2, 0.8 - drift),
        ...makeTemplateCoaster('coaster-4', 0.8, 0.8),
        { x: 0.5 + frame * 0.002, y: 0.5 }, // noise point
        { x: 0.15, y: 0.85 - frame * 0.001 }, // condensation-like stray point
      ]
      const result = engine.processFrame(points, frame * 16)
      const trackedTemplates = result.coasters.map((c) => c.templateId)
      expect(new Set(trackedTemplates).size).toBe(4)
      for (const coaster of result.coasters) {
        const prev = idsByTemplate.get(coaster.templateId)
        if (!prev) {
          idsByTemplate.set(coaster.templateId, coaster.id)
        } else {
          expect(coaster.id).toBe(prev)
        }
      }
    }
  })

  it('recovers same coaster instance after brief dropout', () => {
    const engine = new TrackingEngine(mapper)
    const t0 = 10_000
    const pts = makeTemplateCoaster('coaster-5', 0.55, 0.55)
    let frame = engine.processFrame(pts, t0)
    frame = engine.processFrame(pts, t0 + 16)
    frame = engine.processFrame(pts, t0 + 32)
    const confirmed = frame.coasters.find((c) => c.templateId === 'coaster-5')
    expect(confirmed?.state).toBe('confirmed')
    const instanceId = confirmed?.id
    expect(instanceId).toBe('coaster-5')

    const lost = engine.processFrame([], t0 + 500)
    expect(lost.coasters.find((c) => c.id === instanceId)?.state).toBe('lost')

    const moved = makeTemplateCoaster('coaster-5', 0.562, 0.56)
    // After a dropout, reacquisition requires a fresh confirm window.
    const recovered0 = engine.processFrame(moved, t0 + 800)
    const recoveredCoaster0 = recovered0.coasters.find((c) => c.templateId === 'coaster-5')
    expect(recoveredCoaster0?.id).toBe(instanceId)
    expect(recoveredCoaster0?.state).toBe('preview')

    engine.processFrame(moved, t0 + 816)
    const recovered2 = engine.processFrame(moved, t0 + 832)
    const recoveredCoaster2 = recovered2.coasters.find((c) => c.templateId === 'coaster-5')
    expect(recoveredCoaster2?.id).toBe(instanceId)
    expect(recoveredCoaster2?.state).toBe('confirmed')
  })
})
