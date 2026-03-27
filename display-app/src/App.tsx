import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PixiStage } from './pixi/PixiStage'
import { UserNode } from './components/UserNode'
import { GameOverlay } from './screens/GameOverlay'
import { DiagnosticsOverlay } from './components/DiagnosticsOverlay'
import { useAppStore } from './store/useAppStore'
import { CANVAS_SIZE, CalibrationMapper } from './engine/CalibrationMapper'
import { TrackingEngine } from './engine/TrackingEngine'
import { AnimationDispatcher } from './engine/AnimationDispatcher'
import { InputAdapter } from './engine/InputAdapter'
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
  const upsertCoaster = useAppStore((s) => s.upsertCoaster)
  const removeCoaster = useAppStore((s) => s.removeCoaster)
  const startGame = useAppStore((s) => s.startGame)
  const endGame = useAppStore((s) => s.endGame)

  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const dispatcherRef = useRef<AnimationDispatcher | null>(null)
  const activeCoasterIdsRef = useRef<Set<string>>(new Set())

  // Wire InputAdapter → TrackingEngine → store + AnimationDispatcher
  useEffect(() => {
    const mapper = new CalibrationMapper()
    const tracker = new TrackingEngine(mapper)
    const dispatcher = new AnimationDispatcher()
    dispatcherRef.current = dispatcher

    const adapter = new InputAdapter('touch', (points) => {
      const tracked = tracker.processFrame(points)
      const activeIds = new Set(tracked.filter((c) => c.active).map((c) => c.id))

      for (const coaster of tracked) {
        if (coaster.active) {
          upsertCoaster({
            id: coaster.id,
            signature: coaster.signature,
            centroid: coaster.centroid,
            detected: true,
          })
          if (!activeCoasterIdsRef.current.has(coaster.id)) {
            dispatcher.onCoasterDetected(coaster.id, coaster.centroid)
          }
        }
      }

      for (const id of activeCoasterIdsRef.current) {
        if (!activeIds.has(id)) {
          removeCoaster(id)
          dispatcher.onCoasterRemoved(id)
        }
      }

      activeCoasterIdsRef.current = activeIds
    })

    if (containerRef.current) {
      adapter.attach(containerRef.current)
    }

    return () => {
      adapter.detach()
      dispatcherRef.current = null
    }
  }, [upsertCoaster, removeCoaster])

  // Toggle diagnostics overlay with 'D' key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDiagnostics((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
          dispatcherRef.current?.assignDrink(msg.payload.coasterId, msg.payload.drinkId)
        } else if (msg.type === 'GAME_START') {
          startGame(msg.payload.gameType)
        } else if (msg.type === 'GAME_END') {
          endGame()
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
  }, [startSession, endSession, updateOrderStatus, assignDrinkToCoaster, startGame, endGame])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        overflow: 'hidden',
      }}
    >
      {/* Layer 0: PixiJS canvas (standby ambient + coaster animations + game layer) */}
      <PixiStage />

      {/* Layer 1: Game result overlay (shown after arrow/crown animation completes) */}
      <GameOverlay />

      {/* Layer 2: User Node overlays */}
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

      {/* Layer 3: Diagnostics overlay (toggle with 'D' key) */}
      {showDiagnostics && <DiagnosticsOverlay />}
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
