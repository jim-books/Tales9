const PLACEHOLDER_REEL = new URL('../../../Cocktail Menu Animation/StrawberryCheesecake.mp4', import.meta.url).href

const DRINK_MENU_MEDIA: Record<string, string> = {
  'irish-coffee': PLACEHOLDER_REEL,
  'mango-sticky-rice': new URL('../../../Cocktail Menu Animation/MangoStickyRice.mp4', import.meta.url).href,
  'peanut': PLACEHOLDER_REEL,
  'pistachio': PLACEHOLDER_REEL,
  'salted-cc': PLACEHOLDER_REEL,
  'tangyuan': PLACEHOLDER_REEL,
}

export function getDrinkMenuMedia(drinkId: string): string | null {
  return DRINK_MENU_MEDIA[drinkId] ?? null
}
