import { describe, it, expect } from 'vitest'
import { drinkCatalog, getDrinkById, recommendDrink } from '../data/drinkCatalog'

describe('drinkCatalog', () => {
  it('contains at least one drink per category', () => {
    const categories = new Set(drinkCatalog.map((d) => d.category))
    expect(categories.has('CLASSICS')).toBe(true)
    expect(categories.has('COFFEE_BASED')).toBe(true)
    expect(categories.has('DESSERT_INSPIRED')).toBe(true)
  })

  it('every drink has a non-empty colorPalette of length 3', () => {
    for (const drink of drinkCatalog) {
      expect(drink.colorPalette).toHaveLength(3)
      expect(drink.colorPalette.every(Boolean)).toBe(true)
    }
  })

  it('getDrinkById returns correct drink', () => {
    const drink = getDrinkById('pisco-colada')
    expect(drink?.name).toBe('PISCO-COLADA')
  })

  it('getDrinkById returns undefined for unknown id', () => {
    expect(getDrinkById('does-not-exist')).toBeUndefined()
  })
})

describe('recommendDrink', () => {
  it('returns a valid drink id', () => {
    const id = recommendDrink({ mood: 'tropical', flavor: 'tropical', spirit: 'tropical', sweetness: 'tropical' })
    expect(getDrinkById(id)).toBeDefined()
  })

  it('recommends a tropical drink when all answers are tropical', () => {
    const id = recommendDrink({ mood: 'tropical', flavor: 'tropical', spirit: 'tropical', sweetness: 'tropical' })
    const drink = getDrinkById(id)
    expect(drink?.animationFamily).toBe('tropical')
  })

  it('returns a fallback for empty answers', () => {
    const id = recommendDrink({})
    expect(getDrinkById(id)).toBeDefined()
  })
})
