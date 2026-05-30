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
import { GamePortalScreen } from '../screens/GamePortalScreen'

interface UserNodeProps {
  node: UserNodeType
  canvasSize: number
  orders: Order[]
}

const USER_COLOR_HEX: Record<string, number> = {
  blue: 0x4a9eff, green: 0x4ade80, orange: 0xfb923c, purple: 0xc084fc,
}

const MIN_POS = 0.05
const MAX_POS = 0.95
const TAP_SLOP_PX = 16
const EDGE_TIE_THRESHOLD = 0.03
const APPROACH_INTENT_MIN_PX = 6
const PANEL_WIDTH = 600
const PANEL_HEIGHT = 450
const PANEL_SCALE = 1.05
const NODE_VISIBLE_SIZE = 64
const NODE_HITBOX_SCALE = 1.6
const NODE_HITBOX_SIZE = NODE_VISIBLE_SIZE * NODE_HITBOX_SCALE

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
    case 'bottom':
      return 0
    case 'right':
      return -90
    case 'top':
      return 180
    case 'left':
      return 90
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

export function panelAnchorStyleForEdge(edge: UserEdge): React.CSSProperties {
  switch (edge) {
    case 'bottom':
      return {
        bottom: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    case 'top':
      return {
        top: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    case 'left':
      return {
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
      }
    case 'right':
      return {
        right: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
      }
  }
}

function panelTransformOriginForEdge(
  _edge: UserEdge,
): React.CSSProperties['transformOrigin'] {
  // Keep the rotated panel centered within its wrapper; anchoring is handled
  // by the wrapper's positioning, not the transform origin.
  return 'center center'
}

export function panelTransformForEdge(edge: UserEdge): string {
  return `rotate(${rotationForEdge(edge)}deg)`
}

function panelAnimatedTransform(edge: UserEdge, scale: number): string {
  return `${panelTransformForEdge(edge)} scale(${scale})`
}

function panelWrapperSizeForEdge(edge: UserEdge): React.CSSProperties {
  const scaledWidth = PANEL_WIDTH * PANEL_SCALE
  const scaledHeight = PANEL_HEIGHT * PANEL_SCALE
  if (edge === 'left' || edge === 'right') {
    return { width: scaledHeight, height: scaledWidth }
  }
  return { width: scaledWidth, height: scaledHeight }
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
    startGame,
    triggerOrderBurst,
  } = useAppStore()
  const [screen, setScreen] = useState<PanelScreen>({ view: 'home' })

  const didDragRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const nodeStartPosRef = useRef<Point | null>(null)
  const lastPointerRef = useRef<Point | null>(null)
  const approachEdgeRef = useRef<UserEdge | null>(null)

  const displayEdge = node.lockedEdge ?? node.viewEdge ?? node.ownerEdge
  const rotation = rotationForEdge(displayEdge)
  const panelAnchorStyle = panelAnchorStyleForEdge(displayEdge)
  const panelTransformOrigin = panelTransformOriginForEdge(displayEdge)
  const panelTransform = panelTransformForEdge(displayEdge)
  const panelWrapperSize = panelWrapperSizeForEdge(displayEdge)
  const panelExpandAnimationName = `panelExpand-${node.id}`

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
      triggerOrderBurst(
        node.position.x * canvasSize,
        node.position.y * canvasSize,
        USER_COLOR_HEX[node.color] ?? 0xffffff,
      )
      setScreen({ view: 'orders' })
    },
    [addOrder, triggerOrderBurst, node.id, node.position, node.color, canvasSize],
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

  const stopPanelTouchPropagation = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Panel interactions should not bubble into root-level coaster tracking.
    e.stopPropagation()
  }, [])

  const navigate = useCallback((s: PanelScreen) => {
    setScreen(s)
  }, [node.id])

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
            panelEdge={displayEdge}
            onNavigate={navigate}
            onOrder={handleOrder}
          />
        )
      case 'game':
        return (
          <GamePortalScreen
            userColor={node.color}
            onBack={() => navigate({ view: 'home' })}
            onStartGame={(type) => {
              startGame(type)
              togglePanel(node.id)
              unlockUserNodeOrientation(node.id)
            }}
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
      {/* Invisible hit target — 60% larger than the visible badge */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: NODE_HITBOX_SIZE,
          height: NODE_HITBOX_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          style={{
            width: NODE_VISIBLE_SIZE,
            height: NODE_VISIBLE_SIZE,
            borderRadius: '50%',
            background: 'var(--color-bg, #0d0d0d)',
            border: '3px solid var(--user-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--user-color)',
            transition: 'transform 0.15s ease',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--user-color)',
            pointerEvents: 'none',
          }}
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
      </div>

      {/* Expanded panel */}
      {node.panelOpen && (
        <div
          style={{
            position: 'absolute',
            ...panelAnchorStyle,
            ...panelWrapperSize,
            zIndex: 1,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onTouchStart={stopPanelTouchPropagation}
          onTouchMove={stopPanelTouchPropagation}
          onTouchEnd={stopPanelTouchPropagation}
          onTouchCancel={stopPanelTouchPropagation}
        >
          <div
            className="panel-shell"
            style={{
              width: PANEL_WIDTH,
              height: PANEL_HEIGHT,
              overflow: 'hidden',
              touchAction: 'pan-y',
              display: 'flex',
              flexDirection: 'column',
              transform: `${panelTransform} scale(${PANEL_SCALE})`,
              transformOrigin: panelTransformOrigin,
              animation: `${panelExpandAnimationName} 0.2s ease-out`,
              pointerEvents: 'auto',
            }}
            onTouchStart={stopPanelTouchPropagation}
            onTouchMove={stopPanelTouchPropagation}
            onTouchEnd={stopPanelTouchPropagation}
            onTouchCancel={stopPanelTouchPropagation}
          >
            {renderScreen()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ${panelExpandAnimationName} {
          from { opacity: 0; transform: ${panelAnimatedTransform(displayEdge, PANEL_SCALE * 0.92)}; }
          to   { opacity: 1; transform: ${panelAnimatedTransform(displayEdge, PANEL_SCALE)}; }
        }
      `}</style>
    </div>
  )
}
