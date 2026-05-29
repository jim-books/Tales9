import { describe, it, expect, beforeEach } from 'vitest'
import { AnimationDispatcher } from '../engine/AnimationDispatcher'
import type { AnimationCommand } from '../engine/AnimationDispatcher'

describe('AnimationDispatcher', () => {
  let dispatcher: AnimationDispatcher
  let collected: AnimationCommand[]

  beforeEach(() => {
    dispatcher = new AnimationDispatcher()
    collected = []
  })

  it('subscribe receives commands emitted after subscription', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterRemoved('c1')
    expect(collected).toHaveLength(2)
    expect(collected[0].action).toBe('STOP')
    expect(collected[1].action).toBe('DESPAWN_SPRITE')
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

  it('onCoasterConfirmed with valid drinkId emits PLAY then SPAWN_SPRITE', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterConfirmed('c1', { x: 100, y: 200 })

    expect(collected).toHaveLength(2)

    const play = collected[0]
    expect(play.action).toBe('PLAY')
    if (play.action === 'PLAY') {
      expect(play.coasterId).toBe('c1')
      expect(play.profile.id).toBe('irish-coffee')
      expect(play.profile.spriteCharacter).toBe('irish_coffee')
    }

    const spawn = collected[1]
    expect(spawn.action).toBe('SPAWN_SPRITE')
    if (spawn.action === 'SPAWN_SPRITE') {
      expect(spawn.coasterId).toBe('c1')
      expect(spawn.character).toBe('irish_coffee')
      expect(spawn.position).toEqual({ x: 100, y: 200 })
    }
  })

  it('onCoasterRemoved emits STOP then DESPAWN_SPRITE', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.onCoasterRemoved('c1')

    expect(collected).toHaveLength(2)
    expect(collected[0]).toEqual({ action: 'STOP', coasterId: 'c1' })
    expect(collected[1]).toEqual({ action: 'DESPAWN_SPRITE', coasterId: 'c1' })
  })

  it('two subscribers both receive all commands', () => {
    const a: AnimationCommand[] = []
    const b: AnimationCommand[] = []
    dispatcher.subscribe((cmd) => a.push(cmd))
    dispatcher.subscribe((cmd) => b.push(cmd))
    dispatcher.onCoasterRemoved('c1')
    expect(a).toHaveLength(2)
    expect(b).toHaveLength(2)
  })

  it('reassigning a drink changes future dispatches', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.assignDrink('c1', 'peanut')
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })

    expect(collected).toHaveLength(2)
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
    dispatcher.reset()
    dispatcher.onCoasterConfirmed('c1', { x: 0, y: 0 })
    dispatcher.onCoasterConfirmed('c2', { x: 10, y: 10 })
    expect(collected).toHaveLength(0)
  })

  it('only the unsubscribed callback stops receiving', () => {
    const a: AnimationCommand[] = []
    const b: AnimationCommand[] = []
    const unsubA = dispatcher.subscribe((cmd) => a.push(cmd))
    dispatcher.subscribe((cmd) => b.push(cmd))
    unsubA()
    dispatcher.onCoasterRemoved('c1')
    expect(a).toHaveLength(0)
    expect(b).toHaveLength(2)
  })

  it('onCoasterDetected remains a compatibility alias of onCoasterConfirmed', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'irish-coffee')
    dispatcher.onCoasterDetected('c1', { x: 10, y: 20 })
    expect(collected).toHaveLength(2)
    expect(collected[0].action).toBe('PLAY')
    expect(collected[1].action).toBe('SPAWN_SPRITE')
  })
})
