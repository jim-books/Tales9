// ─── Core domain types ────────────────────────────────────────────────────────

export type AnimationFamily = 'energetic' | 'elegant' | 'tropical' | 'bold'
export type DrinkCategory = 'CLASSICS' | 'COFFEE_BASED' | 'DESSERT_INSPIRED'
export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'arrived'
export type GameType = 'truth_or_dare' | 'kings_game'
export type UserColor = 'blue' | 'green' | 'orange' | 'purple'

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
  detected: boolean
}

export interface UserNode {
  id: string
  /** Predefined owner index 0–3 */
  ownerIndex: number
  color: UserColor
  position: Point
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

// ─── WebSocket message shapes ─────────────────────────────────────────────────

export type WsMessage =
  | { type: 'SESSION_START'; payload: { userCount: number } }
  | { type: 'SESSION_END'; payload: Record<string, never> }
  | { type: 'ORDER_UPDATE'; payload: { orderId: string; status: OrderStatus } }
  | { type: 'COASTER_ASSIGN'; payload: { coasterId: string; drinkId: string } }
