import { useEffect, useRef, useCallback } from 'react'
import { Application } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { useAppStore } from '../store/useAppStore'
import { getDrinkById } from '../data/drinkCatalog'
import { StandbyLayer } from './StandbyLayer'
import { CoasterAnimation } from './CoasterAnimation'
import { IngredientSprite } from './IngredientSprite'

/**
 * PixiStage
 *
 * Owns the single PIXI.Application instance for the entire table display.
 * React StrictMode-safe via the `cancelled` flag pattern.
 * Wires Zustand coaster state to CoasterAnimation + IngredientSprite instances.
 */
export function PixiStage(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const standbyRef = useRef<StandbyLayer | null>(null)
  const animsRef = useRef(new Map<string, CoasterAnimation>())
  const spritesRef = useRef(new Map<string, IngredientSprite>())

  // ─── Init PixiJS once ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const app = new Application()
    app.init({
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: 0x0d0d0d,
      antialias: true,
      resolution: 1,
      autoDensity: false,
    }).then(() => {
      if (cancelled) {
        app.destroy(true)
        return
      }

      appRef.current = app
      const el = containerRef.current
      if (!el) return

      el.appendChild(app.canvas)
      app.canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;'

      const standby = new StandbyLayer(app)
      standbyRef.current = standby
      standby.mount()

      // Shared ticker drives all per-coaster animations
      app.ticker.add(() => {
        animsRef.current.forEach((a) => a.tick(app.ticker))
        spritesRef.current.forEach((s) => s.tick(app.ticker))
      })
    })

    return () => {
      cancelled = true
      standbyRef.current?.destroy()
      standbyRef.current = null
      animsRef.current.forEach((a) => a.destroy())
      animsRef.current.clear()
      spritesRef.current.forEach((s) => s.destroy())
      spritesRef.current.clear()
      appRef.current?.destroy(true, { children: true })
      appRef.current = null
    }
  }, [])

  // ─── Touch forwarding to StandbyLayer ────────────────────────────────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = CANVAS_SIZE / rect.width
    standbyRef.current?.setTouchPoint(
      (e.clientX - rect.left) * scale,
      (e.clientY - rect.top) * scale,
    )
  }, [])

  const handlePointerLeave = useCallback(() => {
    standbyRef.current?.clearTouchPoint()
  }, [])

  // ─── Reactive coaster sync ───────────────────────────────────────────────────
  const sessionActive = useAppStore((s) => s.sessionActive)
  const coasters = useAppStore((s) => s.coasters)

  useEffect(() => {
    const app = appRef.current
    if (!app) return

    if (!sessionActive) {
      standbyRef.current?.mount()
      animsRef.current.forEach((a) => { a.unmount(); a.destroy() })
      animsRef.current.clear()
      spritesRef.current.forEach((s) => { s.unmount(); s.destroy() })
      spritesRef.current.clear()
      return
    }

    standbyRef.current?.unmount()

    for (const c of coasters) {
      if (c.detected && c.drinkId) {
        const profile = getDrinkById(c.drinkId)
        if (!profile) continue

        if (!animsRef.current.has(c.id)) {
          const anim = new CoasterAnimation(profile, c.centroid)
          anim.mount(app.stage)
          animsRef.current.set(c.id, anim)

          const sprite = new IngredientSprite(profile.spriteCharacter, c.centroid.x, c.centroid.y)
          sprite.mount(app.stage)
          spritesRef.current.set(c.id, sprite)
        } else {
          animsRef.current.get(c.id)!.updatePosition(c.centroid)
        }
      } else {
        const anim = animsRef.current.get(c.id)
        if (anim) { anim.unmount(); anim.destroy(); animsRef.current.delete(c.id) }
        const sprite = spritesRef.current.get(c.id)
        if (sprite) { sprite.unmount(); sprite.destroy(); spritesRef.current.delete(c.id) }
      }
    }
  }, [sessionActive, coasters])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  )
}
