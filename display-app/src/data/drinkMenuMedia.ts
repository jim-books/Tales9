const APPLE_TART_REEL = '/menu-videos/AppleTart.mp4'
const SPICED_IRISH_COFFEE_REEL = '/menu-videos/SpicedIrishCoffee.mp4'
const MANGO_STICKY_RICE_REEL = '/menu-videos/MangoStickyRice.mp4'
const PEANUT_REEL = '/menu-videos/PeanutButterWhikeySour.mp4'
const PISTACHIO_REEL = '/menu-videos/PistachioGelato.mp4'
const TOASTED_LONGAN_DAIQUIRI_REEL = '/menu-videos/ToastedLonganDaiquiri.mp4'
const STRAWBERRY_CHEESECAKE_REEL = '/menu-videos/StrawberryCheesecake.mp4'

const DRINK_MENU_MEDIA_URLS: Record<string, string> = {
  'apple-tart': APPLE_TART_REEL,
  'irish-coffee': SPICED_IRISH_COFFEE_REEL,
  'mango-sticky-rice': MANGO_STICKY_RICE_REEL,
  'peanut': PEANUT_REEL,
  'pistachio': PISTACHIO_REEL,
  'strawberry-cheesecake': STRAWBERRY_CHEESECAKE_REEL,
  tangyuan: TOASTED_LONGAN_DAIQUIRI_REEL,
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
