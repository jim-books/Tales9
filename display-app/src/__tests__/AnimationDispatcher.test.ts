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
    dispatcher.assignDrink('c1', 'pisco-colada')
    dispatcher.onCoasterRemoved('c1')
    expect(collected).toHaveLength(2)
    expect(collected[0].action).toBe('STOP')
    expect(collected[1].action).toBe('DESPAWN_SPRITE')
  })

  it('unsubscribe stops receiving commands', () => {
    const unsub = dispatcher.subscribe((cmd) => collected.push(cmd))
    unsub()
    dispatcher.assignDrink('c1', 'pisco-colada')
    dispatcher.onCoasterDetected('c1', { x: 100, y: 200 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterDetected with no assignment emits nothing', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.onCoasterDetected('c-unknown', { x: 100, y: 100 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterDetected with unknown drinkId emits nothing', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'not-a-real-drink')
    dispatcher.onCoasterDetected('c1', { x: 100, y: 100 })
    expect(collected).toHaveLength(0)
  })

  it('onCoasterDetected with valid drinkId emits PLAY then SPAWN_SPRITE', () => {
    dispatcher.subscribe((cmd) => collected.push(cmd))
    dispatcher.assignDrink('c1', 'pisco-colada')
    dispatcher.onCoasterDetected('c1', { x: 100, y: 200 })

    expect(collected).toHaveLength(2)

    const play = collected[0]
    expect(play.action).toBe('PLAY')
    if (play.action === 'PLAY') {
      expect(play.coasterId).toBe('c1')
      expect(play.profile.id).toBe('pisco-colada')
      expect(play.profile.spriteCharacter).toBe('pineapple')
    }

    const spawn = collected[1]
    expect(spawn.action).toBe('SPAWN_SPRITE')
    if (spawn.action === 'SPAWN_SPRITE') {
      expect(spawn.coasterId).toBe('c1')
      expect(spawn.character).toBe('pineapple')
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
    dispatcher.assignDrink('c1', 'pisco-colada')
    dispatcher.assignDrink('c1', 'espresso-martini')
    dispatcher.onCoasterDetected('c1', { x: 0, y: 0 })

    expect(collected).toHaveLength(2)
    const play = collected[0]
    if (play.action === 'PLAY') {
      expect(play.profile.id).toBe('espresso-martini')
    }
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
})
