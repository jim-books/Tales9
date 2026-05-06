import { useEffect, useRef, useCallback } from 'react'
import { Application, Assets, Graphics, Text, TextStyle } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { getAllSpriteUrls } from './SpriteAnimDef'
import { useAppStore } from '../store/useAppStore'
import { drinkCatalog, getDrinkById } from '../data/drinkCatalog'
import { StandbyLayer } from './StandbyLayer'
import { CoasterAnimation } from './CoasterAnimation'
import { IngredientSprite } from './IngredientSprite'
import { GameLayer } from './GameLayer'
import { ProximityBattle } from './ProximityBattle'
import { AmbientPreviewLayer } from './AmbientPreviewLayer'
import type { AnimationFamily } from '../types'

const PROXIMITY_THRESHOLD = 280  // px — coasters within this distance trigger a battle

interface PixiStageProps {
  onTrackingSurfaceReady?: (element: HTMLDivElement | null) => void
  showAmbientPreview?: boolean
}

function parseHexColor(hex: string, fallback = 0x66ccff): number {
  const normalized = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback
  return Number.parseInt(normalized, 16)
}

function coasterLabelFromId(id: string): string {
  const match = id.match(/(\d+)/)
  return match ? `Coaster ${match[1]}` : id.toUpperCase()
}

function drawPreviewVibe(
  graphics: Graphics,
  family: AnimationFamily,
  x: number,
  y: number,
  phase: number,
  color: number,
): void {
  switch (family) {
    case 'energetic': {
      for (let i = 0; i < 3; i++) {
        const angle = phase * 2.8 + (Math.PI * 2 * i) / 3
        const ox = Math.cos(angle) * 16
        const oy = Math.sin(angle) * 16
        graphics.circle(x + ox, y + oy, 4).fill({ color, alpha: 0.68 })
      }
      break
    }
    case 'elegant': {
      const ring = 10 + ((Math.sin(phase * 0.8) + 1) * 0.5) * 16
      graphics.circle(x, y, ring).stroke({ color, width: 1.5, alpha: 0.56 })
      break
    }
    case 'tropical': {
      const p = (Math.sin(phase) + 1) * 0.5
      graphics.circle(x, y, 12 + p * 8).stroke({ color, width: 2, alpha: 0.48 })
      graphics.circle(x, y, 22 + (1 - p) * 8).stroke({ color, width: 1.5, alpha: 0.38 })
      break
    }
    case 'bold': {
      const pulse = 10 + ((Math.sin(phase * 1.4) + 1) * 0.5) * 10
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * i) / 2
        const x2 = x + Math.cos(angle) * pulse
        const y2 = y + Math.sin(angle) * pulse
        graphics.moveTo(x, y).lineTo(x2, y2).stroke({ color, width: 2, alpha: 0.62 })
      }
      break
    }
  }
}

/**
 * PixiStage
 *
 * Owns the single PIXI.Application instance for the entire table display.
 * React StrictMode-safe via the `cancelled` flag pattern.
 * Wires Zustand coaster state to CoasterAnimation + IngredientSprite instances.
 */
export function PixiStage({ onTrackingSurfaceReady, showAmbientPreview }: PixiStageProps = {}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const standbyRef = useRef<StandbyLayer | null>(null)
  const animsRef = useRef(new Map<string, CoasterAnimation>())
  const spritesRef = useRef(new Map<string, IngredientSprite>())
  const gameLayerRef = useRef<GameLayer | null>(null)
  const battlesRef = useRef(new Map<string, ProximityBattle>())
  const previewsRef = useRef(new Map<string, {
    ring: Graphics
    vibe: Graphics
    label: Text
    phase: number
    x: number
    y: number
    color: number
    family: AnimationFamily
    title: string
  }>())
  const burstRef = useRef<{
    graphics: Graphics
    phase: number
    x: number
    y: number
    colorHex: number
  } | null>(null)
  const ambientRef = useRef<AmbientPreviewLayer | null>(null)

  useEffect(() => {
    onTrackingSurfaceReady?.(containerRef.current)
    return () => onTrackingSurfaceReady?.(null)
  }, [onTrackingSurfaceReady])

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
    }).then(async () => {
      if (cancelled) {
        app.destroy(true)
        return
      }

      // Pre-load all registered sprite textures into the PixiJS asset cache
      // so FrameAnimPlayer can access them synchronously via Assets.get()
      const spriteUrls = getAllSpriteUrls()
      if (spriteUrls.length > 0) {
        await Assets.load(spriteUrls)
      }

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
        previewsRef.current.forEach((preview) => {
          preview.phase += app.ticker.deltaTime * 0.06
          const r = 38 + 8 * Math.sin(preview.phase)
          const alpha = 0.28 + 0.14 * (1 + Math.sin(preview.phase * 1.4)) * 0.5
          preview.ring.clear()
          preview.ring
            .circle(preview.x, preview.y, r)
            .stroke({ color: preview.color, width: 2, alpha })
          preview.ring
            .circle(preview.x, preview.y, r * 0.6)
            .stroke({ color: preview.color, width: 1, alpha: alpha * 0.7 })
          preview.vibe.clear()
          drawPreviewVibe(
            preview.vibe,
            preview.family,
            preview.x,
            preview.y,
            preview.phase,
            preview.color,
          )
          preview.label.text = preview.title
          preview.label.alpha = 0.85
          preview.label.x = preview.x
          preview.label.y = preview.y - 56
        })
        // Order burst: 3 staggered expanding rings in user color
        if (burstRef.current) {
          const b = burstRef.current
          b.phase += app.ticker.deltaTime
          b.graphics.clear()
          for (let i = 0; i < 3; i++) {
            const t = (b.phase - i * 20) / 90
            if (t <= 0 || t > 1) continue
            b.graphics
              .circle(b.x, b.y, 40 + t * 160)
              .stroke({ color: b.colorHex, width: 3, alpha: (1 - t) * 0.75 })
          }
          if (b.phase > 130) {
            if (b.graphics.parent) b.graphics.parent.removeChild(b.graphics)
            b.graphics.destroy()
            burstRef.current = null
            useAppStore.getState().clearOrderBurst()
          }
        }
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
      previewsRef.current.forEach((p) => {
        p.ring.destroy()
        p.vibe.destroy()
        p.label.destroy()
      })
      previewsRef.current.clear()
      if (burstRef.current) {
        burstRef.current.graphics.destroy()
        burstRef.current = null
      }
      ambientRef.current?.destroy()
      ambientRef.current = null
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
      previewsRef.current.forEach((p) => {
        if (p.ring.parent) p.ring.parent.removeChild(p.ring)
        if (p.vibe.parent) p.vibe.parent.removeChild(p.vibe)
        if (p.label.parent) p.label.parent.removeChild(p.label)
        p.ring.destroy()
        p.vibe.destroy()
        p.label.destroy()
      })
      previewsRef.current.clear()
      return
    }

    standbyRef.current?.unmount()

    const clearPreview = (id: string): void => {
      const preview = previewsRef.current.get(id)
      if (!preview) return
      if (preview.ring.parent) preview.ring.parent.removeChild(preview.ring)
      if (preview.vibe.parent) preview.vibe.parent.removeChild(preview.vibe)
      if (preview.label.parent) preview.label.parent.removeChild(preview.label)
      preview.ring.destroy()
      preview.vibe.destroy()
      preview.label.destroy()
      previewsRef.current.delete(id)
    }

    const upsertPreview = (
      id: string,
      x: number,
      y: number,
      color: number,
      family: AnimationFamily,
      title: string,
    ): void => {
      const preview = previewsRef.current.get(id)
      if (preview) {
        preview.x = x
        preview.y = y
        preview.color = color
        preview.family = family
        preview.title = title
        preview.label.style = new TextStyle({
          fontSize: 13,
          fontWeight: '700',
          fill: color,
          align: 'center',
          letterSpacing: 0.5,
        })
        return
      }
      const ring = new Graphics()
      const vibe = new Graphics()
      const label = new Text({
        text: title,
        style: new TextStyle({
          fontSize: 13,
          fontWeight: '700',
          fill: color,
          align: 'center',
          letterSpacing: 0.5,
        }),
      })
      label.anchor.set(0.5, 1)
      label.alpha = 0.85
      app.stage.addChild(ring)
      app.stage.addChild(vibe)
      app.stage.addChild(label)
      previewsRef.current.set(id, { ring, vibe, label, phase: 0, x, y, color, family, title })
    }

    for (const c of coasters) {
      if (c.detectionState === 'preview') {
        const previewProfile = c.drinkId
          ? drinkCatalog.find((drink) => drink.id === c.drinkId)
          : undefined
        const previewColor = parseHexColor(previewProfile?.colorPalette[0] ?? '#66ccff')
        const previewFamily: AnimationFamily = previewProfile?.animationFamily ?? 'elegant'
        const previewName = previewProfile?.name ?? 'UNASSIGNED'
        upsertPreview(
          c.id,
          c.centroid.x,
          c.centroid.y,
          previewColor,
          previewFamily,
          `${coasterLabelFromId(c.id)}: ${previewName}`,
        )
        const anim = animsRef.current.get(c.id)
        if (anim) { anim.unmount(); anim.destroy(); animsRef.current.delete(c.id) }
        const sprite = spritesRef.current.get(c.id)
        if (sprite) { sprite.unmount(); sprite.destroy(); spritesRef.current.delete(c.id) }
      } else if (c.detectionState === 'confirmed' && c.drinkId) {
        clearPreview(c.id)
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
        clearPreview(c.id)
        const anim = animsRef.current.get(c.id)
        if (anim) { anim.unmount(); anim.destroy(); animsRef.current.delete(c.id) }
        const sprite = spritesRef.current.get(c.id)
        if (sprite) { sprite.unmount(); sprite.destroy(); spritesRef.current.delete(c.id) }
      }
    }

    // ── Proximity battle detection ────────────────────────────────────────────
    const activePairKeys = new Set<string>()
    const activeCoasters = coasters.filter(
      (c) => c.detectionState === 'confirmed' && c.drinkId,
    )
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

  // ─── Order burst animation ────────────────────────────────────────────────────
  const orderBurst = useAppStore((s) => s.orderBurst)

  useEffect(() => {
    const app = appRef.current
    if (!app || !orderBurst) return
    if (burstRef.current) {
      burstRef.current.graphics.parent?.removeChild(burstRef.current.graphics)
      burstRef.current.graphics.destroy()
      burstRef.current = null
    }
    const graphics = new Graphics()
    app.stage.addChild(graphics)
    burstRef.current = {
      graphics,
      phase: 0,
      x: orderBurst.x,
      y: orderBurst.y,
      colorHex: orderBurst.colorHex,
    }
  }, [orderBurst])

  // ─── Ambient preview layer ────────────────────────────────────────────────────
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    if (showAmbientPreview && !ambientRef.current) {
      ambientRef.current = new AmbientPreviewLayer(app)
      ambientRef.current.mount()
    } else if (!showAmbientPreview && ambientRef.current) {
      ambientRef.current.destroy()
      ambientRef.current = null
    }
  }, [showAmbientPreview])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  )
}
