import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'

beforeEach(() => {
  // Reset store to initial state before each test
  useAppStore.getState().endSession()
})

describe('useAppStore', () => {
  it('starts with sessionActive = false', () => {
    expect(useAppStore.getState().sessionActive).toBe(false)
  })

  it('startSession creates correct number of user nodes', () => {
    useAppStore.getState().startSession(3)
    const state = useAppStore.getState()
    expect(state.sessionActive).toBe(true)
    expect(state.userNodes).toHaveLength(3)
    expect(state.userCount).toBe(3)
  })

  it('user nodes have unique colors', () => {
    useAppStore.getState().startSession(4)
    const colors = useAppStore.getState().userNodes.map((n) => n.color)
    expect(new Set(colors).size).toBe(4)
  })

  it('user nodes start with panels closed', () => {
    useAppStore.getState().startSession(2)
    const nodes = useAppStore.getState().userNodes
    expect(nodes.every((n) => !n.panelOpen)).toBe(true)
  })

  it('togglePanel opens and then closes a panel', () => {
    useAppStore.getState().startSession(2)
    const id = useAppStore.getState().userNodes[0].id
    useAppStore.getState().togglePanel(id)
    expect(useAppStore.getState().userNodes[0].panelOpen).toBe(true)
    useAppStore.getState().togglePanel(id)
    expect(useAppStore.getState().userNodes[0].panelOpen).toBe(false)
  })

  it('setUserNodePosition updates position', () => {
    useAppStore.getState().startSession(1)
    const id = useAppStore.getState().userNodes[0].id
    useAppStore.getState().setUserNodePosition(id, { x: 0.5, y: 0.5 })
    expect(useAppStore.getState().userNodes[0].position).toEqual({ x: 0.5, y: 0.5 })
  })

  it('endSession resets all state', () => {
    useAppStore.getState().startSession(4)
    useAppStore.getState().endSession()
    const state = useAppStore.getState()
    expect(state.sessionActive).toBe(false)
    expect(state.userNodes).toHaveLength(0)
    expect(state.coasters).toHaveLength(0)
    expect(state.orders).toHaveLength(0)
  })

  it('updateOrderStatus changes only the targeted order', () => {
    useAppStore.getState().startSession(1)
    useAppStore.getState().addOrder({
      id: 'ord-1', userId: 'user-0', drinkId: 'pisco-colada',
      status: 'pending', coasterId: null, createdAt: 0,
    })
    useAppStore.getState().addOrder({
      id: 'ord-2', userId: 'user-0', drinkId: 'momo-sour',
      status: 'pending', coasterId: null, createdAt: 0,
    })
    useAppStore.getState().updateOrderStatus('ord-1', 'preparing')
    const orders = useAppStore.getState().orders
    expect(orders.find((o) => o.id === 'ord-1')?.status).toBe('preparing')
    expect(orders.find((o) => o.id === 'ord-2')?.status).toBe('pending')
  })

  it('assignDrinkToCoaster sets drinkId on existing coaster', () => {
    useAppStore.getState().startSession(1)
    useAppStore.getState().upsertCoaster({
      id: 'coaster-1',
      signature: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.5, y: 1 }],
      centroid: { x: 0.5, y: 0.33 },
      detected: true,
    })
    useAppStore.getState().assignDrinkToCoaster('coaster-1', 'pisco-colada')
    const coaster = useAppStore.getState().coasters.find((c) => c.id === 'coaster-1')
    expect(coaster?.drinkId).toBe('pisco-colada')
  })
})
