import { describe, it, expect } from 'vitest'
import { getSortedKey, findNearbyPairs } from '../engine/CoasterPairing'
import { drinkPairSynergies } from '../data/drinkPairSynergies'
import type { Coaster, CoasterTouchSignature } from '../types'

describe('CoasterPairing and Synergy Config', () => {
  describe('getSortedKey', () => {
    it('sorts and joins keys alphabetically', () => {
      expect(getSortedKey('apple-tart', 'irish-coffee')).toBe('apple-tart:irish-coffee')
      expect(getSortedKey('irish-coffee', 'apple-tart')).toBe('apple-tart:irish-coffee')
    })
  })

  describe('drinkPairSynergies config verification', () => {
    it('contains exactly 21 unique combinations of the 7 drinks', () => {
      const drinks = [
        'apple-tart',
        'irish-coffee',
        'mango-sticky-rice',
        'peanut',
        'pistachio',
        'strawberry-cheesecake',
        'tangyuan',
      ]

      const generatedKeys: string[] = []
      for (let i = 0; i < drinks.length; i++) {
        for (let j = i + 1; j < drinks.length; j++) {
          generatedKeys.push(getSortedKey(drinks[i], drinks[j]))
        }
      }

      expect(generatedKeys).toHaveLength(21)

      // Ensure every generated pair key exists in our synergies definition map
      generatedKeys.forEach((key) => {
        expect(drinkPairSynergies[key], `Missing synergy definition for key: ${key}`).toBeDefined()
        expect(drinkPairSynergies[key].pairKey).toBe(key)
      })
    })
  })

  describe('findNearbyPairs', () => {
    const dummySignature = [{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.05, y: 0.1 }] as unknown as CoasterTouchSignature

    it('returns empty array when there are fewer than 2 active coasters', () => {
      const coasters: Coaster[] = [
        {
          id: 'c1',
          signature: dummySignature,
          centroid: { x: 100, y: 100 },
          drinkId: 'apple-tart',
          detectionState: 'confirmed',
          detected: true,
        },
      ]
      expect(findNearbyPairs(coasters, 200)).toEqual([])
    })

    it('ignores non-confirmed coasters or coasters with no drinkId assigned', () => {
      const coasters: Coaster[] = [
        {
          id: 'c1',
          signature: dummySignature,
          centroid: { x: 100, y: 100 },
          drinkId: 'apple-tart',
          detectionState: 'confirmed',
          detected: true,
        },
        {
          id: 'c2',
          signature: dummySignature,
          centroid: { x: 120, y: 120 },
          drinkId: 'pistachio',
          detectionState: 'preview', // not confirmed
          detected: false,
        },
        {
          id: 'c3',
          signature: dummySignature,
          centroid: { x: 130, y: 130 },
          drinkId: null, // no drink
          detectionState: 'confirmed',
          detected: true,
        },
      ]
      expect(findNearbyPairs(coasters, 200)).toEqual([])
    })

    it('detects confirmed coasters within threshold distance and computes midpoint/distance', () => {
      const coasters: Coaster[] = [
        {
          id: 'c2', // c2 is second alphabetically but will be sorted with c1
          signature: dummySignature,
          centroid: { x: 100, y: 100 },
          drinkId: 'irish-coffee',
          detectionState: 'confirmed',
          detected: true,
        },
        {
          id: 'c1',
          signature: dummySignature,
          centroid: { x: 100, y: 200 }, // distance is exactly 100px
          drinkId: 'apple-tart',
          detectionState: 'confirmed',
          detected: true,
        },
      ]

      const pairs = findNearbyPairs(coasters, 150)
      expect(pairs).toHaveLength(1)
      const pair = pairs[0]

      // Coaster keys should be sorted alphabetically: c1 then c2
      expect(pair.key).toBe('c1:c2')
      expect(pair.coasterA.id).toBe('c1')
      expect(pair.coasterB.id).toBe('c2')
      expect(pair.distance).toBe(100)
      expect(pair.midpoint).toEqual({ x: 100, y: 150 })
      
      // Drink key should be sorted alphabetically: apple-tart then irish-coffee
      expect(pair.drinkPairKey).toBe('apple-tart:irish-coffee')
    })

    it('ignores coasters that exceed threshold distance', () => {
      const coasters: Coaster[] = [
        {
          id: 'c1',
          signature: dummySignature,
          centroid: { x: 100, y: 100 },
          drinkId: 'apple-tart',
          detectionState: 'confirmed',
          detected: true,
        },
        {
          id: 'c2',
          signature: dummySignature,
          centroid: { x: 100, y: 300 }, // distance is 200px
          drinkId: 'irish-coffee',
          detectionState: 'confirmed',
          detected: true,
        },
      ]

      // Threshold 150 < 200, so they should not pair up
      expect(findNearbyPairs(coasters, 150)).toEqual([])
      // Threshold 250 > 200, so they should pair up
      expect(findNearbyPairs(coasters, 250)).toHaveLength(1)
    })
  })
})
