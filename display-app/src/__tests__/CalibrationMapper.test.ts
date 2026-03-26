import { describe, it, expect } from 'vitest'
import { CalibrationMapper, CANVAS_SIZE } from '../engine/CalibrationMapper'
import type { CoasterTouchSignature } from '../types'

describe('CalibrationMapper', () => {
  it('maps normalised (0,0) to canvas origin', () => {
    const mapper = new CalibrationMapper()
    expect(mapper.map({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('maps normalised (1,1) to canvas bottom-right', () => {
    const mapper = new CalibrationMapper()
    expect(mapper.map({ x: 1, y: 1 })).toEqual({ x: CANVAS_SIZE, y: CANVAS_SIZE })
  })

  it('maps (0.5, 0.5) to canvas center', () => {
    const mapper = new CalibrationMapper()
    const result = mapper.map({ x: 0.5, y: 0.5 })
    expect(result.x).toBeCloseTo(CANVAS_SIZE / 2)
    expect(result.y).toBeCloseTo(CANVAS_SIZE / 2)
  })

  it('centroidOf computes average of three points then maps', () => {
    const mapper = new CalibrationMapper()
    const sig: CoasterTouchSignature = [
      { x: 0.2, y: 0.2 },
      { x: 0.4, y: 0.2 },
      { x: 0.3, y: 0.4 },
    ]
    const centroid = mapper.centroidOf(sig)
    // Raw centroid = (0.3, 0.2667) → mapped to canvas
    expect(centroid.x).toBeCloseTo(0.3 * CANVAS_SIZE)
    expect(centroid.y).toBeCloseTo((0.2 + 0.2 + 0.4) / 3 * CANVAS_SIZE)
  })

  it('distance between two points is Euclidean', () => {
    const d = CalibrationMapper.distance({ x: 0, y: 0 }, { x: 3, y: 4 })
    expect(d).toBeCloseTo(5)
  })

  it('respects custom input range', () => {
    const mapper = new CalibrationMapper({
      inputMin: { x: 100, y: 100 },
      inputMax: { x: 900, y: 900 },
    })
    const result = mapper.map({ x: 500, y: 500 })
    expect(result.x).toBeCloseTo(CANVAS_SIZE / 2)
    expect(result.y).toBeCloseTo(CANVAS_SIZE / 2)
  })
})
