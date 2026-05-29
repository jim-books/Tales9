import { create } from 'zustand'
import type {
  UserNode,
  Coaster,
  Order,
  GameState,
  GameType,
  UserColor,
  UserEdge,
  Point,
  OrderStatus,
} from '../types'
import { writeOrderToFirestore } from '../services/firebaseService'

const USER_COLORS: UserColor[] = ['blue', 'green', 'orange', 'purple']

/** Predefined spawn positions for up to 4 users (normalised 0–1, relative to canvas) */
const SPAWN_POSITIONS: Point[] = [
  { x: 0.25, y: 0.88 }, // bottom-left (user 0)
  { x: 0.75, y: 0.88 }, // bottom-right (user 1)
  { x: 0.25, y: 0.12 }, // top-left (user 2)
  { x: 0.75, y: 0.12 }, // top-right (user 3)
]

function nearestEdgeFromPosition(position: Point): UserEdge {
  const distances: Array<[UserEdge, number]> = [
    ['top', position.y],
    ['right', 1 - position.x],
    ['bottom', 1 - position.y],
    ['left', position.x],
  ]
  distances.sort((a, b) => a[1] - b[1])
  return distances[0][0]
}

interface AppState {
  // ─── Session ─────────────────────────────────────────────────────────────
  sessionActive: boolean
  userCount: number
  userNodes: UserNode[]

  // ─── Coasters ────────────────────────────────────────────────────────────
  coasters: Coaster[]
  /** Firebase/iOS assignments keyed by coasterId, applied when coaster appears */
  coasterDrinkAssignments: Record<string, string>

  // ─── Orders ──────────────────────────────────────────────────────────────
  orders: Order[]

  // ─── Games ───────────────────────────────────────────────────────────────
  gameState: GameState | null

  // ─── Visual effects ───────────────────────────────────────────────────────
  orderBurst: { x: number; y: number; colorHex: number } | null

  // ─── Actions ─────────────────────────────────────────────────────────────
  startSession: (userCount: number) => void
  endSession: () => void

  setUserNodePosition: (nodeId: string, position: Point) => void
  setUserNodeViewEdge: (nodeId: string, edge: UserEdge) => void
  lockUserNodeOrientation: (nodeId: string, edge: UserEdge) => void
  unlockUserNodeOrientation: (nodeId: string) => void
  togglePanel: (nodeId: string) => void

  upsertCoaster: (
    coaster: Omit<Coaster, 'drinkId' | 'detected' | 'detectionState'> & {
      drinkId?: string | null
      detectionState?: Coaster['detectionState']
    },
  ) => void
  removeCoaster: (coasterId: string) => void
  assignDrinkToCoaster: (coasterId: string, drinkId: string | null) => void

  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  linkOrderToCoaster: (orderId: string, coasterId: string) => void
  unlinkOrdersFromCoaster: (coasterId: string) => void
  arriveOrderByCoaster: (coasterId: string) => void

  setGameState: (game: GameState | null) => void
  startGame: (type: GameType) => void
  advanceGame: (phase: number, chosenCoasterId: string | null, chosenUserId: string | null) => void
  endGame: () => void

  triggerOrderBurst: (x: number, y: number, colorHex: number) => void
  clearOrderBurst: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sessionActive: false,
  userCount: 0,
  userNodes: [],
  coasters: [],
  coasterDrinkAssignments: {},
  orders: [],
  gameState: null,
  orderBurst: null,

  startSession: (userCount) =>
    set({
      sessionActive: true,
      userCount,
      userNodes: Array.from({ length: userCount }, (_, i) => ({
        position: SPAWN_POSITIONS[i],
        ownerEdge: nearestEdgeFromPosition(SPAWN_POSITIONS[i]),
        viewEdge: nearestEdgeFromPosition(SPAWN_POSITIONS[i]),
        lockedEdge: null,
        id: `user-${i}`,
        ownerIndex: i,
        color: USER_COLORS[i],
        panelOpen: false,
      })),
      orders: [],
      coasters: [],
      coasterDrinkAssignments: {},
      gameState: null,
    }),

  endSession: () =>
    set({
      sessionActive: false,
      userCount: 0,
      userNodes: [],
      coasters: [],
      coasterDrinkAssignments: {},
      orders: [],
      gameState: null,
    }),

  setUserNodePosition: (nodeId, position) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    })),

  setUserNodeViewEdge: (nodeId, edge) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) => (n.id === nodeId ? { ...n, viewEdge: edge } : n)),
    })),

  lockUserNodeOrientation: (nodeId, edge) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) =>
        n.id === nodeId ? { ...n, lockedEdge: edge } : n,
      ),
    })),

  unlockUserNodeOrientation: (nodeId) =>
    set((s) => ({
      userNodes: s.userNodes.map((n) =>
        n.id === nodeId ? { ...n, lockedEdge: null } : n,
      ),
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
      const detectionState = coaster.detectionState ?? existing?.detectionState ?? 'confirmed'
      const pendingDrink = s.coasterDrinkAssignments[coaster.id] ?? null
      const resolvedDrinkId = coaster.drinkId ?? existing?.drinkId ?? pendingDrink ?? null
      const updated: Coaster = {
        ...coaster,
        drinkId: resolvedDrinkId,
        detectionState,
        detected: detectionState === 'confirmed',
      }
      return {
        coasters: existing
          ? s.coasters.map((c) => (c.id === coaster.id ? updated : c))
          : [...s.coasters, updated],
      }
    }),

  removeCoaster: (coasterId) =>
    set((s) => ({
      coasters: s.coasters.filter((c) => c.id !== coasterId),
    })),

  assignDrinkToCoaster: (coasterId, drinkId) =>
    set((s) => {
      const existing = s.coasters.find((c) => c.id === coasterId)
      const nextAssignments = { ...s.coasterDrinkAssignments }
      if (drinkId) {
        nextAssignments[coasterId] = drinkId
      } else {
        delete nextAssignments[coasterId]
      }
      return {
        coasterDrinkAssignments: nextAssignments,
        coasters: existing
          ? s.coasters.map((c) =>
              c.id === coasterId ? { ...c, drinkId } : c,
            )
          : s.coasters,
      }
    }),

  addOrder: (order) => {
    set((s) => ({ orders: [...s.orders, order] }))
    void writeOrderToFirestore(order)
  },

  updateOrderStatus: (orderId, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    })),

  linkOrderToCoaster: (orderId, coasterId) =>
    set((s) => {
      // Idempotent guard: WS + Firestore may emit the same assignment.
      return {
        orders: s.orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, coasterId }
          }
          return o
        }),
      }
    }),

  unlinkOrdersFromCoaster: (coasterId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.coasterId === coasterId ? { ...o, coasterId: null } : o,
      ),
    })),

  arriveOrderByCoaster: (coasterId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.coasterId === coasterId && o.status !== 'arrived'
          ? { ...o, status: 'arrived' as const }
          : o,
      ),
    })),

  setGameState: (gameState) => set({ gameState }),

  startGame: (type) =>
    set({ gameState: { type, phase: 0, chosenCoasterId: null, chosenUserId: null } }),

  advanceGame: (phase, chosenCoasterId, chosenUserId) =>
    set((s) =>
      s.gameState
        ? { gameState: { ...s.gameState, phase, chosenCoasterId, chosenUserId } }
        : {},
    ),

  endGame: () => set({ gameState: null }),

  triggerOrderBurst: (x, y, colorHex) => set({ orderBurst: { x, y, colorHex } }),
  clearOrderBurst: () => set({ orderBurst: null }),
}))
