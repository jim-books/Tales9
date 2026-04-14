const DRINK_MENU_MEDIA: Record<string, string> = {
  'apple-tart': new URL('../../../Cocktail Menu Animation/AppleTart.mp4', import.meta.url).href,
  'espresso-martini': new URL('../../../Cocktail Menu Animation/BarcodeChocoMartini.mp4', import.meta.url).href,
  'momo-sour': new URL('../../../Cocktail Menu Animation/MomoSour.mp4', import.meta.url).href,
  // Asset filename uses legacy "Piso" spelling; keep explicit mapping to avoid silent mismatch.
  'pisco-colada': new URL('../../../Cocktail Menu Animation/PisoColada.mp4', import.meta.url).href,
}

export function getDrinkMenuMedia(drinkId: string): string | null {
  return DRINK_MENU_MEDIA[drinkId] ?? null
}

