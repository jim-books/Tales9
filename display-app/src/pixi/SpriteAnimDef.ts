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
  /** Uniform display scale applied to the AnimatedSprite */
  scale: number
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
  scale: 3.0,
}

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Maps DrinkProfile.spriteCharacter → SpriteAnimDef.
 * IngredientSprite checks this at construction time.
 */
export const spriteRegistry = new Map<string, SpriteAnimDef>([
  ['apple', APPLE_TART_DEF],
])

/**
 * Returns all frame URLs across all registered sprite defs.
 * Used by PixiStage to pre-load textures before any sprites are spawned.
 */
export function getAllSpriteUrls(): string[] {
  const urls: string[] = []
  for (const def of spriteRegistry.values()) {
    urls.push(...def.fall.frames, ...def.walk.frames)
  }
  return urls
}
