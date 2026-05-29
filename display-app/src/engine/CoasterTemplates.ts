import type { CoasterTouchSignature } from '../types'
import { CalibrationMapper } from './CalibrationMapper'

export interface CoasterTemplate {
  id: string
  ratio: [number, number, number]
  ratioTolerance: number
  maxSideRange: [number, number]
  areaRange: [number, number]
}

export interface SignatureMetrics {
  ratio: [number, number, number]
  maxSide: number
  area: number
}

export interface CoasterTemplateSpec {
  id: string
  sideLengthsMm: [number, number, number]
  ratioTolerance?: number
  maxSideScaleRange?: [number, number]
  areaScaleRange?: [number, number]
}

export interface DerivedTemplateSpec {
  sampleCount: number
  spec: CoasterTemplateSpec
}

export const COASTER_CONFIRM_FRAMES = 3
/**
 * Conversion factor from template side-length units to touch-space units.
 * Current defaults use debug-panel pixel distances, so this is 1 / 1900.
 * Reserved for future calibration/Firebase overrides.
 */
export let COASTER_MM_TO_TOUCH_UNITS = 1 / 1900

function triangleArea(points: CoasterTouchSignature): number {
  const [a, b, c] = points
  return Math.abs(
    a.x * (b.y - c.y) +
    b.x * (c.y - a.y) +
    c.x * (a.y - b.y),
  ) / 2
}

export function signatureMetrics(points: CoasterTouchSignature): SignatureMetrics {
  const [a, b, c] = points
  const ab = CalibrationMapper.distance(a, b)
  const bc = CalibrationMapper.distance(b, c)
  const ca = CalibrationMapper.distance(c, a)
  const maxSide = Math.max(ab, bc, ca)
  const ratio = [ab / maxSide, bc / maxSide, ca / maxSide].sort() as [number, number, number]

  return {
    ratio,
    maxSide,
    area: triangleArea(points),
  }
}

function sortedSides(points: CoasterTouchSignature): [number, number, number] {
  const [a, b, c] = points
  const ab = CalibrationMapper.distance(a, b)
  const bc = CalibrationMapper.distance(b, c)
  const ca = CalibrationMapper.distance(c, a)
  return [ab, bc, ca].sort((x, y) => x - y) as [number, number, number]
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 1) return sortedValues[0]
  const pos = (sortedValues.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sortedValues[Math.min(base + 1, sortedValues.length - 1)]
  return sortedValues[base] + rest * (next - sortedValues[base])
}

function iqrBounds(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  return [q1 - 1.5 * iqr, q3 + 1.5 * iqr]
}

function cleanSignatureSamples(signatures: CoasterTouchSignature[]): CoasterTouchSignature[] {
  if (signatures.length < 8) {
    return signatures
  }
  const metrics = signatures.map((signature) => signatureMetrics(signature))
  const [maxSideMin, maxSideMax] = iqrBounds(metrics.map((m) => m.maxSide))
  const [areaMin, areaMax] = iqrBounds(metrics.map((m) => m.area))
  const filtered = signatures.filter((_, idx) => {
    const row = metrics[idx]
    return (
      row.maxSide >= maxSideMin &&
      row.maxSide <= maxSideMax &&
      row.area >= areaMin &&
      row.area <= areaMax
    )
  })
  return filtered.length >= Math.max(5, Math.floor(signatures.length * 0.6))
    ? filtered
    : signatures
}

function maxAbsDeltaFromBase(
  rows: Array<[number, number, number]>,
  base: [number, number, number],
): number {
  return rows.reduce((maxDelta, row) => {
    const delta = Math.max(
      Math.abs(row[0] - base[0]),
      Math.abs(row[1] - base[1]),
      Math.abs(row[2] - base[2]),
    )
    return Math.max(maxDelta, delta)
  }, 0)
}

export function deriveTemplateSpecFromSignatures(
  id: string,
  signatures: CoasterTouchSignature[],
): DerivedTemplateSpec | null {
  if (signatures.length === 0) {
    return null
  }

  const cleanedSignatures = cleanSignatureSamples(signatures)
  const sides = cleanedSignatures.map((signature) => sortedSides(signature))
  const metricsRows = cleanedSignatures.map((signature) => signatureMetrics(signature))
  const medianSides: [number, number, number] = [
    median(sides.map((row) => row[0])),
    median(sides.map((row) => row[1])),
    median(sides.map((row) => row[2])),
  ]

  // Use the median-side triangle's expected ratio as baseline.
  const baseRatio = [medianSides[0] / medianSides[2], medianSides[1] / medianSides[2], 1]
    .sort((a, b) => a - b) as [number, number, number]

  const ratioRows = metricsRows.map((m) => m.ratio)
  const ratioTolerance = Math.max(0.02, maxAbsDeltaFromBase(ratioRows, baseRatio) + 0.01)

  const maxSides = metricsRows.map((m) => m.maxSide)
  const areas = metricsRows.map((m) => m.area)
  const prototypeMetrics = signatureMetrics([
    { x: 0, y: 0 },
    { x: medianSides[2], y: 0 },
    {
      x: (medianSides[0] ** 2 - medianSides[1] ** 2 + medianSides[2] ** 2) / (2 * medianSides[2]),
      y: Math.sqrt(
        Math.max(
          0,
          medianSides[0] ** 2 -
            ((medianSides[0] ** 2 - medianSides[1] ** 2 + medianSides[2] ** 2) / (2 * medianSides[2])) ** 2,
        ),
      ),
    },
  ] as CoasterTouchSignature)

  const maxSideScaleRange: [number, number] = [
    Math.min(...maxSides) / prototypeMetrics.maxSide,
    Math.max(...maxSides) / prototypeMetrics.maxSide,
  ]
  const areaScaleRange: [number, number] = [
    Math.min(...areas) / prototypeMetrics.area,
    Math.max(...areas) / prototypeMetrics.area,
  ]

  return {
    sampleCount: cleanedSignatures.length,
    spec: {
      id,
      sideLengthsMm: medianSides,
      ratioTolerance,
      maxSideScaleRange,
      areaScaleRange,
    },
  }
}

function templateFromPrototype(
  spec: CoasterTemplateSpec,
): CoasterTemplate {
  const [a, b, c] = [...spec.sideLengthsMm].sort((x, y) => x - y) as [number, number, number]
  if (a + b <= c) {
    throw new Error(`Invalid coaster triangle for ${spec.id}: ${a}, ${b}, ${c}`)
  }

  const aTouch = a * COASTER_MM_TO_TOUCH_UNITS
  const bTouch = b * COASTER_MM_TO_TOUCH_UNITS
  const cTouch = c * COASTER_MM_TO_TOUCH_UNITS
  const maxSide = cTouch
  const s = (aTouch + bTouch + cTouch) / 2
  const area = Math.sqrt(s * (s - aTouch) * (s - bTouch) * (s - cTouch))
  const ratio = [a / c, b / c, 1].sort() as [number, number, number]

  return {
    id: spec.id,
    ratio,
    ratioTolerance: spec.ratioTolerance ?? 0.08,
    maxSideRange: [
      maxSide * (spec.maxSideScaleRange?.[0] ?? 0.72),
      maxSide * (spec.maxSideScaleRange?.[1] ?? 1.38),
    ],
    areaRange: [
      area * (spec.areaScaleRange?.[0] ?? 0.55),
      area * (spec.areaScaleRange?.[1] ?? 1.8),
    ],
  }
}

/**
 * Local default template specs.
 * This variable is intentionally separate so future Firebase-loaded specs can
 * replace it at runtime without changing TrackingEngine call sites.
 */
export const DEFAULT_COASTER_TEMPLATE_SPECS: CoasterTemplateSpec[] = [
  // 85 mm hardware baseline — uncalibrated; fill via debug-panel capture per coaster.
  {
    id: 'coaster-1',
    // Derived from 21 runtime samples (touch-units scaled to template units).
    sideLengthsMm: [184.99999999999994, 267.860037, 272.209478],
    ratioTolerance: 0.0630470273996747,
    maxSideScaleRange: [0.9693959292801527, 1.0540854405381692],
    areaScaleRange: [0.9370624184622331, 1.088444204268666],
  },
  {
    id: 'coaster-2',
    // Derived from 26 runtime samples (touch-units scaled to template units).
    sideLengthsMm: [217.59, 224.16, 285.16],
    ratioTolerance: 0.060570909564405244,
    maxSideScaleRange: [0.9632963007342042, 1.0721499731181205],
    areaScaleRange: [0.9196148273927555, 1.1450999083009767],
  },
  {
    id: 'coaster-3',
    // Derived from 7 runtime samples (touch-units scaled to template units).
    // Note: user requested ignoring the 5th sample during collection.
    sideLengthsMm: [219.32, 255.16, 265.75],
    ratioTolerance: 0.06633297095300737,
    // Runtime tuning: widen scale ranges to match observed placement drift.
    maxSideScaleRange: [0.9831500754190383, 1.08],
    // Observed runtime areas reached ~1.17× prototype while still ratio-close.
    areaScaleRange: [0.96, 1.22],
  },
  {
    id: 'coaster-4',
    // Derived from 9 runtime samples (touch-units scaled to template units).
    // Note: user requested ignoring sample 7 during collection.
    sideLengthsMm: [242.46, 250.12, 260.77],
    ratioTolerance: 0.08539646572677927,
    maxSideScaleRange: [0.9488382989988648, 1.0766027723407392],
    areaScaleRange: [0.8856468912520574, 1.0948854676827016],
  },
  {
    id: 'coaster-5',
    sideLengthsMm: [50.0, 54.0, 64.0],
    ratioTolerance: 0.04,
    maxSideScaleRange: [0.92, 1.08],
    areaScaleRange: [0.85, 1.15],
  },
  {
    id: 'coaster-6',
    sideLengthsMm: [40.0, 54.0, 68.0],
    ratioTolerance: 0.04,
    maxSideScaleRange: [0.92, 1.08],
    areaScaleRange: [0.85, 1.15],
  },
]

export let COASTER_TEMPLATE_SPECS: CoasterTemplateSpec[] = [...DEFAULT_COASTER_TEMPLATE_SPECS]

export function setCoasterTemplateSpecs(specs: CoasterTemplateSpec[]): void {
  COASTER_TEMPLATE_SPECS = [...specs]
}

export function setCoasterMmToTouchUnits(scale: number): void {
  COASTER_MM_TO_TOUCH_UNITS = scale
}

export function getCoasterTemplates(): CoasterTemplate[] {
  return COASTER_TEMPLATE_SPECS.map((spec) => templateFromPrototype(spec))
}

