import type { Coaster, Point } from '../types'
import { CalibrationMapper } from './CalibrationMapper'

export interface CoasterPair {
  key: string // "idA:idB" sorted alphabetically (by coaster ID) to keep identity unique
  coasterA: Coaster
  coasterB: Coaster
  distance: number
  midpoint: Point
  drinkPairKey: string // "drinkIdA:drinkIdB" sorted alphabetically (by drink ID) for synergy lookup
}

/**
 * Normalizes two IDs into a single sorted pair key joined by a colon.
 */
export function getSortedKey(idA: string, idB: string): string {
  return [idA, idB].sort().join(':')
}

/**
 * Scan active confirmed coasters and return all pairs that are closer than the threshold.
 * Pair keys are normalized (by coaster ID) so each pair is represented exactly once.
 */
export function findNearbyPairs(coasters: Coaster[], threshold: number): CoasterPair[] {
  const activeCoasters = coasters.filter(
    (c) => c.detectionState === 'confirmed' && c.drinkId !== null
  )

  const pairs: CoasterPair[] = []

  for (let i = 0; i < activeCoasters.length; i++) {
    for (let j = i + 1; j < activeCoasters.length; j++) {
      const a = activeCoasters[i]
      const b = activeCoasters[j]
      
      const distance = CalibrationMapper.distance(a.centroid, b.centroid)
      if (distance < threshold) {
        // Coaster IDs sorted for the pair container's unique identity key
        const key = getSortedKey(a.id, b.id)
        
        // Drink IDs sorted for lookups in drinkPairSynergies map
        const drinkPairKey = getSortedKey(a.drinkId!, b.drinkId!)

        // Ensure coasterA is always the alphabetically first to keep assignments stable
        const isASmaller = a.id < b.id
        const coasterA = isASmaller ? a : b
        const coasterB = isASmaller ? b : a

        pairs.push({
          key,
          coasterA,
          coasterB,
          distance,
          midpoint: {
            x: (a.centroid.x + b.centroid.x) / 2,
            y: (a.centroid.y + b.centroid.y) / 2,
          },
          drinkPairKey,
        })
      }
    }
  }

  return pairs
}
