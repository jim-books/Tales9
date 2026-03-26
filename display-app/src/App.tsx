import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PixiStage } from './pixi/PixiStage'
import { UserNode } from './components/UserNode'
import { useAppStore } from './store/useAppStore'
import { CANVAS_SIZE } from './engine/CalibrationMapper'
import type { WsMessage } from './types'
import './App.css'

function MainView(): JSX.Element {
  const sessionActive = useAppStore((s) => s.sessionActive)
  const userNodes = useAppStore((s) => s.userNodes)
  const orders = useAppStore((s) => s.orders)
  const startSession = useAppStore((s) => s.startSession)
  const endSession = useAppStore((s) => s.endSession)
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus)
  const assignDrinkToCoaster = useAppStore((s) => s.assignDrinkToCoaster)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url =
      (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080/ws'

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      // WebSocket unavailable (e.g. test/non-browser env) — degrade silently
      return
    }
    wsRef.current = ws

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WsMessage
        if (msg.type === 'SESSION_START') {
          startSession(msg.payload.userCount)
        } else if (msg.type === 'SESSION_END') {
          endSession()
        } else if (msg.type === 'ORDER_UPDATE') {
          updateOrderStatus(msg.payload.orderId, msg.payload.status)
        } else if (msg.type === 'COASTER_ASSIGN') {
          assignDrinkToCoaster(msg.payload.coasterId, msg.payload.drinkId)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onerror = () => {
      // Silently degrade — core session flow continues without the backend
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [startSession, endSession, updateOrderStatus, assignDrinkToCoaster])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        overflow: 'hidden',
      }}
    >
      {/* Layer 0: PixiJS canvas (standby ambient + coaster animations) */}
      <PixiStage />

      {/* Layer 1: User Node overlays */}
      {sessionActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {userNodes.map((n) => (
            <UserNode key={n.id} node={n} canvasSize={CANVAS_SIZE} orders={orders} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
      </Routes>
    </BrowserRouter>
  )
}
