/**
 * SpriteAnimDef — protocol types and registry for frame-based sprite animations.
 *
 * To register a new character:
 *   1. Drop PNG frames in public/sprites/<character-key>/<clip>/
 *   2. Add a SpriteAnimDef entry below
 *   3. Call spriteRegistry.set('<spriteCharacter value>', def)
 *
 * No PixiJS imports — this module is pure TypeScript data.
 */

export interface SpriteFrameSet {
  /** Ordered absolute public paths, served from /public */
  frames: string[]
  /**
   * PixiJS animationSpeed (frames advanced per ticker tick at 60fps).
   * 0.15 ≈ 9 fps stop-motion feel; 0.2 ≈ 12 fps.
   */
  animationSpeed: number
  /** Number of times to play before stopping. -1 = infinite. */
  loops: number
}

export interface SpriteAnimDef {
  /** Matches DrinkProfile.spriteCharacter */
  character: string
  /** Animation played while physically dropping toward the canvas edge */
  fall: SpriteFrameSet
  /** Animation played while walking the perimeter (after fall completes) */
  walk: SpriteFrameSet
  /**
   * Shown during FALL_WAIT (after landing, before perimeter walk) if defined.
   * If omitted but `wave` is set, `wave` is used instead.
   */
  idle?: SpriteFrameSet
  /**
   * Alternative FALL_WAIT clip (e.g. wave greeting). Ignored when `idle` is set.
   */
  wave?: SpriteFrameSet
  /** Uniform display scale applied to the AnimatedSprite */
  scale: number
}

/** Resolved clip between fall landing and walking (preload + playback). */
export function getFallWaitClip(def: SpriteAnimDef): SpriteFrameSet | undefined {
  return def.idle ?? def.wave
}

// ─── Apple Tart ───────────────────────────────────────────────────────────────

const APPLE_TART_DEF: SpriteAnimDef = {
  character: 'apple_tart',
  fall: {
    frames: Array.from({ length: 10 }, (_, i) =>
      `/sprites/apple-tart/fall/Apple8bitFallSep${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 5 }, (_, i) =>
      `/sprites/apple-tart/walk/Apple8bitWalkSep${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  wave: {
    frames: Array.from({ length: 9 }, (_, i) =>
      `/sprites/apple-tart/wave/Apple8bitWave${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Irish Coffee ─────────────────────────────────────────────────────────────

const IRISH_COFFEE_DEF: SpriteAnimDef = {
  character: 'irish_coffee',
  fall: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/irish-coffee/fall/IrishCoffee8bitFall${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 4 }, (_, i) =>
      `/sprites/irish-coffee/walk/IrishCoffee8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  wave: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/irish-coffee/wave/IrishCoffee8bitWave${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Mango Sticky Rice ────────────────────────────────────────────────────────

const MANGOSTICKY_RICE_DEF: SpriteAnimDef = {
  character: 'mangosticky_rice',
  fall: {
    frames: Array.from({ length: 9 }, (_, i) =>
      `/sprites/mangosticky-rice/fall/Mangostickyrice8biFallt${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 4 }, (_, i) =>
      `/sprites/mangosticky-rice/walk/Mangostickyrice8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  idle: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/mangosticky-rice/idle/Mangostickyrice8bitIDLE${i + 1}.png`,
    ),
    animationSpeed: 0.1,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Peanut ───────────────────────────────────────────────────────────────────

const PEANUT_DEF: SpriteAnimDef = {
  character: 'peanut',
  fall: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/peanut/fall/Peanut8bitFall${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 4 }, (_, i) =>
      `/sprites/peanut/walk/Peanut8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  idle: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/peanut/idle/Peanut8bitYawn${i + 1}.png`,
    ),
    animationSpeed: 0.1,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Pistachio ────────────────────────────────────────────────────────────────

const PISTACHIO_DEF: SpriteAnimDef = {
  character: 'pistachio',
  fall: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/pistachio/fall/Pistachio8bitFall${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 4 }, (_, i) =>
      `/sprites/pistachio/walk/Pistachio8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  idle: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/pistachio/idle/Pistachio8bitIDLE${i + 1}.png`,
    ),
    animationSpeed: 0.1,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Salted / SbCc character ─────────────────────────────────────────────────-

const SB_CC_DEF: SpriteAnimDef = {
  character: 'sb_cc',
  fall: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/sb-cc/fall/SbCc8bitFall${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/sb-cc/walk/SbCc8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.11,
    loops: -1,
  },
  idle: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/sb-cc/idle/SbCc8bitIDLE${i + 1}.png`,
    ),
    animationSpeed: 0.1,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Tangyuan ─────────────────────────────────────────────────────────────────

const TANGYUAN_DEF: SpriteAnimDef = {
  character: 'tangyuan',
  fall: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/tangyuan/fall/Tangyuan8bitFall${i + 1}.png`,
    ),
    animationSpeed: 0.15,
    loops: 2,
  },
  walk: {
    frames: Array.from({ length: 4 }, (_, i) =>
      `/sprites/tangyuan/walk/Tangyuan8bitWalk${i + 1}.png`,
    ),
    animationSpeed: 0.12,
    loops: -1,
  },
  idle: {
    frames: Array.from({ length: 8 }, (_, i) =>
      `/sprites/tangyuan/idle/Tangyuan8bitJump${i + 1}.png`,
    ),
    animationSpeed: 0.1,
    loops: -1,
  },
  scale: 1.0125,
}

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Maps DrinkProfile.spriteCharacter → SpriteAnimDef.
 * IngredientSprite checks this at construction time.
 */
export const spriteRegistry = new Map<string, SpriteAnimDef>([
  ['apple_tart', APPLE_TART_DEF],
  ['irish_coffee', IRISH_COFFEE_DEF],
  ['mangosticky_rice', MANGOSTICKY_RICE_DEF],
  ['peanut', PEANUT_DEF],
  ['pistachio', PISTACHIO_DEF],
  ['sb_cc', SB_CC_DEF],
  ['tangyuan', TANGYUAN_DEF],
])

/**
 * Returns all frame URLs across all registered sprite defs.
 * Used by PixiStage to pre-load textures before any sprites are spawned.
 */
export function getAllSpriteUrls(): string[] {
  const urls: string[] = []
  for (const def of spriteRegistry.values()) {
    urls.push(...def.fall.frames, ...def.walk.frames)
    const wait = getFallWaitClip(def)
    if (wait) urls.push(...wait.frames)
  }
  return urls
}
