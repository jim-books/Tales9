import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PressableButton } from '../components/PressableButton'

function getPressableButton(): HTMLButtonElement {
  const button = screen.getByRole('button', { name: 'Press me' })
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected HTMLButtonElement')
  }
  Object.assign(button, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  })
  return button
}

describe('PressableButton', () => {
  it('fires onPress once for pointer tap and suppresses follow-up click', () => {
    const onPress = vi.fn()
    render(<PressableButton onPress={onPress}>Press me</PressableButton>)

    const button = getPressableButton()
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 100, clientY: 80 })
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 102, clientY: 81 })
    fireEvent.click(button)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not fire onPress for drag gestures that exceed slop', () => {
    const onPress = vi.fn()
    render(<PressableButton onPress={onPress}>Press me</PressableButton>)

    const button = getPressableButton()
    fireEvent.pointerDown(button, { pointerId: 2, clientX: 100, clientY: 80 })
    fireEvent.pointerMove(button, { pointerId: 2, clientX: 140, clientY: 120 })
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 140, clientY: 120 })

    expect(onPress).not.toHaveBeenCalled()
  })

  it('still supports keyboard/click activation fallback', () => {
    const onPress = vi.fn()
    render(<PressableButton onPress={onPress}>Press me</PressableButton>)

    const button = getPressableButton()
    fireEvent.click(button)

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
