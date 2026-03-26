import { create } from 'zustand'
import type { UserNode, Coaster, Order, GameState, UserColor, Point, OrderStatus } from '../types'

const USER_COLORS: UserColor[] = ['blue', 'green', 'orange', 'purple']

/** Predefined spawn positions for up to 4 users (normalised 0–1, relative to canvas) */
const SPAWN_POSITIONS: Point[] = [
  { x: 0.25, y: 0.88 }, // bottom-left (user 0)
  { x: 0.75, y: 0.88 }, // bottom-right (user 1)
  { x: 0.25, y: 0.12 }, // top-left (user 2)
  { x: 0.75, y: 0.12 }, // top-right (user 3)
]

interface AppState {
  // ─── Session ─────────────────────────────────────────────────────────────
  sessionActive: boolean
  userCount: number
  userNodes: UserNode[]

  // ─── Coasters ────────────────────────────────────────────────────────────
  coasters: Coaster[]

  // ─── Orders ──────────────────────────────────────────────────────────────
  orders: Order[]

  // ─── Games ───────────────────────────────────────────────────────────────
  gameState: GameState | null

  // ─── Actions ─────────────────────────────────────────────────────────────
  startSession: (userCount: number) => void
  endSession: () => void

  setUserNodePosition: (nodeId: string, position: Point) => void
  togglePanel: (nodeId: string) => void

  upsertCoaster: (coaster: Omit<Coaster, 'drinkId'> & { drinkId?: string | null }) => void
  removeCoaster: (coasterId: string) => void
  assignDrinkToCoaster: (coasterId: string, drinkId: string) => void

  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void

  setGameState: (game: GameState | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sessionActive: false,
  userCount: 0,
  userNodes: [],
  coasters: [],
  orders: [],
  gameState: null,

  startSession: (userCount) =>
    set({
      sessionActive: true,
      userCount,
      userNodes: Array.from({ length: userCount }, (_, i) => ({
        id: `user-${i}`,
        ownerIndex: i,
        color: USER_COLORS[i],
        position: SPAWN_POSITIONS[i],
        panelOpen: false,
      })),
      orders: [],
      gameState: null,
    }),

  endSession: () =>
    set({
      sessionActive: false,
      userCount: 0,
      userNodes: [],
      coasters: [],
      orders: [],
      gameState: null,
    }),

  setUserNodePosition: (nodeId, position) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    })),

  togglePanel: (nodeId) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) =>
        n.id === nodeId ? { ...n, panelOpen: !n.panelOpen } : n,
      ),
    })),

  upsertCoaster: (coaster) =>
    set((s) => {
      const existing = s.coasters.find((c) => c.id === coaster.id)
      const updated: Coaster = {
        drinkId: existing?.drinkId ?? null,
        ...coaster,
        detected: true,
      }
      return {
        coasters: existing
          ? s.coasters.map((c) => (c.id === coaster.id ? updated : c))
          : [...s.coasters, updated],
      }
    }),

  removeCoaster: (coasterId) =>
    set((s) => ({
      coasters: s.coasters.map((c) =>
        c.id === coasterId ? { ...c, detected: false } : c,
      ),
    })),

  assignDrinkToCoaster: (coasterId, drinkId) =>
    set((s) => ({
      coasters: s.coasters.map((c) =>
        c.id === coasterId ? { ...c, drinkId } : c,
      ),
    })),

  addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),

  updateOrderStatus: (orderId, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    })),

  setGameState: (gameState) => set({ gameState }),
}))
