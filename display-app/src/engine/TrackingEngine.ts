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
const CLUSTER_RADIUS = 0.15 // normalised units

/** Tolerance for geometric signature matching (ratio comparison) */
const SIGNATURE_TOLERANCE = 0.12
/** Tighter tolerance for mapping to known physical coaster IDs */
const KNOWN_SIGNATURE_TOLERANCE = 0.06

/** How long (ms) a coaster must be absent before it's considered removed */
export const REMOVAL_DEBOUNCE_MS = 12_000

export interface TrackedCoaster {
  id: string
  signature: CoasterTouchSignature
  centroid: Point   // display-space px
  lastSeenAt: number
  active: boolean
}

export interface ClusterTypeMatch {
  typeId: string
  ratio: [number, number, number]
  delta: number
  qualifies: boolean
  active: boolean
}

export interface ClusterDiagnosis {
  points: CoasterTouchSignature
  centroid: Point
  ratio: [number, number, number]
  closestTypes: ClusterTypeMatch[]
  qualifiesAnyType: boolean
}

export interface FrameDiagnosis {
  rawTouchPoints: Point[]
  clusters: ClusterDiagnosis[]
}

interface KnownCoasterSignature {
  id: string
  ratio: [number, number, number]
}

/**
 * Calibrated signatures for known physical coasters.
 * These ratios come from verified debug captures and let us bind
 * geometric fingerprints to stable external IDs used by assignment events.
 */
const KNOWN_COASTER_SIGNATURES: KnownCoasterSignature[] = [
  { id: 'coaster-1', ratio: [0.978, 0.979, 1.0] },
  { id: 'coaster-4', ratio: [0.752, 0.999, 1.0] },
]

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

function signatureDelta(
  s1: [number, number, number],
  s2: [number, number, number],
): number {
  return Math.max(...s1.map((v, i) => Math.abs(v - s2[i])))
}

export class TrackingEngine {
  private tracked = new Map<string, TrackedCoaster>()
  private mapper: CalibrationMapper
  private nextId = 1
  private lastDiagnosis: FrameDiagnosis = {
    rawTouchPoints: [],
    clusters: [],
  }

  constructor(mapper: CalibrationMapper) {
    this.mapper = mapper
  }

  /**
   * Feed a new frame of raw touch points into the engine.
   * Returns the current set of active coasters.
   */
  processFrame(rawPoints: Point[], now: number = Date.now()): TrackedCoaster[] {
    const clusters = this.clusterPoints(rawPoints)
    const matchedThisFrame = new Set<string>()

    // Mark all known as potentially absent
    for (const coaster of this.tracked.values()) {
      coaster.active = false
    }

    for (const cluster of clusters) {
      const sig = geometricSignature(cluster)
      const existing = this.findMatch(sig, matchedThisFrame)

      if (existing) {
        existing.signature = cluster
        existing.centroid = this.mapper.centroidOf(cluster)
        existing.lastSeenAt = now
        existing.active = true
        matchedThisFrame.add(existing.id)
      } else {
        const known = this.findKnownCoaster(sig)
        const id = known?.id ?? this.allocateDynamicId()
        const tracked = this.tracked.get(id)

        if (tracked) {
          tracked.signature = cluster
          tracked.centroid = this.mapper.centroidOf(cluster)
          tracked.lastSeenAt = now
          tracked.active = true
        } else {
          this.tracked.set(id, {
            id,
            signature: cluster,
            centroid: this.mapper.centroidOf(cluster),
            lastSeenAt: now,
            active: true,
          })
        }
        matchedThisFrame.add(id)
      }
    }

    // Expire coasters absent for longer than debounce window
    for (const [id, coaster] of this.tracked.entries()) {
      if (!coaster.active && now - coaster.lastSeenAt > REMOVAL_DEBOUNCE_MS) {
        this.tracked.delete(id)
      }
    }

    this.lastDiagnosis = {
      rawTouchPoints: rawPoints,
      clusters: clusters.map((cluster) => {
        const ratio = geometricSignature(cluster)
        const closestTypes = this.getClosestTypes(ratio)
        return {
          points: cluster,
          centroid: this.mapper.centroidOf(cluster),
          ratio,
          closestTypes,
          qualifiesAnyType: closestTypes.some((t) => t.qualifies),
        }
      }),
    }

    return Array.from(this.tracked.values())
  }

  getActiveCoasters(): TrackedCoaster[] {
    return Array.from(this.tracked.values()).filter((c) => c.active)
  }

  getLastDiagnosis(): FrameDiagnosis {
    return this.lastDiagnosis
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

  private findMatch(
    sig: [number, number, number],
    matchedThisFrame: Set<string>,
  ): TrackedCoaster | undefined {
    let best: { coaster: TrackedCoaster; delta: number } | undefined

    for (const coaster of this.tracked.values()) {
      if (matchedThisFrame.has(coaster.id)) {
        continue
      }

      const delta = signatureDelta(sig, geometricSignature(coaster.signature))
      if (delta < SIGNATURE_TOLERANCE && (!best || delta < best.delta)) {
        best = { coaster, delta }
      }
    }

    return best?.coaster
  }

  private findKnownCoaster(sig: [number, number, number]): KnownCoasterSignature | undefined {
    let best: { known: KnownCoasterSignature; delta: number } | undefined

    for (const known of KNOWN_COASTER_SIGNATURES) {
      const delta = signatureDelta(sig, known.ratio)
      if (!best || delta < best.delta) {
        best = { known, delta }
      }
    }

    if (best && best.delta < KNOWN_SIGNATURE_TOLERANCE) {
      return best.known
    }

    return undefined
  }

  private allocateDynamicId(): string {
    const reserved = new Set(KNOWN_COASTER_SIGNATURES.map((k) => k.id))
    let id = `coaster-${this.nextId++}`
    while (this.tracked.has(id) || reserved.has(id)) {
      id = `coaster-${this.nextId++}`
    }
    return id
  }

  private getClosestTypes(sig: [number, number, number], limit = 3): ClusterTypeMatch[] {
    return Array.from(this.tracked.values())
      .map((coaster) => {
        const typeRatio = geometricSignature(coaster.signature)
        return {
          typeId: coaster.id,
          ratio: typeRatio,
          delta: signatureDelta(sig, typeRatio),
          qualifies: signaturesMatch(sig, typeRatio),
          active: coaster.active,
        }
      })
      .sort((a, b) => a.delta - b.delta)
      .slice(0, limit)
  }
}
