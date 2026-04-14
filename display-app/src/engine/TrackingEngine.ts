import type { Point, CoasterTouchSignature } from '../types'
import { CalibrationMapper } from './CalibrationMapper'
import {
  COASTER_CONFIRM_FRAMES,
  getCoasterTemplates,
  signatureMetrics,
  type CoasterTemplate,
} from './CoasterTemplates'

/**
 * TrackingEngine
 *
 * Groups raw touch points into 3-point coaster candidates, scores candidates
 * against known coaster templates, and tracks preview/confirmed lifecycle.
 */

/** Maximum distance (in raw input units) for three points to be grouped as one coaster */
const CLUSTER_RADIUS = 0.13 // normalised units (tuned from multi-sample debug captures)

/** How long (ms) a coaster must be absent before it's considered removed */
export const REMOVAL_DEBOUNCE_MS = 12_000

export type TrackedCoasterState = 'preview' | 'confirmed'

export interface TrackedCoaster {
  id: string
  templateId: string
  signature: CoasterTouchSignature
  centroid: Point   // display-space px
  lastSeenAt: number
  active: boolean
  state: TrackedCoasterState
  seenFrames: number
}

export interface ClusterTypeMatch {
  typeId: string
  ratio: [number, number, number]
  delta: number
  qualifies: boolean
}

export interface ClusterDiagnosis {
  points: CoasterTouchSignature
  centroid: Point
  ratio: [number, number, number]
  maxSide: number
  area: number
  closestTypes: ClusterTypeMatch[]
  qualifiesAnyType: boolean
  selectedTypeId: string | null
}

export interface FrameDiagnosis {
  rawTouchPoints: Point[]
  clusters: ClusterDiagnosis[]
}

export type TrackingEvent =
  | { type: 'preview_started'; coasterId: string; centroid: Point; templateId: string }
  | { type: 'confirmed'; coasterId: string; centroid: Point; templateId: string }
  | { type: 'updated'; coasterId: string; centroid: Point; templateId: string; state: TrackedCoasterState }
  | { type: 'removed'; coasterId: string; templateId: string }
  | { type: 'rejected'; centroid: Point }

export interface TrackingFrameResult {
  coasters: TrackedCoaster[]
  events: TrackingEvent[]
}

interface ClusterEvaluation {
  cluster: CoasterTouchSignature
  centroid: Point
  ratio: [number, number, number]
  maxSide: number
  area: number
  matches: ClusterTypeMatch[]
  bestTemplate: CoasterTemplate | null
}

function valueInRange(value: number, [min, max]: [number, number]): boolean {
  return value >= min && value <= max
}

function ratioDelta(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.max(...a.map((v, i) => Math.abs(v - b[i])))
}

export class TrackingEngine {
  private tracked = new Map<string, TrackedCoaster>()
  private mapper: CalibrationMapper
  private lastDiagnosis: FrameDiagnosis = {
    rawTouchPoints: [],
    clusters: [],
  }

  constructor(mapper: CalibrationMapper) {
    this.mapper = mapper
  }

  /**
   * Feed a new frame of raw touch points into the engine.
   * Returns tracked coaster state + frame transition events.
   */
  processFrame(rawPoints: Point[], now: number = Date.now()): TrackingFrameResult {
    const clusters = this.clusterPoints(rawPoints)
    const events: TrackingEvent[] = []
    const templates = getCoasterTemplates()

    for (const coaster of this.tracked.values()) {
      coaster.active = false
    }

    const evaluations = clusters.map((cluster) => this.evaluateCluster(cluster, templates))
    const matchedTemplates = new Set<string>()

    for (const entry of evaluations) {
      const template = entry.bestTemplate
      if (!template) {
        events.push({ type: 'rejected', centroid: entry.centroid })
        continue
      }

      if (matchedTemplates.has(template.id)) {
        events.push({ type: 'rejected', centroid: entry.centroid })
        continue
      }
      matchedTemplates.add(template.id)

      const existing = this.tracked.get(template.id)
      if (!existing) {
        this.tracked.set(template.id, {
          id: template.id,
          templateId: template.id,
          signature: entry.cluster,
          centroid: entry.centroid,
          lastSeenAt: now,
          active: true,
          state: 'preview',
          seenFrames: 1,
        })
        events.push({
          type: 'preview_started',
          coasterId: template.id,
          centroid: entry.centroid,
          templateId: template.id,
        })
        continue
      }

      existing.signature = entry.cluster
      existing.centroid = entry.centroid
      existing.lastSeenAt = now
      existing.active = true

      if (existing.state === 'preview') {
        existing.seenFrames += 1
        if (existing.seenFrames >= COASTER_CONFIRM_FRAMES) {
          existing.state = 'confirmed'
          events.push({
            type: 'confirmed',
            coasterId: existing.id,
            centroid: existing.centroid,
            templateId: existing.templateId,
          })
        } else {
          events.push({
            type: 'updated',
            coasterId: existing.id,
            centroid: existing.centroid,
            templateId: existing.templateId,
            state: existing.state,
          })
        }
      } else {
        events.push({
          type: 'updated',
          coasterId: existing.id,
          centroid: existing.centroid,
          templateId: existing.templateId,
          state: existing.state,
        })
      }
    }

    for (const [id, coaster] of this.tracked.entries()) {
      if (!coaster.active && now - coaster.lastSeenAt > REMOVAL_DEBOUNCE_MS) {
        this.tracked.delete(id)
        events.push({ type: 'removed', coasterId: id, templateId: coaster.templateId })
      }
    }

    this.lastDiagnosis = {
      rawTouchPoints: rawPoints,
      clusters: evaluations.map((entry) => ({
        points: entry.cluster,
        centroid: entry.centroid,
        ratio: entry.ratio,
        maxSide: entry.maxSide,
        area: entry.area,
        closestTypes: entry.matches,
        qualifiesAnyType: entry.matches.some((m) => m.qualifies),
        selectedTypeId: entry.bestTemplate?.id ?? null,
      })),
    }

    return {
      coasters: Array.from(this.tracked.values()),
      events,
    }
  }

  getActiveCoasters(): TrackedCoaster[] {
    return Array.from(this.tracked.values()).filter((c) => c.active)
  }

  getLastDiagnosis(): FrameDiagnosis {
    return this.lastDiagnosis
  }

  private evaluateCluster(
    cluster: CoasterTouchSignature,
    templates: CoasterTemplate[],
  ): ClusterEvaluation {
    const metrics = signatureMetrics(cluster)
    const centroid = this.mapper.centroidOf(cluster)

    const matches = templates
      .map((template) => {
        const delta = ratioDelta(metrics.ratio, template.ratio)
        const qualifies =
          delta <= template.ratioTolerance &&
          valueInRange(metrics.maxSide, template.maxSideRange) &&
          valueInRange(metrics.area, template.areaRange)
        return {
          typeId: template.id,
          ratio: template.ratio,
          delta,
          qualifies,
        }
      })
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 3)

    const bestTemplateId = matches.find((m) => m.qualifies)?.typeId ?? null
    const bestTemplate = templates.find((t) => t.id === bestTemplateId) ?? null

    return {
      cluster,
      centroid,
      ratio: metrics.ratio,
      maxSide: metrics.maxSide,
      area: metrics.area,
      matches,
      bestTemplate,
    }
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
}
