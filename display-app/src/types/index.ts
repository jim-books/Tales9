// ─── Core domain types ────────────────────────────────────────────────────────

export type AnimationFamily = 'energetic' | 'elegant' | 'tropical' | 'bold'
export type DrinkCategory = 'CLASSICS' | 'COFFEE_BASED' | 'DESSERT_INSPIRED'
export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'arrived'
export type GameType = 'truth_or_dare' | 'kings_game'
export type UserColor = 'blue' | 'green' | 'orange' | 'purple'
export type UserEdge = 'top' | 'right' | 'bottom' | 'left'
export type CoasterDetectionState = 'preview' | 'confirmed' | 'lost'

export interface OrbitLine {
  radius: number
  width: number
  dashCount?: number
  dashRatio?: number
  speed: number
  alpha: number
  colorIndex: number
  breathe?: {
    speed: number
    amp: number
  }
}

export interface OrbitParticle {
  radius: number
  count: number
  size: number
  speed: number
  alpha: number
  colorIndex: number
}

export interface WaveRing {
  radius: number
  width: number
  amplitude: number
  wavelength: number
  speed: number
  alpha: number
  colorIndex: number
  glow?: boolean
  fillAlpha?: number
  breathe?: {
    speed: number
    amp: number
  }
}

export interface RadialSpoke {
  innerRadius: number
  outerRadius: number
  count: number
  width: number
  speed: number
  alpha: number
  colorIndex: number
  crosshair?: boolean
}

export interface OrbitalPreset {
  lines: OrbitLine[]
  particles: OrbitParticle[]
  waves: WaveRing[]
  spokes: RadialSpoke[]
}

export interface DrinkProfile {
  id: string
  name: string
  category: DrinkCategory
  price: number
  flavorProfile: string
  ingredients: string[]
  animationFamily: AnimationFamily
  colorPalette: [string, string, string]
  spriteCharacter: string
  description: string
  imageUrl?: string
  orbitalPreset?: OrbitalPreset
}

/** Raw 2D point — used for touch input and display coords */
export interface Point {
  x: number
  y: number
}

/** Three contact points from a coaster on the touch surface */
export type CoasterTouchSignature = [Point, Point, Point]

export interface Coaster {
  id: string
  signature: CoasterTouchSignature
  centroid: Point
  drinkId: string | null
  detectionState: CoasterDetectionState
  /** Backward-compatible flag: true only while a coaster is confirmed */
  detected: boolean
}

export interface UserNode {
  id: string
  /** Predefined owner index 0–3 */
  ownerIndex: number
  color: UserColor
  position: Point
  /** Fixed spawn-derived edge representing the node owner's side */
  ownerEdge: UserEdge
  /** Current inferred viewer-facing edge (dynamic handoff target) */
  viewEdge: UserEdge
  /** Locks orientation while panel is open to keep content readable */
  lockedEdge: UserEdge | null
  panelOpen: boolean
}

export interface Order {
  id: string
  userId: string
  drinkId: string
  status: OrderStatus
  coasterId: string | null
  createdAt: number
}

export interface GameState {
  type: GameType
  phase: number
  chosenCoasterId: string | null
  chosenUserId: string | null
}
