import { describe, expect, it } from 'vitest'
import { isTapGesture } from '../components/UserNode'

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
