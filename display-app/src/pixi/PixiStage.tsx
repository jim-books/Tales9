import { useEffect, useRef, useCallback } from 'react'
import { Application, Assets, Graphics, Text, TextStyle, Container } from 'pixi.js'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import { getAllSpriteUrls } from './SpriteAnimDef'
import { useAppStore } from '../store/useAppStore'
import { drinkCatalog } from '../data/drinkCatalog'
import { StandbyLayer } from './StandbyLayer'
import { CoasterAnimation, drawOrbitalPreset, hexToNum, DEFAULT_PRESET } from './CoasterAnimation'
import { IngredientSprite } from './IngredientSprite'
import { GameLayer } from './GameLayer'
import { AmbientPreviewLayer } from './AmbientPreviewLayer'
import { findNearbyPairs } from '../engine/CoasterPairing'
import { SynergyPairEffect } from './SynergyPairEffect'
import { drinkPairSynergies, getFallbackSynergy } from '../data/drinkPairSynergies'
import type { OrbitalPreset } from '../types'
import type { AnimationDispatcher, AnimationCommand } from '../engine/AnimationDispatcher'

const PROXIMITY_THRESHOLD = 280  // px — coasters within this distance trigger a battle

interface PixiStageProps {
  onTrackingSurfaceReady?: (element: HTMLDivElement | null) => void
  showAmbientPreview?: boolean
  dispatcher?: AnimationDispatcher | null
}


function coasterLabelFromId(id: string): string {
  const match = id.match(/(\d+)/)
  return match ? `Coaster ${match[1]}` : id.toUpperCase()
}


interface AlphaTween {
  from: number
  to: number
  startedAt: number
  durationMs: number
}

/**
 * PixiStage
 *
 * Owns the single PIXI.Application instance for the entire table display.
 * React StrictMode-safe via the `cancelled` flag pattern.
 * Wires Zustand coaster state to CoasterAnimation + IngredientSprite instances.
 */
export function PixiStage({ onTrackingSurfaceReady, showAmbientPreview, dispatcher }: PixiStageProps = {}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const standbyRef = useRef<StandbyLayer | null>(null)
  const animsRef = useRef(new Map<string, CoasterAnimation>())
  const spritesRef = useRef(new Map<string, IngredientSprite>())
  const gameLayerRef = useRef<GameLayer | null>(null)
  const synergyContainerRef = useRef<Container | null>(null)
  const synergiesRef = useRef(new Map<string, SynergyPairEffect>())
  const previewsRef = useRef(new Map<string, {
    ring: Graphics
    vibe: Graphics
    label: Text
    phase: number
    x: number
    y: number
    colorPalette: [number, number, number]
    preset: OrbitalPreset
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
  const ringTweensRef = useRef(new Map<string, AlphaTween>())
  const spriteTweensRef = useRef(new Map<string, AlphaTween>())

  const destroyCoasterAnim = useCallback((coasterId: string): void => {
    ringTweensRef.current.delete(coasterId)
    const anim = animsRef.current.get(coasterId)
    if (!anim) return
    anim.unmount()
    anim.destroy()
    animsRef.current.delete(coasterId)
  }, [])

  const destroySprite = useCallback((coasterId: string): void => {
    spriteTweensRef.current.delete(coasterId)
    const sprite = spritesRef.current.get(coasterId)
    if (!sprite) return
    sprite.unmount()
    sprite.destroy()
    spritesRef.current.delete(coasterId)
  }, [])

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

      const synergyContainer = new Container()
      app.stage.addChildAt(synergyContainer, 0)
      synergyContainerRef.current = synergyContainer

      const standby = new StandbyLayer(app)
      standbyRef.current = standby
      standby.mount()

      const gameLayer = new GameLayer(app)
      gameLayer.mount()
      gameLayerRef.current = gameLayer

      // Shared ticker drives all per-coaster animations
      app.ticker.add(() => {
        const now = performance.now()
        for (const [coasterId, tween] of ringTweensRef.current) {
          const elapsed = now - tween.startedAt
          const progress = tween.durationMs <= 0 ? 1 : Math.min(1, elapsed / tween.durationMs)
          const alpha = tween.from + (tween.to - tween.from) * progress
          animsRef.current.get(coasterId)?.setAlpha(alpha)
          if (progress >= 1) {
            ringTweensRef.current.delete(coasterId)
          }
        }
        for (const [coasterId, tween] of spriteTweensRef.current) {
          const elapsed = now - tween.startedAt
          const progress = tween.durationMs <= 0 ? 1 : Math.min(1, elapsed / tween.durationMs)
          const alpha = tween.from + (tween.to - tween.from) * progress
          spritesRef.current.get(coasterId)?.setAlpha(alpha)
          if (progress >= 1) {
            spriteTweensRef.current.delete(coasterId)
          }
        }
        animsRef.current.forEach((a) => a.tick(app.ticker))

        // Update interactions and attraction
        const walkingSprites: { id: string; s: IngredientSprite }[] = []
        const interactingSprites: { id: string; s: IngredientSprite }[] = []

        spritesRef.current.forEach((s, id) => {
          const state = s.getState()
          if (state === 'walking') {
            walkingSprites.push({ id, s })
          } else if (state === 'interacting') {
            interactingSprites.push({ id, s })
          }
        })

        // Check if any interacting sprite has lost its partner or finished its interaction time
        interactingSprites.forEach(({ s }) => {
          if (s.getState() !== 'interacting') return

          const partnerId = s.getPartnerId()
          const partner = partnerId ? spritesRef.current.get(partnerId) : null
          
          if (performance.now() >= s.getInteractionEndTime()) {
            if (partner) {
              s.endInteraction(partner.xCoord, partner.yCoord)
              partner.endInteraction(s.xCoord, s.yCoord)
            } else {
              s.endInteraction()
            }
          } else if (partnerId && !partner) {
            s.endInteraction()
          }
        })

        // Apply attraction tendency and detect meetings between walking sprites
        for (let i = 0; i < walkingSprites.length; i++) {
          const spriteA = walkingSprites[i].s
          const idA = walkingSprites[i].id

          if (spriteA.getState() !== 'walking') continue

          let closestSprite: IngredientSprite | null = null
          let closestDist = Infinity

          for (let j = 0; j < walkingSprites.length; j++) {
            if (i === j) continue
            const spriteB = walkingSprites[j].s
            if (spriteB.getState() !== 'walking') continue

            const dx = spriteB.xCoord - spriteA.xCoord
            const dy = spriteB.yCoord - spriteA.yCoord
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < closestDist) {
              closestDist = dist
              closestSprite = spriteB
            }
          }

          if (closestSprite && closestDist < Infinity) {
            if (closestDist <= 56) {
              const partnerEntry = walkingSprites.find(w => w.s === closestSprite)
              if (partnerEntry && spriteA.canInteract() && closestSprite.canInteract()) {
                const idB = partnerEntry.id
                
                spriteA.startInteraction(idB, 5000)
                closestSprite.startInteraction(idA, 5000)

                const currentDirA = spriteA.getWalkDir()
                spriteA.setWalkDir(currentDirA)
                closestSprite.setWalkDir(currentDirA === 1 ? -1 : 1)
              }
              continue
            }

            if (closestDist <= 600 && spriteA.canInteract() && closestSprite.canInteract()) {
              spriteA.steerToward(closestSprite.xCoord, closestSprite.yCoord)
            }
          }
        }

        spritesRef.current.forEach((s) => s.tick(app.ticker))
        previewsRef.current.forEach((preview) => {
          preview.phase += app.ticker.deltaTime * 0.06
          const r = 38 + 8 * Math.sin(preview.phase)
          const alpha = 0.28 + 0.14 * (1 + Math.sin(preview.phase * 1.4)) * 0.5
          preview.ring.clear()
          preview.ring
            .circle(preview.x, preview.y, r)
            .stroke({ color: preview.colorPalette[0], width: 2, alpha })
          preview.ring
            .circle(preview.x, preview.y, r * 0.6)
            .stroke({ color: preview.colorPalette[0], width: 1, alpha: alpha * 0.7 })
          
          preview.vibe.clear()
          preview.vibe.alpha = 0.7
          drawOrbitalPreset(
            preview.vibe,
            preview.x,
            preview.y,
            preview.preset,
            preview.phase,
            preview.colorPalette,
            (size) => size * 0.8
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
      ringTweensRef.current.clear()
      spriteTweensRef.current.clear()
      synergiesRef.current.forEach((s) => s.destroy())
      synergiesRef.current.clear()
      if (synergyContainerRef.current) {
        synergyContainerRef.current.destroy({ children: true })
        synergyContainerRef.current = null
      }
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

  // ─── Animation dispatcher command stream ────────────────────────────────────
  useEffect(() => {
    if (!dispatcher) return
    const unsubscribe = dispatcher.subscribe((cmd: AnimationCommand) => {
      const app = appRef.current
      if (!app) return

      // #region agent log
      fetch('http://127.0.0.1:7379/ingest/6036d90d-37d6-4650-90f0-eba8f8a3cc28',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a7c9cd'},body:JSON.stringify({sessionId:'a7c9cd',location:'PixiStage.tsx:403',message:'Handling dispatcher command',data:{cmdAction:cmd.action,coasterId:'coasterId' in cmd ? cmd.coasterId : null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (cmd.action === 'PLAY') {
        const existing = animsRef.current.get(cmd.coasterId)
        if (existing) {
          existing.updatePosition(cmd.position)
          existing.setAlpha(cmd.initialAlpha)
          ringTweensRef.current.delete(cmd.coasterId)
          return
        }
        const anim = new CoasterAnimation(cmd.profile, cmd.position)
        anim.mount(app.stage)
        anim.setAlpha(cmd.initialAlpha)
        animsRef.current.set(cmd.coasterId, anim)
        ringTweensRef.current.delete(cmd.coasterId)
        return
      }

      if (cmd.action === 'SPAWN_SPRITE') {
        const existing = spritesRef.current.get(cmd.coasterId)
        if (existing) {
          existing.setAlpha(cmd.initialAlpha)
          spriteTweensRef.current.delete(cmd.coasterId)
          return
        }
        const sprite = new IngredientSprite(cmd.character, cmd.position.x, cmd.position.y)
        sprite.mount(app.stage)
        sprite.setAlpha(cmd.initialAlpha)
        spritesRef.current.set(cmd.coasterId, sprite)
        spriteTweensRef.current.delete(cmd.coasterId)
        return
      }

      if (cmd.action === 'UPDATE_POSITION') {
        animsRef.current.get(cmd.coasterId)?.updatePosition(cmd.position)
        return
      }

      if (cmd.action === 'TWEEN_RING_ALPHA') {
        const anim = animsRef.current.get(cmd.coasterId)
        if (!anim) return
        const from = anim.container.alpha
        ringTweensRef.current.set(cmd.coasterId, {
          from,
          to: cmd.toAlpha,
          startedAt: performance.now(),
          durationMs: cmd.durationMs,
        })
        return
      }

      if (cmd.action === 'TWEEN_SPRITE_ALPHA') {
        const sprite = spritesRef.current.get(cmd.coasterId)
        if (!sprite) return
        const from = sprite.container.alpha
        spriteTweensRef.current.set(cmd.coasterId, {
          from,
          to: cmd.toAlpha,
          startedAt: performance.now(),
          durationMs: cmd.durationMs,
        })
        return
      }

      if (cmd.action === 'CANCEL_RING_TWEEN') {
        ringTweensRef.current.delete(cmd.coasterId)
        animsRef.current.get(cmd.coasterId)?.setAlpha(cmd.alpha)
        return
      }

      if (cmd.action === 'CANCEL_SPRITE_TWEEN') {
        spriteTweensRef.current.delete(cmd.coasterId)
        spritesRef.current.get(cmd.coasterId)?.setAlpha(cmd.alpha)
        return
      }

      if (cmd.action === 'END_CYCLE') {
        destroyCoasterAnim(cmd.coasterId)
        destroySprite(cmd.coasterId)
      }
    })

    return () => unsubscribe()
  }, [dispatcher, destroyCoasterAnim, destroySprite])

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
      ringTweensRef.current.clear()
      spriteTweensRef.current.clear()
      synergiesRef.current.forEach((s) => { s.unmount(); s.destroy() })
      synergiesRef.current.clear()
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
      // #region agent log
      fetch('http://127.0.0.1:7379/ingest/6036d90d-37d6-4650-90f0-eba8f8a3cc28',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a7c9cd'},body:JSON.stringify({sessionId:'a7c9cd',location:'PixiStage.tsx:517',message:'Clearing preview',data:{id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
      colorPalette: [number, number, number],
      preset: OrbitalPreset,
      title: string,
    ): void => {
      // #region agent log
      fetch('http://127.0.0.1:7379/ingest/6036d90d-37d6-4650-90f0-eba8f8a3cc28',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a7c9cd'},body:JSON.stringify({sessionId:'a7c9cd',location:'PixiStage.tsx:533',message:'Upserting preview',data:{id,title},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const preview = previewsRef.current.get(id)
      const primaryColor = colorPalette[0]
      if (preview) {
        preview.x = x
        preview.y = y
        preview.colorPalette = colorPalette
        preview.preset = preset
        preview.title = title
        preview.label.style = new TextStyle({
          fontSize: 13,
          fontWeight: '700',
          fill: primaryColor,
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
          fill: primaryColor,
          align: 'center',
          letterSpacing: 0.5,
        }),
      })
      label.anchor.set(0.5, 1)
      label.alpha = 0.85
      app.stage.addChild(ring)
      app.stage.addChild(vibe)
      app.stage.addChild(label)
      previewsRef.current.set(id, { ring, vibe, label, phase: 0, x, y, colorPalette, preset, title })
    }

    const previewIds = new Set<string>()
    for (const c of coasters) {
      // #region agent log
      fetch('http://127.0.0.1:7379/ingest/6036d90d-37d6-4650-90f0-eba8f8a3cc28',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a7c9cd'},body:JSON.stringify({sessionId:'a7c9cd',location:'PixiStage.tsx:575',message:'Syncing store coaster',data:{id:c.id,detectionState:c.detectionState,drinkId:c.drinkId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (c.detectionState !== 'preview') {
        clearPreview(c.id)
        continue
      }
      const previewProfile = c.drinkId
        ? drinkCatalog.find((drink) => drink.id === c.drinkId)
        : undefined
      const colorsStr = previewProfile?.colorPalette ?? ['#66ccff', '#3399ff', '#99ccff']
      const colorPalette = colorsStr.map(hexToNum) as [number, number, number]
      const preset = previewProfile?.orbitalPreset ?? DEFAULT_PRESET
      const previewName = previewProfile?.name ?? 'UNASSIGNED'
      upsertPreview(
        c.id,
        c.centroid.x,
        c.centroid.y,
        colorPalette,
        preset,
        `${coasterLabelFromId(c.id)}: ${previewName}`,
      )
      previewIds.add(c.id)
    }

    for (const previewId of previewsRef.current.keys()) {
      if (!previewIds.has(previewId)) clearPreview(previewId)
    }

    // ── Synergy pair detection ────────────────────────────────────────────
    const activePairKeys = new Set<string>()
    const nearbyPairs = findNearbyPairs(coasters, PROXIMITY_THRESHOLD)

    for (const pair of nearbyPairs) {
      activePairKeys.add(pair.key)

      if (!synergiesRef.current.has(pair.key)) {
        // Resolve synergy config
        const drinkId = pair.coasterA.drinkId!
        const profile = drinkCatalog.find((d) => d.id === drinkId)
        const name = profile?.name ?? 'UNKNOWN'
        const colors = profile?.colorPalette ?? ['#66ccff', '#3399ff', '#99ccff']
        const config = drinkPairSynergies[pair.drinkPairKey] ?? getFallbackSynergy(drinkId, name, colors)

        const synergy = new SynergyPairEffect(app, pair.coasterA.centroid, pair.coasterB.centroid, config)
        
        // Mount to our dedicated back layer
        if (synergyContainerRef.current) {
          synergy.mount(synergyContainerRef.current)
        } else {
          synergy.mount(app.stage)
        }
        
        synergiesRef.current.set(pair.key, synergy)
      } else {
        synergiesRef.current.get(pair.key)!.updatePositions(pair.coasterA.centroid, pair.coasterB.centroid)
      }
    }

    // Remove synergies whose coasters moved apart
    for (const [key, synergy] of synergiesRef.current) {
      if (!activePairKeys.has(key)) {
        synergy.unmount()
        synergy.destroy()
        synergiesRef.current.delete(key)
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
