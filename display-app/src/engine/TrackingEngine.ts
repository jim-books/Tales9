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
const CLUSTER_RADIUS = 0.14 // normalised units (tuned from multi-sample debug captures)

/** How long (ms) a coaster must be absent before it's considered removed */
export const REMOVAL_DEBOUNCE_MS = 2_000
const CLUSTER_DISTANCE_LIMIT = CLUSTER_RADIUS * 1.1
const MIN_CLUSTER_AREA = 0.00001
const JITTER_THRESHOLD_NORM = 0.025
const VARIANCE_RESET_DISTANCE_NORM = 0.06
const VARIANCE_RESET_GAP_MS = 350
const NORMALIZED_CANVAS = 1900

export type TrackedCoasterState = 'preview' | 'confirmed' | 'lost'

export interface TrackedCoaster {
  id: string
  templateId: string
  signature: CoasterTouchSignature
  centroid: Point   // display-space px
  ratio: [number, number, number]
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
  indices: [number, number, number]
  cluster: CoasterTouchSignature
  centroid: Point
  ratio: [number, number, number]
  maxSide: number
  area: number
  matches: ClusterTypeMatch[]
  bestTemplate: CoasterTemplate | null
  bestDelta: number | null
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
  private templateCentroidHistory = new Map<string, Point[]>()
  private templateCentroidHistoryAt = new Map<string, number>()
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

    const evaluations = clusters.map((candidate) => this.evaluateCluster(candidate, templates))
    const selected = this.selectNonOverlappingCandidates(evaluations)
    const acceptedEvaluations: ClusterEvaluation[] = []

    for (const entry of selected) {
      if (!entry.bestTemplate) {
        events.push({ type: 'rejected', centroid: entry.centroid })
        continue
      }
      if (!this.passesVarianceGate(entry.bestTemplate.id, entry.centroid, now)) {
        events.push({ type: 'rejected', centroid: entry.centroid })
        continue
      }
      acceptedEvaluations.push(entry)
    }

    const detectionsByTemplate = this.dedupeByTemplateId(acceptedEvaluations)

    for (const entry of detectionsByTemplate) {
      if (!entry.bestTemplate) continue
      const coasterId = entry.bestTemplate.id
      const existing = this.tracked.get(coasterId)

      if (existing) {
        existing.signature = entry.cluster
        existing.centroid = entry.centroid
        existing.ratio = entry.ratio
        existing.templateId = entry.bestTemplate.id
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
        } else if (existing.state === 'lost') {
          // Require a fresh confirm window after a dropout to avoid noise
          // instantly resurrecting a coaster and canceling the fade-out.
          existing.state = 'preview'
          existing.seenFrames = 1
          events.push({
            type: 'updated',
            coasterId: existing.id,
            centroid: existing.centroid,
            templateId: existing.templateId,
            state: existing.state,
          })
        } else {
          existing.state = 'confirmed'
          events.push({
            type: 'updated',
            coasterId: existing.id,
            centroid: existing.centroid,
            templateId: existing.templateId,
            state: existing.state,
          })
        }
      } else {
        this.tracked.set(coasterId, {
          id: coasterId,
          templateId: entry.bestTemplate.id,
          signature: entry.cluster,
          centroid: entry.centroid,
          ratio: entry.ratio,
          lastSeenAt: now,
          active: true,
          state: 'preview',
          seenFrames: 1,
        })
        events.push({
          type: 'preview_started',
          coasterId,
          centroid: entry.centroid,
          templateId: entry.bestTemplate.id,
        })
      }
    }

    for (const [id, coaster] of this.tracked.entries()) {
      if (coaster.active) continue
      const missingForMs = now - coaster.lastSeenAt
      if (missingForMs > REMOVAL_DEBOUNCE_MS) {
        this.tracked.delete(id)
        events.push({ type: 'removed', coasterId: id, templateId: coaster.templateId })
        continue
      }

      if (coaster.state !== 'lost') {
        coaster.state = 'lost'
        coaster.seenFrames = 0
      }
      events.push({
        type: 'updated',
        coasterId: coaster.id,
        centroid: coaster.centroid,
        templateId: coaster.templateId,
        state: coaster.state,
      })
    }

    this.lastDiagnosis = {
      rawTouchPoints: rawPoints,
      clusters: selected.map((entry) => ({
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
    cluster: { points: CoasterTouchSignature; indices: [number, number, number] },
    templates: CoasterTemplate[],
  ): ClusterEvaluation {
    const metrics = signatureMetrics(cluster.points)
    const centroid = this.mapper.centroidOf(cluster.points)

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
    const bestDelta = matches.find((m) => m.qualifies)?.delta ?? null

    return {
      indices: cluster.indices,
      cluster: cluster.points,
      centroid,
      ratio: metrics.ratio,
      maxSide: metrics.maxSide,
      area: metrics.area,
      matches,
      bestTemplate,
      bestDelta,
    }
  }

  private clusterPoints(points: Point[]): Array<{ points: CoasterTouchSignature; indices: [number, number, number] }> {
    const clusters: Array<{ points: CoasterTouchSignature; indices: [number, number, number] }> = []
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 1; j < points.length - 1; j++) {
        for (let k = j + 1; k < points.length; k++) {
          const p1 = points[i]
          const p2 = points[j]
          const p3 = points[k]
          const d12 = CalibrationMapper.distance(p1, p2)
          const d23 = CalibrationMapper.distance(p2, p3)
          const d31 = CalibrationMapper.distance(p3, p1)
          const maxDistance = Math.max(d12, d23, d31)
          if (maxDistance > CLUSTER_DISTANCE_LIMIT) continue
          const area = Math.abs(
            p1.x * (p2.y - p3.y) +
              p2.x * (p3.y - p1.y) +
              p3.x * (p1.y - p2.y),
          ) / 2
          if (area <= MIN_CLUSTER_AREA) continue
          clusters.push({
            indices: [i, j, k],
            points: [p1, p2, p3],
          })
        }
      }
    }
    return clusters
  }

  private selectNonOverlappingCandidates(evaluations: ClusterEvaluation[]): ClusterEvaluation[] {
    const scored = evaluations
      .map((entry) => ({
        entry,
        score:
          entry.bestTemplate && entry.bestDelta !== null
            ? 100 - entry.bestDelta * 1000 + entry.area * 100
            : -(entry.matches[0]?.delta ?? 999),
      }))
      .sort((a, b) => b.score - a.score)

    const selected: ClusterEvaluation[] = []
    const usedPoints = new Set<number>()

    for (const { entry } of scored) {
      if (entry.indices.some((idx) => usedPoints.has(idx))) continue
      selected.push(entry)
      entry.indices.forEach((idx) => usedPoints.add(idx))
      if (selected.length >= 4) break
    }

    return selected
  }

  private passesVarianceGate(templateId: string, centroid: Point, now: number): boolean {
    const history = this.templateCentroidHistory.get(templateId) ?? []
    const lastAt = this.templateCentroidHistoryAt.get(templateId) ?? null
    const gapMs = lastAt === null ? null : now - lastAt
    const last = history.length > 0 ? history[history.length - 1] : null
    const jumpNorm = last ? CalibrationMapper.distance(last, centroid) / NORMALIZED_CANVAS : null

    const shouldReset =
      history.length === 0 ||
      (gapMs !== null && gapMs > VARIANCE_RESET_GAP_MS) ||
      (jumpNorm !== null && jumpNorm > VARIANCE_RESET_DISTANCE_NORM)

    const baseHistory = shouldReset ? [] : history
    const nextHistory = [...baseHistory, centroid].slice(-3)
    this.templateCentroidHistory.set(templateId, nextHistory)
    this.templateCentroidHistoryAt.set(templateId, now)

    if (nextHistory.length < 3) return true
    const mean = nextHistory.reduce(
      (acc, p) => ({ x: acc.x + p.x / nextHistory.length, y: acc.y + p.y / nextHistory.length }),
      { x: 0, y: 0 },
    )
    const maxJitterNorm = nextHistory.reduce((maxJitter, p) => {
      const jitter = CalibrationMapper.distance(p, mean) / NORMALIZED_CANVAS
      return Math.max(maxJitter, jitter)
    }, 0)
    return maxJitterNorm <= JITTER_THRESHOLD_NORM
  }

  /** At most one detection per template id per frame (best delta wins). */
  private dedupeByTemplateId(detections: ClusterEvaluation[]): ClusterEvaluation[] {
    const bestByTemplate = new Map<string, ClusterEvaluation>()
    for (const entry of detections) {
      if (!entry.bestTemplate || entry.bestDelta === null) continue
      const templateId = entry.bestTemplate.id
      const existing = bestByTemplate.get(templateId)
      if (!existing || entry.bestDelta < (existing.bestDelta ?? Number.POSITIVE_INFINITY)) {
        bestByTemplate.set(templateId, entry)
      }
    }
    return Array.from(bestByTemplate.values())
  }
}
