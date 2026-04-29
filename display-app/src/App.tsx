import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PixiStage } from './pixi/PixiStage'
import { UserNode } from './components/UserNode'
import { GameOverlay } from './screens/GameOverlay'
import { DebugPanel } from './components/DebugPanel'
import { useAppStore } from './store/useAppStore'
import { CANVAS_SIZE, CalibrationMapper } from './engine/CalibrationMapper'
import { TrackingEngine } from './engine/TrackingEngine'
import { AnimationDispatcher } from './engine/AnimationDispatcher'
import { InputAdapter } from './engine/InputAdapter'
import type { WsMessage, GameType } from './types'
import type { FrameDiagnosis } from './engine/TrackingEngine'
import {
  listenToSession,
  listenToCoasterAssignments,
} from './services/firebaseService'
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
  const linkOrderToCoaster = useAppStore((s) => s.linkOrderToCoaster)
  const arriveOrderByCoaster = useAppStore((s) => s.arriveOrderByCoaster)

  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showAmbientPreview, setShowAmbientPreview] = useState(false)
  const [demoDrinkOverrides, setDemoDrinkOverrides] = useState<{
    0: string
    1: string
  }>({
    0: '',
    1: '',
  })
  const [frameDiagnosis, setFrameDiagnosis] = useState<FrameDiagnosis>({
    rawTouchPoints: [],
    clusters: [],
  })
  const [trackingSurface, setTrackingSurface] = useState<HTMLDivElement | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const dispatcherRef = useRef<AnimationDispatcher | null>(null)
  const activeCoasterIdsRef = useRef<Set<string>>(new Set())
  const demoDrinkOverridesRef = useRef(demoDrinkOverrides)

  useEffect(() => {
    demoDrinkOverridesRef.current = demoDrinkOverrides
  }, [demoDrinkOverrides])

  // Wire InputAdapter → TrackingEngine → store + AnimationDispatcher
  useEffect(() => {
    const mapper = new CalibrationMapper()
    const tracker = new TrackingEngine(mapper)
    const dispatcher = new AnimationDispatcher()
    dispatcherRef.current = dispatcher

    const adapter = new InputAdapter('touch', (points) => {
      const frame = tracker.processFrame(points)
      const tracked = frame.coasters
      setFrameDiagnosis(tracker.getLastDiagnosis())

      for (const coaster of tracked) {
        if (coaster.active) {
          upsertCoaster({
            id: coaster.id,
            signature: coaster.signature,
            centroid: coaster.centroid,
            detectionState: coaster.state,
          })
        } else {
          removeCoaster(coaster.id)
        }
      }

      for (const event of frame.events) {
        if (event.type === 'confirmed') {
          const coasterIdx =
            event.coasterId === 'coaster-1'
              ? 0
              : event.coasterId === 'coaster-2'
                ? 1
                : null
          const debugOverride =
            coasterIdx === null ? '' : demoDrinkOverridesRef.current[coasterIdx]
          const existingDrinkId = useAppStore
            .getState()
            .coasters.find((c) => c.id === event.coasterId)?.drinkId
          const resolvedDrinkId = existingDrinkId || debugOverride || null

          if (resolvedDrinkId) {
            assignDrinkToCoaster(event.coasterId, resolvedDrinkId)
            dispatcher.assignDrink(event.coasterId, resolvedDrinkId)
          }
          dispatcher.onCoasterConfirmed(event.coasterId, event.centroid)
          arriveOrderByCoaster(event.coasterId)
        } else if (event.type === 'removed') {
          dispatcher.onCoasterRemoved(event.coasterId)
        }
      }
    })

    if (trackingSurface) {
      adapter.attach(trackingSurface)
    }

    return () => {
      adapter.detach()
      dispatcherRef.current = null
    }
  }, [upsertCoaster, removeCoaster, assignDrinkToCoaster, arriveOrderByCoaster, trackingSurface])

  // Toggle debug panel with 'D' key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDebugPanel((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Demo keyboard shortcuts (bypass WebSocket for presenting without backend) ─
  // S         → start session with 4 users      (replaces SESSION_START)
  // E         → end session                      (replaces SESSION_END)
  // 1 / 2 / 3 / 4 → toggle demo coaster + drink (replaces COASTER_ASSIGN)
  //   coaster 1 = pisco-colada (tropical)   — left
  //   coaster 2 = espresso-martini (bold)   — top
  //   coaster 3 = momo-sour (energetic)     — right
  //   coaster 4 = apple-tart (elegant)      — bottom
  // T         → start Truth or Dare game    (replaces GAME_START)
  // K         → start King's Game           (replaces GAME_START)
  // G         → end game                    (replaces GAME_END)
  // D         → toggle debug panel
  const DEMO_DRINKS = ['pisco-colada', 'espresso-martini', 'momo-sour', 'apple-tart']
  const DEMO_DRINK_OPTIONS = [
    { id: 'apple-tart', label: 'Apple Tart' },
    { id: 'pisco-colada', label: 'Pisco Colada' },
    { id: 'espresso-martini', label: 'Espresso Martini' },
    { id: 'momo-sour', label: 'Momo Sour' },
  ]
  const DEMO_CENTROIDS = [
    { x: 475,  y: 950  }, // 1 — left
    { x: 950,  y: 475  }, // 2 — top
    { x: 1425, y: 950  }, // 3 — right
    { x: 950,  y: 1425 }, // 4 — bottom
  ]

  // Equilateral-ish triangle around centroid (≈40 px radius) for signature
  const makeSignature = (
    cx: number,
    cy: number,
  ): [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] => [
    { x: cx,       y: cy - 45 },
    { x: cx + 39,  y: cy + 22 },
    { x: cx - 39,  y: cy + 22 },
  ]

  const handleToggleCoaster = (idx: number) => {
    const id = `demo-coaster-${idx}`
    const overrideDrinkId = (idx === 0 || idx === 1) ? demoDrinkOverrides[idx] : ''
    const drinkId = overrideDrinkId || DEMO_DRINKS[idx] || null
    const centroid = DEMO_CENTROIDS[idx]
    if (activeCoasterIdsRef.current.has(id)) {
      // Remove existing demo coaster
      removeCoaster(id)
      dispatcherRef.current?.onCoasterRemoved(id)
      activeCoasterIdsRef.current.delete(id)
    } else {
      // Spawn demo coaster with drink pre-assigned
      upsertCoaster({ id, signature: makeSignature(centroid.x, centroid.y), centroid, detectionState: 'confirmed', drinkId })
      if (drinkId) {
        assignDrinkToCoaster(id, drinkId)
        dispatcherRef.current?.assignDrink(id, drinkId)
      }
      dispatcherRef.current?.onCoasterConfirmed(id, centroid)
      activeCoasterIdsRef.current.add(id)
    }
  }

  const handleSetDemoDrinkOverride = (coasterIdx: 0 | 1, drinkId: string): void => {
    setDemoDrinkOverrides((prev) => ({
      ...prev,
      [coasterIdx]: drinkId,
    }))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        startSession(4)
      } else if (e.key === 'e' || e.key === 'E') {
        endSession()
      } else if (e.key === 't' || e.key === 'T') {
        startGame('truth_or_dare')
      } else if (e.key === 'k' || e.key === 'K') {
        startGame('kings_game')
      } else if (e.key === 'g' || e.key === 'G') {
        endGame()
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1
        handleToggleCoaster(idx)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startSession, endSession, startGame, endGame])

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
          linkOrderToCoaster(msg.payload.drinkId, msg.payload.coasterId)
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
  }, [startSession, endSession, updateOrderStatus, assignDrinkToCoaster, linkOrderToCoaster, startGame, endGame])

  // Firestore listeners: session control + coaster assignments pushed from iOS
  useEffect(() => {
    const unsubSession = listenToSession(({ active, userCount }) => {
      if (active) startSession(userCount)
      else endSession()
    })
    const unsubAssign = listenToCoasterAssignments(({ coasterId, drinkId }) => {
      assignDrinkToCoaster(coasterId, drinkId)
      dispatcherRef.current?.assignDrink(coasterId, drinkId)
      linkOrderToCoaster(drinkId, coasterId)
    })
    return () => {
      unsubSession()
      unsubAssign()
    }
  }, [startSession, endSession, assignDrinkToCoaster, linkOrderToCoaster])

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
      {/* Layer 0: PixiJS canvas (standby ambient + coaster animations + game layer) */}
      <PixiStage onTrackingSurfaceReady={setTrackingSurface} showAmbientPreview={showAmbientPreview} />

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

      {/* Layer 3: Debug panel + menu button (toggle with 'D' key) */}
      {showDebugPanel ? (
        <DebugPanel
          activeCoasterIds={activeCoasterIdsRef.current}
          frameDiagnosis={frameDiagnosis}
          demoDrinkOptions={DEMO_DRINK_OPTIONS}
          demoDrinkOverrides={demoDrinkOverrides}
          onSetDemoDrinkOverride={handleSetDemoDrinkOverride}
          onStartSession={() => startSession(4)}
          onEndSession={() => endSession()}
          onToggleCoaster={handleToggleCoaster}
          onStartGame={(type: GameType) => startGame(type)}
          onEndGame={() => endGame()}
          onClose={() => setShowDebugPanel(false)}
          showAmbientPreview={showAmbientPreview}
          onToggleAmbientPreview={() => setShowAmbientPreview((v) => !v)}
        />
      ) : (
        <button
          onClick={() => setShowDebugPanel(true)}
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            zIndex: 30,
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #00ff8866',
            borderRadius: 8,
            color: '#00ff88',
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.1s',
          }}
        >
          ◉ DEV
        </button>
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
