const APPLE_TART_REEL = new URL('../../../Cocktail Menu Animation Optimized/AppleTart.mp4', import.meta.url).href
const SPICED_IRISH_COFFEE_REEL = new URL(
  '../../../Cocktail Menu Animation Optimized/SpicedIrishCoffee.mp4',
  import.meta.url,
).href
const MANGO_STICKY_RICE_REEL = new URL(
  '../../../Cocktail Menu Animation Optimized/MangoStickyRice.mp4',
  import.meta.url,
).href
const PEANUT_REEL = new URL(
  '../../../Cocktail Menu Animation Optimized/PeanutButterWhikeySour.mp4',
  import.meta.url,
).href
const PISTACHIO_REEL = new URL(
  '../../../Cocktail Menu Animation Optimized/PistachioGelato.mp4',
  import.meta.url,
).href
const STRAWBERRY_CHEESECAKE_REEL = new URL(
  '../../../Cocktail Menu Animation Optimized/StrawberryCheesecake.mp4',
  import.meta.url,
).href

const DRINK_MENU_MEDIA_URLS: Record<string, string> = {
  'apple-tart': APPLE_TART_REEL,
  'irish-coffee': SPICED_IRISH_COFFEE_REEL,
  'mango-sticky-rice': MANGO_STICKY_RICE_REEL,
  'peanut': PEANUT_REEL,
  'pistachio': PISTACHIO_REEL,
  'strawberry-cheesecake': STRAWBERRY_CHEESECAKE_REEL,
  // Placeholder until a dedicated Tangyuan clip ships.
  tangyuan: STRAWBERRY_CHEESECAKE_REEL,
}

const mediaUrlCache = new Map<string, string>()
const mediaLoadPromises = new Map<string, Promise<string | null>>()

export function hasDrinkMenuMedia(drinkId: string): boolean {
  return drinkId in DRINK_MENU_MEDIA_URLS
}

export async function loadDrinkMenuMedia(drinkId: string): Promise<string | null> {
  const cached = mediaUrlCache.get(drinkId)
  if (cached) return cached

  const mediaUrl = DRINK_MENU_MEDIA_URLS[drinkId]
  if (!mediaUrl) return null

  const pending = mediaLoadPromises.get(drinkId)
  if (pending) return pending

  const promise = Promise.resolve(mediaUrl)
    .then((url) => {
      mediaUrlCache.set(drinkId, url)
      return url
    })
    .finally(() => {
      mediaLoadPromises.delete(drinkId)
    })

  mediaLoadPromises.set(drinkId, promise)
  return promise
}
