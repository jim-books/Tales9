import type { DrinkProfile } from '../types'
import { getDrinkById } from '../data/drinkCatalog'

/**
 * AnimationDispatcher
 *
 * Maps a coaster ID + drink profile to an animation command.
 * Keeps animation logic out of the PixiJS rendering layer.
 * The renderer subscribes to commands emitted here.
 */

export type AnimationCommand =
  | { action: 'PLAY'; coasterId: string; profile: DrinkProfile }
  | { action: 'STOP'; coasterId: string }
  | { action: 'SPAWN_SPRITE'; coasterId: string; character: string; position: { x: number; y: number } }
  | { action: 'DESPAWN_SPRITE'; coasterId: string }

export type AnimationCommandCallback = (cmd: AnimationCommand) => void

export class AnimationDispatcher {
  private subscribers: AnimationCommandCallback[] = []
  /** coasterId → drinkId mapping set by bartender app */
  private assignments = new Map<string, string>()

  subscribe(cb: AnimationCommandCallback): () => void {
    this.subscribers.push(cb)
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb)
    }
  }

  /** Called by the bartender app (via WebSocket) when a coaster is assigned a drink */
  assignDrink(coasterId: string, drinkId: string): void {
    this.assignments.set(coasterId, drinkId)
  }

  /** Called by TrackingEngine when a coaster is detected on the surface */
  onCoasterDetected(coasterId: string, position: { x: number; y: number }): void {
    const drinkId = this.assignments.get(coasterId)
    if (!drinkId) return

    const profile = getDrinkById(drinkId)
    if (!profile) return

    this.emit({ action: 'PLAY', coasterId, profile })
    this.emit({ action: 'SPAWN_SPRITE', coasterId, character: profile.spriteCharacter, position })
  }

  /** Called by TrackingEngine when a coaster has been removed */
  onCoasterRemoved(coasterId: string): void {
    this.emit({ action: 'STOP', coasterId })
    this.emit({ action: 'DESPAWN_SPRITE', coasterId })
  }

  private emit(cmd: AnimationCommand): void {
    for (const cb of this.subscribers) {
      cb(cmd)
    }
  }
}
