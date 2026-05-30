/**
 * Global animation rate multiplier for the table Pixi layer.
 * 1 = original design speed; 0.5 = half speed.
 */
export const ANIM_SPEED_MULT = 0.5

export const COASTER_PHASE_RATE = 0.04 * ANIM_SPEED_MULT
export const PREVIEW_PHASE_RATE = 0.06 * ANIM_SPEED_MULT
export const ORDER_BURST_PHASE_RATE = 1 * ANIM_SPEED_MULT
export const DROP_SPEED = 3 * ANIM_SPEED_MULT
export const WALK_SPEED = 1.5 * ANIM_SPEED_MULT

export function scaledAnimationSpeed(speed: number): number {
  return speed * ANIM_SPEED_MULT
}

export function scaledDeltaMs(deltaMS: number): number {
  return deltaMS * ANIM_SPEED_MULT
}
