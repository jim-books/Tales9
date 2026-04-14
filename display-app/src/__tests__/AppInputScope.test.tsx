import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import App from '../App'

const { attachSpy, detachSpy } = vi.hoisted(() => ({
  attachSpy: vi.fn(),
  detachSpy: vi.fn(),
}))

vi.mock('../engine/InputAdapter', () => ({
  InputAdapter: class MockInputAdapter {
    attach = attachSpy
    detach = detachSpy
  },
}))

vi.mock('../pixi/PixiStage', () => ({
  PixiStage: ({
    onHostReady,
  }: {
    onHostReady?: (host: HTMLDivElement | null) => void
  }) => (
    <div
      data-testid="pixi-host"
      ref={(node) => {
        onHostReady?.(node)
      }}
    />
  ),
}))

class MockWebSocket {
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null

  constructor(_url: string) {}

  close = vi.fn()
}

describe('App touch tracking attachment scope', () => {
  beforeEach(() => {
    attachSpy.mockClear()
    detachSpy.mockClear()
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
  })

  it('attaches InputAdapter to the Pixi host element', async () => {
    const { getByTestId } = render(<App />)
    const pixiHost = getByTestId('pixi-host')

    await waitFor(() => {
      expect(attachSpy).toHaveBeenCalled()
    })

    expect(attachSpy).toHaveBeenCalledWith(pixiHost)
  })
})
