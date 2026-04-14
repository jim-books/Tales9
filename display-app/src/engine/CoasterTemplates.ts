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

export const COASTER_CONFIRM_FRAMES = 2
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
  // Tuned from 10–20 debug-panel captures per coaster (pixel-distance source).
  // C1 fitted median sides: ~190, 195, 198
  // C2 fitted median sides: ~138, 175, 179
  {
    id: 'coaster-1',
    sideLengthsMm: [190.00, 195.00, 198.00],
    ratioTolerance: 0.06,
    maxSideScaleRange: [0.95, 1.06],
    areaScaleRange: [0.88, 1.15],
  },
  {
    id: 'coaster-2',
    sideLengthsMm: [138.00, 175.00, 179.00],
    ratioTolerance: 0.07,
    maxSideScaleRange: [0.93, 1.05],
    areaScaleRange: [0.82, 1.18],
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

