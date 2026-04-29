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

// ─── Apple Tart ──────────────────────────────────────────────────────────────

const APPLE_TART_DEF: SpriteAnimDef = {
  character: 'apple',
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
  scale: 1.5,
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
  scale: 1.5,
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
  scale: 1.5,
}

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Maps DrinkProfile.spriteCharacter → SpriteAnimDef.
 * IngredientSprite checks this at construction time.
 */
export const spriteRegistry = new Map<string, SpriteAnimDef>([
  ['apple', APPLE_TART_DEF],
  ['mangosticky_rice', MANGOSTICKY_RICE_DEF],
  ['sb_cc', SB_CC_DEF],
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
