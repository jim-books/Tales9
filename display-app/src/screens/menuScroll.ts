import type { UserEdge } from '../types'

/** Matches UserNode panel CSS rotation per edge. */
export function panelRotationDegrees(edge: UserEdge): number {
  switch (edge) {
    case 'bottom':
      return 0
    case 'right':
      return -90
    case 'top':
      return 180
    case 'left':
      return 90
  }
}

/** Screen pointer delta mapped to panel-local vertical drag. */
export function panelLocalDragY(panelEdge: UserEdge, deltaX: number, deltaY: number): number {
  const theta = (panelRotationDegrees(panelEdge) * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return -deltaX * sin + deltaY * cos
}

/** scrollTop delta for an orientation-aware finger drag. */
export function menuScrollDelta(panelEdge: UserEdge, deltaX: number, deltaY: number): number {
  return -panelLocalDragY(panelEdge, deltaX, deltaY)
}
