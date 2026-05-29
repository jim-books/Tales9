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
import type { GameType } from './types'
import type { FrameDiagnosis } from './engine/TrackingEngine'
import type { CoasterTouchSignature } from './types'
import { deriveTemplateSpecFromSignatures } from './engine/CoasterTemplates'
import {
  hardcodedDrinkIdForCoaster,
  type MappingMode,
} from './data/coasterDrinkMapping'
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
  const assignDrinkToCoaster = useAppStore((s) => s.assignDrinkToCoaster)
  const upsertCoaster = useAppStore((s) => s.upsertCoaster)
  const removeCoaster = useAppStore((s) => s.removeCoaster)
  const startGame = useAppStore((s) => s.startGame)
  const endGame = useAppStore((s) => s.endGame)
  const linkOrderToCoaster = useAppStore((s) => s.linkOrderToCoaster)
  const unlinkOrdersFromCoaster = useAppStore((s) => s.unlinkOrdersFromCoaster)
  const arriveOrderByCoaster = useAppStore((s) => s.arriveOrderByCoaster)

  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showAmbientPreview, setShowAmbientPreview] = useState(false)
  const [mappingMode, setMappingMode] = useState<MappingMode>('hardcoded')
  const [frameDiagnosis, setFrameDiagnosis] = useState<FrameDiagnosis>({
    rawTouchPoints: [],
    clusters: [],
  })
  const [trackingSurface, setTrackingSurface] = useState<HTMLDivElement | null>(null)
  const [captureTargetTemplateId, setCaptureTargetTemplateId] = useState('coaster-1')
  const [capturedSignatures, setCapturedSignatures] = useState<CoasterTouchSignature[]>([])

  const dispatcherRef = useRef<AnimationDispatcher | null>(null)
  const activeCoasterIdsRef = useRef<Set<string>>(new Set())
  const hasCapturedCurrentThreeTouchRef = useRef(false)
  const lastAutoCaptureAtRef = useRef(0)

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

      if (points.length === 3) {
        const now = Date.now()
        const isCooldownElapsed = now - lastAutoCaptureAtRef.current >= 300
        if (!hasCapturedCurrentThreeTouchRef.current && isCooldownElapsed) {
          setCapturedSignatures((prev) => [
            ...prev,
            [points[0], points[1], points[2]],
          ])
          lastAutoCaptureAtRef.current = now
          hasCapturedCurrentThreeTouchRef.current = true
        }
      } else {
        hasCapturedCurrentThreeTouchRef.current = false
      }

      for (const coaster of tracked) {
        upsertCoaster({
          id: coaster.id,
          signature: coaster.signature,
          centroid: coaster.centroid,
          detectionState: coaster.state,
        })
      }

      for (const event of frame.events) {
        if (event.type === 'confirmed') {
          const storeState = useAppStore.getState()
          const existingDrinkId = storeState.coasters.find((c) => c.id === event.coasterId)?.drinkId ?? null
          const pendingDrinkId = storeState.coasterDrinkAssignments[event.coasterId] ?? null
          const linkedDrinkId = storeState.orders.find((o) => o.coasterId === event.coasterId)?.drinkId ?? null
          const resolvedDrinkId = mappingMode === 'hardcoded'
            ? hardcodedDrinkIdForCoaster(event.coasterId)
            : (existingDrinkId ?? pendingDrinkId ?? linkedDrinkId ?? null)

          if (resolvedDrinkId) {
            assignDrinkToCoaster(event.coasterId, resolvedDrinkId)
            dispatcher.assignDrink(event.coasterId, resolvedDrinkId)
          }
          dispatcher.onCoasterConfirmed(event.coasterId, event.centroid)
          arriveOrderByCoaster(event.coasterId)
        } else if (event.type === 'removed') {
          removeCoaster(event.coasterId)
          dispatcher.onCoasterRemoved(event.coasterId)
        }
      }

      const trackedIds = new Set(tracked.map((c) => c.id))
      for (const storeCoaster of useAppStore.getState().coasters) {
        if (trackedIds.has(storeCoaster.id)) continue
        removeCoaster(storeCoaster.id)
        dispatcher.onCoasterRemoved(storeCoaster.id)
      }
    })

    if (trackingSurface) {
      adapter.attach(trackingSurface)
    }

    return () => {
      adapter.detach()
      dispatcherRef.current = null
    }
  }, [
    upsertCoaster,
    removeCoaster,
    assignDrinkToCoaster,
    arriveOrderByCoaster,
    trackingSurface,
    mappingMode,
  ])

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
  // 1 / 2 / 3 / 4 / 5 / 6 → toggle demo coaster (replaces COASTER_ASSIGN)
  // T         → start Truth or Dare game    (replaces GAME_START)
  // K         → start King's Game           (replaces GAME_START)
  // G         → end game                    (replaces GAME_END)
  // D         → toggle debug panel
  const DEMO_CENTROIDS = [
    { x: 475, y: 950 },   // 1 — left
    { x: 950, y: 475 },   // 2 — top
    { x: 1425, y: 950 },  // 3 — right
    { x: 950, y: 1425 },  // 4 — bottom
    { x: 650, y: 650 },   // 5 — upper-left inner
    { x: 1250, y: 1250 }, // 6 — lower-right inner
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
    const coasterNumber = idx + 1
    const id = `coaster-${coasterNumber}`
    const mappedDrinkId = useAppStore.getState().coasters.find((c) => c.id === id)?.drinkId ?? null
    const linkedOrderDrinkId = useAppStore.getState().orders.find((o) => o.coasterId === id)?.drinkId ?? null
    const pendingDrinkId = useAppStore.getState().coasterDrinkAssignments[id] ?? null
    const drinkId = mappingMode === 'hardcoded'
      ? hardcodedDrinkIdForCoaster(id)
      : (mappedDrinkId ?? linkedOrderDrinkId ?? pendingDrinkId)
    const centroid = DEMO_CENTROIDS[idx]
    if (!centroid) return
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

  const handleResetCapturedSamples = (): void => {
    setCapturedSignatures([])
    hasCapturedCurrentThreeTouchRef.current = false
    lastAutoCaptureAtRef.current = 0
  }

  const derivedTemplateSpec = deriveTemplateSpecFromSignatures(
    captureTargetTemplateId.trim() || 'coaster-new',
    capturedSignatures,
  )
  const derivedTemplateSpecText = derivedTemplateSpec
    ? JSON.stringify(
        {
          sampleCount: derivedTemplateSpec.sampleCount,
          ...derivedTemplateSpec.spec,
        },
        null,
        2,
      )
    : '{\n  "sampleCount": 0,\n  "note": "Capture at least one cluster sample."\n}'

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
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const idx = parseInt(e.key) - 1
        handleToggleCoaster(idx)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startSession, endSession, startGame, endGame])

  // Firestore listeners: session control + coaster assignments pushed from iOS
  useEffect(() => {
    const unsubSession = listenToSession(({ active, userCount }) => {
      dispatcherRef.current?.reset()
      if (active) {
        startSession(userCount)
      } else {
        endSession()
      }
    })
    const unsubAssign = listenToCoasterAssignments((snap) => {
      if (mappingMode !== 'firebase') return
      if (snap.type === 'assigned') {
        assignDrinkToCoaster(snap.coasterId, snap.drinkId)
        dispatcherRef.current?.assignDrink(snap.coasterId, snap.drinkId)
        linkOrderToCoaster(snap.orderId, snap.coasterId)
      } else {
        assignDrinkToCoaster(snap.coasterId, null)
        dispatcherRef.current?.clearAssignment(snap.coasterId)
        unlinkOrdersFromCoaster(snap.coasterId)
      }
    })
    return () => {
      unsubSession()
      unsubAssign()
    }
  }, [
    startSession,
    endSession,
    assignDrinkToCoaster,
    linkOrderToCoaster,
    unlinkOrdersFromCoaster,
    mappingMode,
  ])

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
          mappingMode={mappingMode}
          onSetMappingMode={setMappingMode}
          onStartSession={() => startSession(4)}
          onEndSession={() => endSession()}
          onToggleCoaster={handleToggleCoaster}
          onStartGame={(type: GameType) => startGame(type)}
          onEndGame={() => endGame()}
          onClose={() => setShowDebugPanel(false)}
          showAmbientPreview={showAmbientPreview}
          onToggleAmbientPreview={() => setShowAmbientPreview((v) => !v)}
          captureTargetTemplateId={captureTargetTemplateId}
          onSetCaptureTargetTemplateId={setCaptureTargetTemplateId}
          capturedSampleCount={capturedSignatures.length}
          onResetCapturedSamples={handleResetCapturedSamples}
          derivedTemplateSpecText={derivedTemplateSpecText}
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
