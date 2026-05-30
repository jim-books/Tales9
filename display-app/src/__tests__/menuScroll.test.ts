import { describe, expect, it } from 'vitest'
import { menuScrollDelta, panelLocalDragY } from '../screens/menuScroll'

describe('menuScroll orientation mapping', () => {
  it('uses vertical screen drag for bottom-edge panels', () => {
    expect(menuScrollDelta('bottom', 0, -20)).toBe(20)
    expect(menuScrollDelta('bottom', 0, 20)).toBe(-20)
    expect(menuScrollDelta('bottom', 30, 0)).toBeCloseTo(0)
  })

  it('inverts vertical drag for top-edge panels', () => {
    expect(menuScrollDelta('top', 0, -20)).toBe(-20)
    expect(menuScrollDelta('top', 0, 20)).toBe(20)
  })

  it('uses horizontal screen drag for left-edge panels', () => {
    expect(menuScrollDelta('left', 20, 0)).toBe(20)
    expect(menuScrollDelta('left', -20, 0)).toBe(-20)
    expect(menuScrollDelta('left', 0, 30)).toBeCloseTo(0)
  })

  it('uses horizontal screen drag for right-edge panels', () => {
    expect(menuScrollDelta('right', 20, 0)).toBe(-20)
    expect(menuScrollDelta('right', -20, 0)).toBe(20)
    expect(menuScrollDelta('right', 0, 30)).toBeCloseTo(0)
  })

  it('derives drag threshold from panel-local vertical movement', () => {
    expect(Math.abs(panelLocalDragY('left', 12, 0))).toBe(12)
    expect(Math.abs(panelLocalDragY('bottom', 0, 12))).toBe(12)
  })
})
