import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { UserNode as UserNodeType, Order, Point, UserEdge } from '../types'
import type { PanelScreen } from './PanelScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { AboutScreen } from '../screens/AboutScreen'
import { MenuScreen } from '../screens/MenuScreen'
import { DrinkDetailModal } from '../screens/DrinkDetailModal'
import { QuizFlow } from '../screens/QuizFlow'
import { OrderStatusPanel } from '../screens/OrderStatusPanel'

interface UserNodeProps {
  node: UserNodeType
  canvasSize: number
  orders: Order[]
}

const MIN_POS = 0.05
const MAX_POS = 0.95
const TAP_SLOP_PX = 16
const EDGE_TIE_THRESHOLD = 0.03
const APPROACH_INTENT_MIN_PX = 6

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampPosition(pos: Point): Point {
  return {
    x: clamp(pos.x, MIN_POS, MAX_POS),
    y: clamp(pos.y, MIN_POS, MAX_POS),
  }
}

export function rotationForEdge(edge: UserEdge): number {
  switch (edge) {
    case 'top':
      return 0
    case 'right':
      return 90
    case 'bottom':
      return 180
    case 'left':
      return -90
  }
}

export function nearestEdgeResult(
  position: Point,
  tieThreshold = EDGE_TIE_THRESHOLD,
): { edge: UserEdge; ambiguous: boolean } {
  const distances: Array<[UserEdge, number]> = [
    ['top', position.y],
    ['right', 1 - position.x],
    ['bottom', 1 - position.y],
    ['left', position.x],
  ]
  distances.sort((a, b) => a[1] - b[1])
  const [bestEdge, bestDistance] = distances[0]
  const [, secondDistance] = distances[1]
  return {
    edge: bestEdge,
    ambiguous: secondDistance - bestDistance <= tieThreshold,
  }
}

export function approachEdgeFromDelta(
  dx: number,
  dy: number,
  minIntentPx = APPROACH_INTENT_MIN_PX,
): UserEdge | null {
  if (Math.hypot(dx, dy) < minIntentPx) return null

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left'
  }
  return dy >= 0 ? 'bottom' : 'top'
}

export function resolveViewEdge(
  position: Point,
  previousEdge: UserEdge | null,
  ownerEdge: UserEdge,
  approachEdge: UserEdge | null,
): UserEdge {
  const nearest = nearestEdgeResult(position)
  if (!nearest.ambiguous) return nearest.edge
  if (approachEdge) return approachEdge
  if (previousEdge) return previousEdge
  return ownerEdge
}

function panelPlacementForEdge(
  edge: UserEdge,
  rotation: number,
): { placementStyle: React.CSSProperties; transform: string } {
  const rotate = `rotate(${rotation}deg)`
  switch (edge) {
    case 'bottom': {
      const transform = `translateX(-50%) ${rotate}`
      return {
        transform,
        placementStyle: {
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform,
          transformOrigin: 'bottom center',
        },
      }
    }
    case 'top': {
      const transform = `translateX(-50%) ${rotate}`
      return {
        transform,
        placementStyle: {
          top: 'calc(100% + 12px)',
          left: '50%',
          transform,
          transformOrigin: 'top center',
        },
      }
    }
    case 'left': {
      const transform = `translateY(-50%) ${rotate}`
      return {
        transform,
        placementStyle: {
          left: 'calc(100% + 12px)',
          top: '50%',
          transform,
          transformOrigin: 'left center',
        },
      }
    }
    case 'right': {
      const transform = `translateY(-50%) ${rotate}`
      return {
        transform,
        placementStyle: {
          right: 'calc(100% + 12px)',
          top: '50%',
          transform,
          transformOrigin: 'right center',
        },
      }
    }
  }
}

export function panelAnchorStyleForEdge(
  edge: UserEdge,
  _nodeX: number,
): React.CSSProperties {
  return panelPlacementForEdge(edge, rotationForEdge(edge)).placementStyle
}

export function panelTransformForEdge(edge: UserEdge): string {
  return `rotate(${rotationForEdge(edge)}deg)`
}

export function isTapGesture(
  start: Point | null,
  end: Point,
  didDrag: boolean,
  slopPx = TAP_SLOP_PX,
): boolean {
  if (!start || didDrag) return false
  return Math.hypot(end.x - start.x, end.y - start.y) < slopPx
}

export function UserNode({ node, canvasSize, orders }: UserNodeProps): JSX.Element {
  const {
    togglePanel,
    setUserNodePosition,
    setUserNodeViewEdge,
    lockUserNodeOrientation,
    unlockUserNodeOrientation,
    addOrder,
  } = useAppStore()
  const [screen, setScreen] = useState<PanelScreen>({ view: 'home' })

  const didDragRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const nodeStartPosRef = useRef<Point | null>(null)
  const lastPointerRef = useRef<Point | null>(null)
  const approachEdgeRef = useRef<UserEdge | null>(null)

  const displayEdge = node.lockedEdge ?? node.viewEdge ?? node.ownerEdge
  const rotation = rotationForEdge(displayEdge)
  const panelPlacement = panelPlacementForEdge(displayEdge, rotation)

  const left = node.position.x * canvasSize
  const top = node.position.y * canvasSize

  const userOrders = orders.filter((o) => o.userId === node.id)

  const handleOrder = useCallback(
    (drinkId: string) => {
      addOrder({
        id: `${node.id}-${drinkId}-${Date.now()}`,
        userId: node.id,
        drinkId,
        coasterId: null,
        status: 'pending',
        createdAt: Date.now(),
      })
      setScreen({ view: 'orders' })
    },
    [addOrder, node.id],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      didDragRef.current = false
      pointerStartRef.current = { x: e.clientX, y: e.clientY }
      nodeStartPosRef.current = { ...node.position }
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      approachEdgeRef.current = null
      e.stopPropagation()
    },
    [node.position],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointerStartRef.current || !nodeStartPosRef.current) return

      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y

      if (!didDragRef.current && Math.hypot(dx, dy) < TAP_SLOP_PX) return

      didDragRef.current = true
      const clamped = clampPosition({
        x: nodeStartPosRef.current.x + dx / canvasSize,
        y: nodeStartPosRef.current.y + dy / canvasSize,
      })
      const previousPointer = lastPointerRef.current
      if (previousPointer) {
        const approachEdge = approachEdgeFromDelta(
          e.clientX - previousPointer.x,
          e.clientY - previousPointer.y,
        )
        if (approachEdge) {
          approachEdgeRef.current = approachEdge
        }
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      setUserNodePosition(node.id, clamped)
      if (!node.lockedEdge) {
        const resolvedEdge = resolveViewEdge(
          clamped,
          node.viewEdge,
          node.ownerEdge,
          approachEdgeRef.current,
        )
        if (resolvedEdge !== node.viewEdge) {
          setUserNodeViewEdge(node.id, resolvedEdge)
        }
      }
      e.stopPropagation()
    },
    [
      canvasSize,
      node.id,
      node.lockedEdge,
      node.ownerEdge,
      node.viewEdge,
      setUserNodePosition,
      setUserNodeViewEdge,
    ],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerStart = pointerStartRef.current
      const wasTap = isTapGesture(
        pointerStart,
        { x: e.clientX, y: e.clientY },
        didDragRef.current,
      )
      const approachEdge = approachEdgeRef.current

      e.currentTarget.releasePointerCapture(e.pointerId)
      const finalPointerStart = pointerStartRef.current
      const finalNodeStart = nodeStartPosRef.current
      pointerStartRef.current = null
      nodeStartPosRef.current = null
      lastPointerRef.current = null
      approachEdgeRef.current = null

      if (!wasTap && finalPointerStart && finalNodeStart && !node.lockedEdge) {
        const finalPosition = clampPosition({
          x: finalNodeStart.x + (e.clientX - finalPointerStart.x) / canvasSize,
          y: finalNodeStart.y + (e.clientY - finalPointerStart.y) / canvasSize,
        })
        const resolvedEdge = resolveViewEdge(
          finalPosition,
          node.viewEdge,
          node.ownerEdge,
          approachEdge,
        )
        if (resolvedEdge !== node.viewEdge) {
          setUserNodeViewEdge(node.id, resolvedEdge)
        }
      }

      didDragRef.current = false

      if (!wasTap) {
        e.stopPropagation()
        return
      }

      const activeEdge = resolveViewEdge(
        node.position,
        node.viewEdge,
        node.ownerEdge,
        approachEdge,
      )

      if (node.panelOpen) {
        togglePanel(node.id)
        unlockUserNodeOrientation(node.id)
      } else {
        setUserNodeViewEdge(node.id, activeEdge)
        lockUserNodeOrientation(node.id, activeEdge)
        togglePanel(node.id)
        setScreen({ view: 'home' })
      }
      e.stopPropagation()
    },
    [
      canvasSize,
      node.id,
      node.panelOpen,
      node.position,
      node.lockedEdge,
      node.ownerEdge,
      node.viewEdge,
      togglePanel,
      setUserNodeViewEdge,
      lockUserNodeOrientation,
      unlockUserNodeOrientation,
    ],
  )

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    pointerStartRef.current = null
    nodeStartPosRef.current = null
    lastPointerRef.current = null
    approachEdgeRef.current = null
    didDragRef.current = false
    e.stopPropagation()
  }, [])

  const navigate = useCallback((s: PanelScreen) => setScreen(s), [])

  const renderScreen = (): React.ReactNode => {
    switch (screen.view) {
      case 'home':
        return <HomeScreen userColor={node.color} onNavigate={navigate} />
      case 'about':
        return (
          <AboutScreen
            userColor={node.color}
            onBack={() => navigate({ view: 'home' })}
          />
        )
      case 'menu':
        return (
          <MenuScreen
            userColor={node.color}
            onNavigate={navigate}
            onOrder={handleOrder}
          />
        )
      case 'detail':
        return (
          <DrinkDetailModal
            drinkId={screen.drinkId}
            userColor={node.color}
            onOrder={handleOrder}
            onBack={() => navigate({ view: 'menu' })}
          />
        )
      case 'quiz':
        return (
          <QuizFlow
            userColor={node.color}
            onOrder={handleOrder}
            onNavigate={navigate}
          />
        )
      case 'orders':
        return (
          <OrderStatusPanel
            userColor={node.color}
            orders={userOrders}
            onNavigate={navigate}
          />
        )
    }
  }

  return (
    <div
      className={`node node--${node.color}`}
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
        zIndex: node.panelOpen ? 10 : 1,
      }}
      data-user-edge={displayEdge}
    >
      {/* Drag handle / toggle button */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--color-bg, #0d0d0d)',
          border: '3px solid var(--user-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 16px var(--user-color)',
          userSelect: 'none',
          touchAction: 'none',
          transition: 'transform 0.15s ease',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--user-color)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span
          style={{
            display: 'inline-block',
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.15s ease',
          }}
        >
          {node.ownerIndex + 1}
        </span>
      </div>

      {/* Expanded panel */}
      {node.panelOpen && (
        <div
          style={{
            position: 'absolute',
            ...panelPlacement.placementStyle,
            width: 360,
            height: 480,
            background: 'var(--color-panel)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'panelExpand 0.2s ease-out',
          }}
        >
          {renderScreen()}
        </div>
      )}

      <style>{`
        @keyframes panelExpand {
          from { opacity: 0; transform: ${panelPlacement.transform} scale(0.92); }
          to   { opacity: 1; transform: ${panelPlacement.transform} scale(1); }
        }
      `}</style>
    </div>
  )
}
