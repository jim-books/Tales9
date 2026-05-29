import { describe, expect, it } from 'vitest'
import { drinkCatalog } from '../data/drinkCatalog'
import { hasDrinkMenuMedia, loadDrinkMenuMedia } from '../data/drinkMenuMedia'

describe('drinkMenuMedia mapping', () => {
  it('lazy-loads a menu animation url for every catalog drink', async () => {
    for (const drink of drinkCatalog) {
      expect(hasDrinkMenuMedia(drink.id), `missing menu animation for ${drink.id}`).toBe(true)
      const media = await loadDrinkMenuMedia(drink.id)
      expect(media, `failed to load menu animation for ${drink.id}`).toBeTruthy()
      expect(media).toContain('.mp4')
    }
  })
})
