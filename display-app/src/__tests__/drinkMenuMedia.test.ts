import { describe, expect, it } from 'vitest'
import { drinkCatalog } from '../data/drinkCatalog'
import { getDrinkMenuMedia } from '../data/drinkMenuMedia'

describe('drinkMenuMedia mapping', () => {
  it('resolves a menu animation url for every catalog drink', () => {
    for (const drink of drinkCatalog) {
      const media = getDrinkMenuMedia(drink.id)
      expect(media, `missing menu animation for ${drink.id}`).toBeTruthy()
      expect(media).toContain('.mp4')
    }
  })
})

