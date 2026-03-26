import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { UserNode as UserNodeType, Order, Point } from '../types'
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

/** Compute rotation angle (degrees) so the panel opens toward the canvas center */
function computeRotation(pos: Point, canvasSize: number): number {
  const cx = canvasSize / 2
  const cy = canvasSize / 2
  const angleRad = Math.atan2(cy - pos.y * canvasSize, cx - pos.x * canvasSize)
  return angleRad * (180 / Math.PI)
}

const MIN_POS = 0.05
const MAX_POS = 0.95

export function UserNode({ node, canvasSize, orders }: UserNodeProps): JSX.Element {
  const { togglePanel, setUserNodePosition, addOrder } = useAppStore()
  const [screen, setScreen] = useState<PanelScreen>({ view: 'home' })

  const didDragRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const nodeStartPosRef = useRef<Point | null>(null)

  const rotation = computeRotation(node.position, canvasSize)

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
      e.stopPropagation()
    },
    [node.position],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointerStartRef.current || !nodeStartPosRef.current) return

      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y

      if (!didDragRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return

      didDragRef.current = true

      const newX = Math.max(MIN_POS, Math.min(MAX_POS, nodeStartPosRef.current.x + dx / canvasSize))
      const newY = Math.max(MIN_POS, Math.min(MAX_POS, nodeStartPosRef.current.y + dy / canvasSize))

      setUserNodePosition(node.id, { x: newX, y: newY })
      e.stopPropagation()
    },
    [canvasSize, node.id, setUserNodePosition],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    pointerStartRef.current = null
    nodeStartPosRef.current = null
    e.stopPropagation()
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (didDragRef.current) return
      togglePanel(node.id)
      if (!node.panelOpen) {
        setScreen({ view: 'home' })
      }
      e.stopPropagation()
    },
    [node.id, node.panelOpen, togglePanel],
  )

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
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        pointerEvents: 'auto',
        zIndex: node.panelOpen ? 10 : 1,
      }}
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
        onClick={handleClick}
      >
        {node.ownerIndex + 1}
      </div>

      {/* Expanded panel */}
      {node.panelOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '50%',
            transform: `translateX(-50%) rotate(${-rotation}deg)`,
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
            transformOrigin: 'bottom center',
            animation: 'panelExpand 0.2s ease-out',
          }}
        >
          {renderScreen()}
        </div>
      )}

      <style>{`
        @keyframes panelExpand {
          from { opacity: 0; transform: translateX(-50%) rotate(${-rotation}deg) scale(0.92); }
          to   { opacity: 1; transform: translateX(-50%) rotate(${-rotation}deg) scale(1); }
        }
      `}</style>
    </div>
  )
}
