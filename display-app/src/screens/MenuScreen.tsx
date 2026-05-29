import { useCallback, useEffect, useRef, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { getDrinkMenuMedia } from '../data/drinkMenuMedia'
import { usePressAction } from './usePressAction'
import './screens.css'

interface MenuScreenProps {
  userColor: UserColor
  onNavigate: (screen: PanelScreen) => void
  onOrder: (drinkId: string) => void
}

interface MenuDrinkMediaProps {
  drinkId: string
  drinkName: string
  fallbackGradient: string
}

function MenuDrinkMedia({ drinkId, drinkName, fallbackGradient }: MenuDrinkMediaProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const mediaSrc = getDrinkMenuMedia(drinkId)
  const canPlayVideo = Boolean(mediaSrc) && inView && !loadError

  useEffect(() => {
    if (!containerRef.current) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px 0px', threshold: 0.1 },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return
    void videoRef.current.play().catch(() => {
      setLoadError(true)
    })
  }, [canPlayVideo])

  return (
    <div
      ref={containerRef}
      className="drink-card__media"
      aria-label={`${drinkName} animation`}
    >
      {canPlayVideo ? (
        <video
          ref={videoRef}
          className="drink-card__video"
          src={mediaSrc ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setLoadError(true)}
        />
      ) : (
        <div
          className="drink-card__image-placeholder"
          style={{ background: fallbackGradient }}
        />
      )}
    </div>
  )
}

function formatIngredients(ingredients: string[]): string {
  return ingredients.map((i) => i.toUpperCase()).join(' · ')
}

export function MenuScreen({ userColor: _userColor, onNavigate, onOrder: _onOrder }: MenuScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleCardPress = useCallback(
    (drinkId: string) => {
      setSelectedId(drinkId)
      onNavigate({ view: 'detail', drinkId })
    },
    [onNavigate],
  )

  return (
    <div className="screen menu-screen">
      <div className="menu-screen__header">
        <button
          className="screen-back"
          {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'home' }))}
          aria-label="Back to home"
        >
          ←
        </button>
        <div className="panel-brand panel-brand--compact">
          <div className="panel-brand__name">BARCODE</div>
          <div className="panel-brand__subtitle">Signature Cocktails</div>
        </div>
      </div>

      <div className="screen-body menu-screen__body">
        {drinkCatalog.map((drink) => (
          <button
            key={drink.id}
            type="button"
            className={`drink-card drink-card--v2${selectedId === drink.id ? ' drink-card--selected' : ''}`}
            {...makePressHandlers<HTMLButtonElement>(() => handleCardPress(drink.id))}
          >
            <MenuDrinkMedia
              drinkId={drink.id}
              drinkName={drink.name}
              fallbackGradient={`linear-gradient(160deg, ${drink.colorPalette[0]}55, ${drink.colorPalette[1]}33)`}
            />
            <span className="drink-card__checkbox" aria-hidden="true" />
            <div className="drink-card__body">
              <div className="drink-card__row">
                <span className="drink-card__name">{drink.name}</span>
                <span className="drink-card__price">${drink.price}</span>
              </div>
              <div className="drink-card__ingredients">
                {formatIngredients(drink.ingredients)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
