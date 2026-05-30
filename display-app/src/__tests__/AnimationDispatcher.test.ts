import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnimationDispatcher } from '../engine/AnimationDispatcher'
import type { AnimationCommand } from '../engine/AnimationDispatcher'

describe('AnimationDispatcher', () => {
  let dispatcher: AnimationDispatcher
  let collected: AnimationCommand[]

  beforeEach(() => {
    vi.useFakeTimers()
    dispatcher = new AnimationDispatcher()
    collected = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('subscribe receives commands emitted after subscription', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 10, y: 20 })
    expect(collected.map((c) => c.action)).toEqual([
      'PLAY',
      'SPAWN_SPRITE',
      'TWEEN_RING_ALPHA',
      'TWEEN_SPRITE_ALPHA',
    ])
  })

  it('unsubscribe stops receiving commands', () => {
    const unsub = dispatcher.subscribe((cmd) => collected.push(cmd))
    unsub()
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 100, y: 200 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterConfirmed with no assignment emits nothing', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.onCoasterConfirmed('c-unknown', { x: 100, y: 100 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterConfirmed with unknown drinkId emits nothing', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'not-a-real-drink')
    dispatcher.onCoasterConfirmed('c1', { x: 100, y: 100 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterConfirmed with valid drinkId emits pending spawn + fade-in', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 100, y: 200 })

    expect(collected).toHaveLength(4)

    const play = collected[0]
    expect(play.action).toBe('PLAY')
    if (play.action === 'PLAY') {
      expect(play.coasterId).toBe('c1')
      expect(play.position).toEqual({ x: 100, y: 200 })
      expect(play.initialAlpha).toBe(0)
      expect(play.profile.id).toBe('irish-coffee')
      expect(play.profile.spriteCharacter).toBe('irish_coffee')
    }

    const spawn = collected[1]
    expect(spawn.action).toBe('SPAWN_SPRITE')
    if (spawn.action === 'SPAWN_SPRITE') {
      expect(spawn.coasterId).toBe('c1')
      expect(spawn.character).toBe('irish_coffee')
      expect(spawn.position).toEqual({ x: 100, y: 200 })
      expect(spawn.initialAlpha).toBe(0)
    }
  })

  it('losing a pending coaster fades out and ends cycle after grace period', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    dispatcher.onCoasterLost('c1')

    // At first, no fade-out commands are emitted because of the grace period
    expect(collected.filter((c) => c.action === 'TWEEN_RING_ALPHA' && c.toAlpha === 0)).toHaveLength(0)

    vi.advanceTimersByTime(400) // advance past pending grace
    expect(collected.some((c) => c.action === 'TWEEN_RING_ALPHA' && c.toAlpha === 0)).toBe(true)
    expect(collected.some((c) => c.action === 'TWEEN_SPRITE_ALPHA' && c.toAlpha === 0)).toBe(true)

    vi.advanceTimersByTime(1_000) // advance past fail end
    expect(collected[collected.length - 1]).toEqual({ action: 'END_CYCLE', coasterId: 'c1' })
  })

  it('recovering a pending coaster during grace period preserves confirmation', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    
    vi.advanceTimersByTime(300)
    dispatcher.onCoasterLost('c1')
    
    vi.advanceTimersByTime(200) // less than 400ms grace
    dispatcher.onCoasterVisible('c1', { x: 0, y: 0 })

    vi.advanceTimersByTime(600) // remaining pending confirmation time
    
    // It should NOT end cycle
    expect(collected.some((c) => c.action === 'END_CYCLE')).toBe(false)
  })

  it('two subscribers both receive all commands', () => {
    const a: AnimationCommand[] = []
    const b: AnimationCommand[] = []
    dispatcher.subscribe((cmd) => a.push(cmd))
    dispatcher.subscribe((cmd) => b.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 5, y: 5 })
    expect(a).toHaveLength(4)
    expect(b).toHaveLength(4)
  })

  it('reassigning a drink changes future dispatches', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.assignDrink('c1', 'peanut')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })

    expect(collected).toHaveLength(4)
    const play = collected[0]
    if (play.action === 'PLAY') {
      expect(play.profile.id).toBe('peanut')
    }
  })

  it('clearAssignment removes mapping for one coaster', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.clearAssignment('c1')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    expect(collected).toHaveLength(0)
  })

  it('reset clears all assignment mappings', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.assignDrink('c2', 'peanut')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    dispatcher.reset()
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    dispatcher.onCoasterConfirmed('c2', { x: 10, y: 10 })
    expect(collected[collected.length - 1]).toEqual({ action: 'END_CYCLE', coasterId: 'c1' })
  })

  it('only the unsubscribed callback stops receiving', () => {
    const a: AnimationCommand[] = []
    const b: AnimationCommand[] = []
    const unsubA = dispatcher.subscribe((cmd) => a.push(cmd))
    dispatcher.subscribe((cmd) => b.push(cmd))
    unsubA()
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 1, y: 1 })
    expect(a).toHaveLength(0)
    expect(b).toHaveLength(4)
  })

  it('onCoasterDetected remains a compatibility alias of onCoasterConfirmed', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterDetected('c1', { x: 10, y: 20 })
    expect(collected).toHaveLength(4)
    expect(collected[0].action).toBe('PLAY')
    expect(collected[1].action).toBe('SPAWN_SPRITE')
  })

  it('confirmed coaster starts ring fade at 2s lost and sprite fade at 30s', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    vi.advanceTimersByTime(1_000) // pending window complete

    dispatcher.onCoasterLost('c1')
    vi.advanceTimersByTime(1_999)
    expect(collected.filter((c) => c.action === 'TWEEN_RING_ALPHA')).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(collected.filter((c) => c.action === 'TWEEN_RING_ALPHA')).toHaveLength(2)

    vi.advanceTimersByTime(28_000)
    expect(collected.filter((c) => c.action === 'TWEEN_SPRITE_ALPHA')).toHaveLength(2)

    vi.advanceTimersByTime(1_000)
    expect(collected[collected.length - 1]).toEqual({ action: 'END_CYCLE', coasterId: 'c1' })
  })

  it('recovery cancels pending lost timers and restores alpha', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    vi.advanceTimersByTime(1_000)
    dispatcher.onCoasterLost('c1')

    vi.advanceTimersByTime(1_000)
    dispatcher.onCoasterVisible('c1', { x: 10, y: 10 })

    expect(collected.some((c) => c.action === 'CANCEL_RING_TWEEN')).toBe(true)
    expect(collected.some((c) => c.action === 'CANCEL_SPRITE_TWEEN')).toBe(true)

    const before = collected.length
    vi.advanceTimersByTime(35_000)
    expect(collected).toHaveLength(before)
  })
})
