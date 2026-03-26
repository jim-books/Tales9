import type { Point, CoasterTouchSignature } from '../types'
import { CalibrationMapper } from './CalibrationMapper'

/**
 * TrackingEngine
 *
 * Groups raw touch points into coaster signatures (3-point clusters)
 * and tracks their identity, position, and enter/exit lifecycle.
 *
 * A coaster is identified by the ratio of distances between its three
 * contact points — this geometric signature is unique per coaster.
 */

/** Maximum distance (in raw input units) for three points to be grouped as one coaster */
const CLUSTER_RADIUS = 0.08 // normalised units

/** Tolerance for geometric signature matching (ratio comparison) */
const SIGNATURE_TOLERANCE = 0.12

/** How long (ms) a coaster must be absent before it's considered removed */
export const REMOVAL_DEBOUNCE_MS = 12_000

export interface TrackedCoaster {
  id: string
  signature: CoasterTouchSignature
  centroid: Point   // display-space px
  lastSeenAt: number
  active: boolean
}

/** Compute the three inter-point distance ratios that define a coaster's signature */
function geometricSignature(pts: CoasterTouchSignature): [number, number, number] {
  const [a, b, c] = pts
  const ab = CalibrationMapper.distance(a, b)
  const bc = CalibrationMapper.distance(b, c)
  const ca = CalibrationMapper.distance(c, a)
  const max = Math.max(ab, bc, ca)
  // Normalise so largest distance = 1
  return [ab / max, bc / max, ca / max].sort() as [number, number, number]
}

/** Returns true if two geometric signatures are within tolerance */
function signaturesMatch(
  s1: [number, number, number],
  s2: [number, number, number],
): boolean {
  return s1.every((v, i) => Math.abs(v - s2[i]) < SIGNATURE_TOLERANCE)
}

export class TrackingEngine {
  private tracked = new Map<string, TrackedCoaster>()
  private mapper: CalibrationMapper
  private nextId = 1

  constructor(mapper: CalibrationMapper) {
    this.mapper = mapper
  }

  /**
   * Feed a new frame of raw touch points into the engine.
   * Returns the current set of active coasters.
   */
  processFrame(rawPoints: Point[], now: number = Date.now()): TrackedCoaster[] {
    const clusters = this.clusterPoints(rawPoints)

    // Mark all known as potentially absent
    for (const coaster of this.tracked.values()) {
      coaster.active = false
    }

    for (const cluster of clusters) {
      const sig = geometricSignature(cluster)
      const existing = this.findMatch(sig)

      if (existing) {
        existing.signature = cluster
        existing.centroid = this.mapper.centroidOf(cluster)
        existing.lastSeenAt = now
        existing.active = true
      } else {
        const id = `coaster-${this.nextId++}`
        this.tracked.set(id, {
          id,
          signature: cluster,
          centroid: this.mapper.centroidOf(cluster),
          lastSeenAt: now,
          active: true,
        })
      }
    }

    // Expire coasters absent for longer than debounce window
    for (const [id, coaster] of this.tracked.entries()) {
      if (!coaster.active && now - coaster.lastSeenAt > REMOVAL_DEBOUNCE_MS) {
        this.tracked.delete(id)
      }
    }

    return Array.from(this.tracked.values())
  }

  getActiveCoasters(): TrackedCoaster[] {
    return Array.from(this.tracked.values()).filter((c) => c.active)
  }

  private clusterPoints(points: Point[]): CoasterTouchSignature[] {
    // Naive O(n³) grouping — fine for ≤12 simultaneous touch points
    const used = new Set<number>()
    const clusters: CoasterTouchSignature[] = []

    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue
      const group = [i]

      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue
        if (CalibrationMapper.distance(points[i], points[j]) < CLUSTER_RADIUS) {
          group.push(j)
        }
      }

      if (group.length >= 3) {
        const [a, b, c] = group.slice(0, 3)
        clusters.push([points[a], points[b], points[c]])
        group.slice(0, 3).forEach((idx) => used.add(idx))
      }
    }

    return clusters
  }

  private findMatch(sig: [number, number, number]): TrackedCoaster | undefined {
    for (const coaster of this.tracked.values()) {
      if (signaturesMatch(sig, geometricSignature(coaster.signature))) {
        return coaster
      }
    }
    return undefined
  }
}
