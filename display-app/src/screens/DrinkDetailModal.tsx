import { useEffect, useRef, useState } from 'react'
import { getDrinkById } from '../data/drinkCatalog'
import { getDrinkMenuMedia } from '../data/drinkMenuMedia'
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

function DrinkDetailMedia({ drinkId, drinkName, fallbackGradient }: DrinkDetailMediaProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [loadError, setLoadError] = useState(false)

  const mediaSrc = getDrinkMenuMedia(drinkId)
  const canPlayVideo = Boolean(mediaSrc) && !loadError

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return
    void videoRef.current.play().catch(() => {
      setLoadError(true)
    })
  }, [canPlayVideo, drinkId])

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
