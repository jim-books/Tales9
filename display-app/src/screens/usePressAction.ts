import { useCallback, useRef } from 'react'

export interface PressActionHandlers<T extends HTMLElement> {
  onPointerUp: (e: React.PointerEvent<T>) => void
  onClick: () => void
}

export function usePressAction() {
  const suppressClickUntilRef = useRef(0)

  const makePressHandlers = useCallback(
    <T extends HTMLElement>(action: () => void): PressActionHandlers<T> => ({
      onPointerUp: (e: React.PointerEvent<T>) => {
        if (e.pointerType === 'mouse') return

        suppressClickUntilRef.current = Date.now() + 450
        action()
        e.preventDefault()
        e.stopPropagation()
      },
      onClick: () => {
        if (Date.now() < suppressClickUntilRef.current) return
        action()
      },
    }),
    [],
  )

  return { makePressHandlers }
}
