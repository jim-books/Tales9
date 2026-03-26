import type { Point, CoasterTouchSignature } from '../types'

/**
 * CalibrationMapper
 *
 * Converts raw touch/sensor coordinates into display pixel coordinates.
 * The display canvas is always treated as CANVAS_SIZE × CANVAS_SIZE pixels.
 */

export const CANVAS_SIZE = 1900 // px — matches physical display

export interface CalibrationConfig {
  /** Raw input range (sensor units or normalised 0–1) */
  inputMin: Point
  inputMax: Point
  /** Display output range (px). Defaults to full canvas. */
  outputMin?: Point
  outputMax?: Point
}

const DEFAULT_CONFIG: Required<CalibrationConfig> = {
  inputMin: { x: 0, y: 0 },
  inputMax: { x: 1, y: 1 },
  outputMin: { x: 0, y: 0 },
  outputMax: { x: CANVAS_SIZE, y: CANVAS_SIZE },
}

export class CalibrationMapper {
  private cfg: Required<CalibrationConfig>

  constructor(config: CalibrationConfig = DEFAULT_CONFIG) {
    this.cfg = {
      inputMin: config.inputMin,
      inputMax: config.inputMax,
      outputMin: config.outputMin ?? { x: 0, y: 0 },
      outputMax: config.outputMax ?? { x: CANVAS_SIZE, y: CANVAS_SIZE },
    }
  }

  /** Map a single raw point to display coordinates */
  map(raw: Point): Point {
    const { inputMin, inputMax, outputMin, outputMax } = this.cfg

    const tx = (raw.x - inputMin.x) / (inputMax.x - inputMin.x)
    const ty = (raw.y - inputMin.y) / (inputMax.y - inputMin.y)

    return {
      x: outputMin.x + tx * (outputMax.x - outputMin.x),
      y: outputMin.y + ty * (outputMax.y - outputMin.y),
    }
  }

  /** Compute centroid of three raw touch points, then map to display coords */
  centroidOf(signature: CoasterTouchSignature): Point {
    const [a, b, c] = signature
    const rawCentroid: Point = {
      x: (a.x + b.x + c.x) / 3,
      y: (a.y + b.y + c.y) / 3,
    }
    return this.map(rawCentroid)
  }

  /** Euclidean distance between two display-space points */
  static distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }
}
