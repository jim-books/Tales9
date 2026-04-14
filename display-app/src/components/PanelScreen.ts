/** Navigation state local to each UserNode panel */
export type PanelScreen =
  | { view: 'home' }
  | { view: 'about' }
  | { view: 'game' }
  | { view: 'menu' }
  | { view: 'detail'; drinkId: string }
  | { view: 'quiz' }
  | { view: 'orders' }
