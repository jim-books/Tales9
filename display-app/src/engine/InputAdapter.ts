import type { Point } from '../types'

/**
 * InputAdapter
 *
 * Abstracts the source of touch input so TrackingEngine is hardware-agnostic.
 * Supported sources:
 *  - 'touch'     : native DOM Touch events (production Android WebView)
 *  - 'mouse'     : single-point mouse input (dev/testing)
 *  - 'websocket' : injected touch frames from a local WS server (hardware bridge)
 */

export type InputSource = 'touch' | 'mouse' | 'websocket'

export type TouchFrameCallback = (points: Point[]) => void

export class InputAdapter {
  private source: InputSource
  private onFrame: TouchFrameCallback
  private target: HTMLElement | null = null
  private ws: WebSocket | null = null

  constructor(source: InputSource, onFrame: TouchFrameCallback) {
    this.source = source
    this.onFrame = onFrame
  }

  attach(element: HTMLElement): void {
    this.target = element

    if (this.source === 'touch') {
      element.addEventListener('touchstart', this.handleTouch, { passive: true })
      element.addEventListener('touchmove', this.handleTouch, { passive: true })
      element.addEventListener('touchend', this.handleTouch, { passive: true })
    } else if (this.source === 'mouse') {
      element.addEventListener('mousemove', this.handleMouse)
      element.addEventListener('mousedown', this.handleMouse)
    }
  }

  detach(): void {
    if (!this.target) return

    this.target.removeEventListener('touchstart', this.handleTouch)
    this.target.removeEventListener('touchmove', this.handleTouch)
    this.target.removeEventListener('touchend', this.handleTouch)
    this.target.removeEventListener('mousemove', this.handleMouse)
    this.target.removeEventListener('mousedown', this.handleMouse)
    this.target = null

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  connectWebSocket(url: string): void {
    this.ws = new WebSocket(url)
    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string)
        if (data.type === 'TOUCH_FRAME' && Array.isArray(data.points)) {
          this.onFrame(data.points as Point[])
        }
      } catch {
        // Ignore malformed messages
      }
    }
  }

  /** Inject a touch frame directly (used in testing and simulation) */
  injectFrame(points: Point[]): void {
    this.onFrame(points)
  }

  private handleTouch = (ev: TouchEvent): void => {
    const rect = this.target!.getBoundingClientRect()
    const points: Point[] = Array.from(ev.touches).map((t) => ({
      x: (t.clientX - rect.left) / rect.width,
      y: (t.clientY - rect.top) / rect.height,
    }))
    this.onFrame(points)
  }

  private handleMouse = (ev: MouseEvent): void => {
    const rect = this.target!.getBoundingClientRect()
    this.onFrame([
      {
        x: (ev.clientX - rect.left) / rect.width,
        y: (ev.clientY - rect.top) / rect.height,
      },
    ])
  }
}
