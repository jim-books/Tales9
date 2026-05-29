import { useEffect, useRef, useState } from 'react'
import { getDrinkById } from '../data/drinkCatalog'
import { loadDrinkMenuMedia } from '../data/drinkMenuMedia'
import type { UserColor } from '../types'
import { usePressAction } from './usePressAction'
import './screens.css'

interface DrinkDetailModalProps {
  drinkId: string
  userColor: UserColor
  onOrder: (drinkId: string) => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  CLASSICS: 'Classics',
  COFFEE_BASED: 'Coffee',
  DESSERT_INSPIRED: 'Dessert',
}

interface DrinkDetailMediaProps {
  drinkId: string
  drinkName: string
  fallbackGradient: string
}

const MAX_CONCURRENT_DRINK_VIDEOS = 1
const activeDrinkVideos = new Set<HTMLVideoElement>()

function capConcurrentDrinkPlayback(videoEl: HTMLVideoElement): void {
  activeDrinkVideos.add(videoEl)
  while (activeDrinkVideos.size > MAX_CONCURRENT_DRINK_VIDEOS) {
    const oldest = activeDrinkVideos.values().next().value as HTMLVideoElement | undefined
    if (!oldest) break
    oldest.pause()
    oldest.currentTime = 0
    activeDrinkVideos.delete(oldest)
  }
}

function DrinkDetailMedia({ drinkId, drinkName, fallbackGradient }: DrinkDetailMediaProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mediaSrc, setMediaSrc] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const canPlayVideo = Boolean(mediaSrc) && !loadError

  useEffect(() => {
    let cancelled = false
    setMediaSrc(null)
    setLoadError(false)

    void loadDrinkMenuMedia(drinkId)
      .then((url) => {
        if (cancelled) return
        if (!url) {
          setLoadError(true)
          return
        }
        setMediaSrc(url)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [drinkId])

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return
    capConcurrentDrinkPlayback(videoRef.current)
    void videoRef.current.play().catch(() => {
      setLoadError(true)
    })
  }, [canPlayVideo, drinkId])

  useEffect(() => {
    return () => {
      if (!videoRef.current) return
      videoRef.current.pause()
      activeDrinkVideos.delete(videoRef.current)
    }
  }, [])

  return (
    <div className="drink-detail__media" aria-label={`${drinkName} animation`}>
      {canPlayVideo ? (
        <video
          ref={videoRef}
          className="drink-detail__video"
          src={mediaSrc ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setLoadError(true)}
        />
      ) : (
        <div
          className="drink-detail__placeholder"
          style={{ background: fallbackGradient }}
        />
      )}
    </div>
  )
}

export function DrinkDetailModal({
  drinkId,
  userColor: _userColor,
  onOrder,
  onBack,
}: DrinkDetailModalProps): JSX.Element {
  const drink = getDrinkById(drinkId)
  const { makePressHandlers } = usePressAction()

  if (!drink) {
    return (
      <div className="screen drink-detail-screen">
        <div className="panel-brand">
          <div className="panel-brand__name">BARCODE</div>
        </div>
        <div className="drink-detail-screen__body">
          <p className="drink-detail__empty">Drink not found.</p>
        </div>
        <div className="drink-detail-screen__actions">
          <button
            type="button"
            className="panel-page__exit"
            {...makePressHandlers<HTMLButtonElement>(onBack)}
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen drink-detail-screen">
      <div className="panel-brand">
        <div className="panel-brand__name">BARCODE</div>
      </div>

      <div className="drink-detail-screen__body">
        <DrinkDetailMedia
          drinkId={drink.id}
          drinkName={drink.name}
          fallbackGradient={`linear-gradient(160deg, ${drink.colorPalette[0]}88, ${drink.colorPalette[1]}44)`}
        />

        <div className="drink-detail__info">
          <span className="drink-detail__category">
            {CATEGORY_LABELS[drink.category] ?? drink.category}
          </span>
          <h2 className="drink-detail__name">{drink.name}</h2>
          <div className="drink-detail__tags">
            {drink.ingredients.map((ingredient) => (
              <span key={ingredient} className="drink-detail__tag">
                {ingredient.toUpperCase()}
              </span>
            ))}
          </div>
          <p className="drink-detail__description">{drink.description}</p>
          <p className="drink-detail__price">${drink.price}</p>
        </div>
      </div>

      <div className="drink-detail-screen__actions">
        <button
          type="button"
          className="drink-detail__order"
          {...makePressHandlers<HTMLButtonElement>(() => onOrder(drink.id))}
        >
          Place Order via Coaster
        </button>
        <button
          type="button"
          className="panel-page__exit"
          {...makePressHandlers<HTMLButtonElement>(onBack)}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}
