import { useCallback, useRef } from 'react'
import type {
  ButtonHTMLAttributes,
  PointerEvent as ReactPointerEvent,
} from 'react'

interface PressableButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onPress: () => void
  tapSlopPx?: number
}

const DEFAULT_TAP_SLOP_PX = 16

interface PointerPoint {
  x: number
  y: number
}

export function PressableButton({
  onPress,
  tapSlopPx = DEFAULT_TAP_SLOP_PX,
  ...buttonProps
}: PressableButtonProps): JSX.Element {
  const pointerStartRef = useRef<PointerPoint | null>(null)
  const draggedRef = useRef(false)
  const suppressClickRef = useRef(false)

  const resetGesture = (): void => {
    pointerStartRef.current = null
    draggedRef.current = false
  }

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    draggedRef.current = false
    suppressClickRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const start = pointerStartRef.current
      if (!start || draggedRef.current) return

      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) >= tapSlopPx) {
        draggedRef.current = true
      }
    },
    [tapSlopPx],
  )

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const start = pointerStartRef.current
      const isTap =
        start !== null &&
        !draggedRef.current &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) < tapSlopPx

      e.currentTarget.releasePointerCapture(e.pointerId)
      resetGesture()

      if (!isTap) return
      suppressClickRef.current = true
      onPress()
    },
    [onPress, tapSlopPx],
  )

  const handlePointerCancel = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    resetGesture()
    suppressClickRef.current = false
  }, [])

  const handleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onPress()
  }, [onPress])

  return (
    <button
      {...buttonProps}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
    />
  )
}
