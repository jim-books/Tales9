import type { DrinkProfile } from '../types'
import { getDrinkById } from '../data/drinkCatalog'

/**
 * AnimationDispatcher
 *
 * Maps a coaster ID + drink profile to an animation command.
 * Keeps animation logic out of the PixiJS rendering layer.
 * The renderer subscribes to commands emitted here.
 */

export const PENDING_CONFIRM_MS = 1_000
export const PENDING_FAIL_FADE_MS = 1_000
export const LOST_GRACE_MS = 2_000
export const LOST_RING_FADE_MS = 3_000
export const LOST_TO_NPC_FADE_MS = 30_000
export const NPC_FADE_MS = 1_000

export type AnimationCommand =
  | { action: 'PLAY'; coasterId: string; profile: DrinkProfile; position: { x: number; y: number }; initialAlpha: number }
  | { action: 'SPAWN_SPRITE'; coasterId: string; character: string; position: { x: number; y: number }; initialAlpha: number }
  | { action: 'UPDATE_POSITION'; coasterId: string; position: { x: number; y: number } }
  | { action: 'TWEEN_RING_ALPHA'; coasterId: string; toAlpha: number; durationMs: number }
  | { action: 'TWEEN_SPRITE_ALPHA'; coasterId: string; toAlpha: number; durationMs: number }
  | { action: 'CANCEL_RING_TWEEN'; coasterId: string; alpha: number }
  | { action: 'CANCEL_SPRITE_TWEEN'; coasterId: string; alpha: number }
  | { action: 'END_CYCLE'; coasterId: string }

export type AnimationCommandCallback = (cmd: AnimationCommand) => void

type CoasterLifecyclePhase = 'pending' | 'confirmed' | 'failing'

interface LifecycleTimers {
  pendingConfirm?: ReturnType<typeof setTimeout>
  failEnd?: ReturnType<typeof setTimeout>
  ringFadeStart?: ReturnType<typeof setTimeout>
  spriteFadeStart?: ReturnType<typeof setTimeout>
  cycleEnd?: ReturnType<typeof setTimeout>
}

interface CoasterLifecycleState {
  phase: CoasterLifecyclePhase
  lostSince: number | null
  timers: LifecycleTimers
}

export class AnimationDispatcher {
  private subscribers: AnimationCommandCallback[] = []
  /** coasterId → drinkId mapping set by bartender app */
  private assignments = new Map<string, string>()
  private lifecycle = new Map<string, CoasterLifecycleState>()

  subscribe(cb: AnimationCommandCallback): () => void {
    this.subscribers.push(cb)
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb)
    }
  }

  /** Called when a coaster is assigned a drink (e.g. via Firebase/iOS tooling). */
  assignDrink(coasterId: string, drinkId: string): void {
    this.assignments.set(coasterId, drinkId)
  }

  /** Clears one coaster assignment (e.g. Firestore assignment doc removed). */
  clearAssignment(coasterId: string): void {
    this.assignments.delete(coasterId)
  }

  /** Clears all assignment mappings (e.g. session restart/end). */
  reset(): void {
    for (const coasterId of this.lifecycle.keys()) {
      this.clearAllTimers(coasterId)
      this.emit({ action: 'END_CYCLE', coasterId })
    }
    this.lifecycle.clear()
    this.assignments.clear()
  }

  /** Called by TrackingEngine once a coaster is identity-confirmed. */
  onCoasterConfirmed(coasterId: string, position: { x: number; y: number }): void {
    const existing = this.lifecycle.get(coasterId)
    if (existing) {
      this.emit({ action: 'UPDATE_POSITION', coasterId, position })
      this.onCoasterVisible(coasterId, position)
      return
    }

    const profile = this.resolveProfile(coasterId)
    if (!profile) return

    this.lifecycle.set(coasterId, {
      phase: 'pending',
      lostSince: null,
      timers: {},
    })

    this.emit({ action: 'PLAY', coasterId, profile, position, initialAlpha: 0 })
    this.emit({
      action: 'SPAWN_SPRITE',
      coasterId,
      character: profile.spriteCharacter,
      position,
      initialAlpha: 0,
    })
    this.emit({ action: 'TWEEN_RING_ALPHA', coasterId, toAlpha: 1, durationMs: PENDING_CONFIRM_MS })
    this.emit({ action: 'TWEEN_SPRITE_ALPHA', coasterId, toAlpha: 1, durationMs: PENDING_CONFIRM_MS })

    this.schedule(coasterId, 'pendingConfirm', PENDING_CONFIRM_MS, () => {
      const state = this.lifecycle.get(coasterId)
      if (!state || state.phase !== 'pending' || state.lostSince !== null) return
      state.phase = 'confirmed'
    })
  }

  onCoasterUpdated(coasterId: string, position: { x: number; y: number }): void {
    if (!this.lifecycle.has(coasterId)) return
    this.emit({ action: 'UPDATE_POSITION', coasterId, position })
  }

  onCoasterLost(coasterId: string): void {
    const state = this.lifecycle.get(coasterId)
    if (!state || state.lostSince !== null) return
    state.lostSince = Date.now()

    if (state.phase === 'pending') {
      state.phase = 'failing'
      this.clearTimer(coasterId, 'pendingConfirm')
      this.emit({ action: 'TWEEN_RING_ALPHA', coasterId, toAlpha: 0, durationMs: PENDING_FAIL_FADE_MS })
      this.emit({ action: 'TWEEN_SPRITE_ALPHA', coasterId, toAlpha: 0, durationMs: PENDING_FAIL_FADE_MS })
      this.schedule(coasterId, 'failEnd', PENDING_FAIL_FADE_MS, () => this.endCycle(coasterId))
      return
    }

    if (state.phase !== 'confirmed') return
    this.schedule(coasterId, 'ringFadeStart', LOST_GRACE_MS, () => {
      const next = this.lifecycle.get(coasterId)
      if (!next || next.lostSince === null) return
      this.emit({ action: 'TWEEN_RING_ALPHA', coasterId, toAlpha: 0, durationMs: LOST_RING_FADE_MS })
    })
    this.schedule(coasterId, 'spriteFadeStart', LOST_TO_NPC_FADE_MS, () => {
      const next = this.lifecycle.get(coasterId)
      if (!next || next.lostSince === null) return
      this.emit({ action: 'TWEEN_SPRITE_ALPHA', coasterId, toAlpha: 0, durationMs: NPC_FADE_MS })
    })
    this.schedule(coasterId, 'cycleEnd', LOST_TO_NPC_FADE_MS + NPC_FADE_MS, () => {
      const next = this.lifecycle.get(coasterId)
      if (!next || next.lostSince === null) return
      this.endCycle(coasterId)
    })
  }

  onCoasterVisible(coasterId: string, position: { x: number; y: number }): void {
    const state = this.lifecycle.get(coasterId)
    if (!state) return
    this.emit({ action: 'UPDATE_POSITION', coasterId, position })

    if (state.phase === 'failing' || state.lostSince === null) return
    state.lostSince = null
    this.clearTimer(coasterId, 'ringFadeStart')
    this.clearTimer(coasterId, 'spriteFadeStart')
    this.clearTimer(coasterId, 'cycleEnd')
    this.emit({ action: 'CANCEL_RING_TWEEN', coasterId, alpha: 1 })
    this.emit({ action: 'CANCEL_SPRITE_TWEEN', coasterId, alpha: 1 })
  }

  /** Backward-compatible alias: detection events should call `onCoasterConfirmed`. */
  onCoasterDetected(coasterId: string, position: { x: number; y: number }): void {
    this.onCoasterConfirmed(coasterId, position)
  }

  /** Called by TrackingEngine when a coaster is purged from touch tracking. */
  onCoasterRemoved(coasterId: string): void {
    if (!this.lifecycle.has(coasterId)) return
  }

  onSpriteDespawned(coasterId: string): void {
    if (!this.lifecycle.has(coasterId)) return
  }

  endCoasterCycle(coasterId: string): void {
    this.endCycle(coasterId)
  }

  /** Clears subscribers on app shutdown. */
  dispose(): void {
    for (const coasterId of this.lifecycle.keys()) {
      this.clearAllTimers(coasterId)
    }
    this.lifecycle.clear()
    this.subscribers = []
  }

  private emit(cmd: AnimationCommand): void {
    for (const cb of this.subscribers) {
      cb(cmd)
    }
  }

  private resolveProfile(coasterId: string): DrinkProfile | null {
    const drinkId = this.assignments.get(coasterId)
    if (!drinkId) return null
    return getDrinkById(drinkId) ?? null
  }

  private schedule(
    coasterId: string,
    key: keyof LifecycleTimers,
    delayMs: number,
    callback: () => void,
  ): void {
    this.clearTimer(coasterId, key)
    const state = this.lifecycle.get(coasterId)
    if (!state) return
    state.timers[key] = setTimeout(callback, delayMs)
  }

  private clearTimer(coasterId: string, key: keyof LifecycleTimers): void {
    const state = this.lifecycle.get(coasterId)
    if (!state) return
    const timer = state.timers[key]
    if (timer) {
      clearTimeout(timer)
    }
    state.timers[key] = undefined
  }

  private clearAllTimers(coasterId: string): void {
    this.clearTimer(coasterId, 'pendingConfirm')
    this.clearTimer(coasterId, 'failEnd')
    this.clearTimer(coasterId, 'ringFadeStart')
    this.clearTimer(coasterId, 'spriteFadeStart')
    this.clearTimer(coasterId, 'cycleEnd')
  }

  private endCycle(coasterId: string): void {
    if (!this.lifecycle.has(coasterId)) return
    this.clearAllTimers(coasterId)
    this.lifecycle.delete(coasterId)
    this.emit({ action: 'END_CYCLE', coasterId })
  }
}
