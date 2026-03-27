import { useEffect, useRef, useCallback } from 'react'
import { Application } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { useAppStore } from '../store/useAppStore'
import { getDrinkById } from '../data/drinkCatalog'
import { StandbyLayer } from './StandbyLayer'
import { CoasterAnimation } from './CoasterAnimation'
import { IngredientSprite } from './IngredientSprite'
import { GameLayer } from './GameLayer'
import { ProximityBattle } from './ProximityBattle'

const PROXIMITY_THRESHOLD = 280  // px — coasters within this distance trigger a battle

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
  const gameLayerRef = useRef<GameLayer | null>(null)
  const battlesRef = useRef(new Map<string, ProximityBattle>())

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

      const gameLayer = new GameLayer(app)
      gameLayer.mount()
      gameLayerRef.current = gameLayer

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
      gameLayerRef.current?.destroy()
      gameLayerRef.current = null
      animsRef.current.forEach((a) => a.destroy())
      animsRef.current.clear()
      spritesRef.current.forEach((s) => s.destroy())
      spritesRef.current.clear()
      battlesRef.current.forEach((b) => b.destroy())
      battlesRef.current.clear()
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

  // ─── Game state → GameLayer ──────────────────────────────────────────────────
  const gameState = useAppStore((s) => s.gameState)

  useEffect(() => {
    const layer = gameLayerRef.current
    if (!layer) return

    if (!gameState) {
      layer.stop()
      return
    }

    if (gameState.phase !== 0) return  // animation already running / result shown

    const { userNodes } = useAppStore.getState()
    const positions = userNodes.map((n) => ({
      x: n.position.x * CANVAS_SIZE,
      y: n.position.y * CANVAS_SIZE,
    }))
    if (positions.length === 0) return

    const handleChosen = (idx: number): void => {
      const { userNodes: nodes, advanceGame } = useAppStore.getState()
      const node = nodes[idx]
      if (!node) return
      layer.showSpotlight(
        { x: node.position.x * CANVAS_SIZE, y: node.position.y * CANVAS_SIZE },
        gameState.type === 'truth_or_dare' ? 'TRUTH OR DARE?' : '♛ THE KING',
      )
      advanceGame(1, null, node.id)
    }

    if (gameState.type === 'truth_or_dare') {
      layer.startTruthOrDare(positions, handleChosen)
    } else {
      layer.startKingsGame(positions, handleChosen)
    }
  }, [gameState])

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
      battlesRef.current.forEach((b) => { b.unmount(); b.destroy() })
      battlesRef.current.clear()
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

    // ── Proximity battle detection ────────────────────────────────────────────
    const activePairKeys = new Set<string>()
    const activeCoasters = coasters.filter((c) => c.detected && c.drinkId)
    for (let i = 0; i < activeCoasters.length; i++) {
      for (let j = i + 1; j < activeCoasters.length; j++) {
        const a = activeCoasters[i]
        const b = activeCoasters[j]
        const dx = a.centroid.x - b.centroid.x
        const dy = a.centroid.y - b.centroid.y
        if (Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD) {
          const key = `${a.id}:${b.id}`
          activePairKeys.add(key)
          if (!battlesRef.current.has(key)) {
            const battle = new ProximityBattle(app, a.centroid, b.centroid)
            battle.mount(app.stage)
            battlesRef.current.set(key, battle)
          } else {
            battlesRef.current.get(key)!.updatePositions(a.centroid, b.centroid)
          }
        }
      }
    }
    // Remove battles whose coasters moved apart
    for (const [key, battle] of battlesRef.current) {
      if (!activePairKeys.has(key)) {
        battle.unmount(); battle.destroy()
        battlesRef.current.delete(key)
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
