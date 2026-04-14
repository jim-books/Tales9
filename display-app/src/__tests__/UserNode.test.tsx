import { describe, expect, it } from 'vitest'
import {
  isTapGesture,
  nearestEdgeResult,
  resolveViewEdge,
  approachEdgeFromDelta,
  rotationForEdge,
  panelAnchorStyleForEdge,
  panelTransformForEdge,
} from '../components/UserNode'

describe('UserNode gesture classifier', () => {
  it('keeps small IR-style jitter within tap tolerance', () => {
    expect(
      isTapGesture(
        { x: 400, y: 500 },
        { x: 409, y: 510 },
        false,
      ),
    ).toBe(true)
  })

  it('rejects drags once movement exceeds the tolerance', () => {
    expect(
      isTapGesture(
        { x: 400, y: 500 },
        { x: 420, y: 525 },
        false,
      ),
    ).toBe(false)
  })

  it('rejects the gesture once dragging was already detected', () => {
    expect(
      isTapGesture(
        { x: 400, y: 500 },
        { x: 404, y: 504 },
        true,
      ),
    ).toBe(false)
  })
})

describe('UserNode orientation resolver', () => {
  it('prefers a clear nearest edge winner', () => {
    const nearest = nearestEdgeResult({ x: 0.95, y: 0.4 })
    expect(nearest.edge).toBe('right')
    expect(nearest.ambiguous).toBe(false)
    expect(
      resolveViewEdge(
        { x: 0.95, y: 0.4 },
        'left',
        'bottom',
        null,
      ),
    ).toBe('right')
  })

  it('uses approach edge for ambiguous corner placements', () => {
    const nearest = nearestEdgeResult({ x: 0.92, y: 0.91 })
    expect(nearest.ambiguous).toBe(true)
    expect(
      resolveViewEdge(
        { x: 0.92, y: 0.91 },
        'bottom',
        'bottom',
        'right',
      ),
    ).toBe('right')
  })

  it('keeps previous edge when ambiguous and no approach signal', () => {
    expect(
      resolveViewEdge(
        { x: 0.92, y: 0.91 },
        'left',
        'bottom',
        null,
      ),
    ).toBe('left')
  })

  it('falls back to owner edge when ambiguity has no other signal', () => {
    expect(
      resolveViewEdge(
        { x: 0.08, y: 0.08 },
        null,
        'top',
        null,
      ),
    ).toBe('top')
  })

  it('maps final drag deltas into an approach edge', () => {
    expect(approachEdgeFromDelta(12, 3)).toBe('right')
    expect(approachEdgeFromDelta(-11, 2)).toBe('left')
    expect(approachEdgeFromDelta(1, 14)).toBe('bottom')
    expect(approachEdgeFromDelta(0, -15)).toBe('top')
    expect(approachEdgeFromDelta(2, 1)).toBeNull()
  })

  it('uses discrete edge rotations for panel and badge readability', () => {
    expect(rotationForEdge('bottom')).toBe(0)
    expect(rotationForEdge('right')).toBe(-90)
    expect(rotationForEdge('top')).toBe(180)
    expect(rotationForEdge('left')).toBe(90)
  })

  it('anchors top/bottom panels beside the node using left/right-side logic', () => {
    expect(panelAnchorStyleForEdge('bottom', 0.25)).toMatchObject({
      left: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
    expect(panelAnchorStyleForEdge('top', 0.25)).toMatchObject({
      left: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
    expect(panelAnchorStyleForEdge('bottom', 0.75)).toMatchObject({
      right: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
    expect(panelAnchorStyleForEdge('top', 0.75)).toMatchObject({
      right: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
    expect(panelAnchorStyleForEdge('left')).toMatchObject({
      left: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
    expect(panelAnchorStyleForEdge('right')).toMatchObject({
      right: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    })
  })

  it('keeps rotation on panel surface transform only', () => {
    expect(panelTransformForEdge('bottom')).toBe('rotate(0deg)')
    expect(panelTransformForEdge('right')).toBe('rotate(-90deg)')
    expect(panelTransformForEdge('top')).toBe('rotate(180deg)')
    expect(panelTransformForEdge('left')).toBe('rotate(90deg)')
  })
})
