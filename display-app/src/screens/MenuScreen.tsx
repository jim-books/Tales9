import { useEffect, useRef, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { getDrinkMenuMedia } from '../data/drinkMenuMedia'
import './screens.css'

interface MenuScreenProps {
  userColor: UserColor
  onNavigate: (screen: PanelScreen) => void
  onOrder: (drinkId: string) => void
}

type FilterCategory = DrinkCategory | 'ALL'

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  ALL: 'All',
  CLASSICS: 'Classics',
  COFFEE_BASED: 'Coffee Based',
  DESSERT_INSPIRED: 'Dessert Inspired',
}

const FILTER_OPTIONS: FilterCategory[] = ['ALL', 'CLASSICS', 'COFFEE_BASED', 'DESSERT_INSPIRED']

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
      <div className="drink-card__media-overlay">
        {loadError
          ? 'Animation unavailable'
          : canPlayVideo
            ? 'Playing animation'
            : inView
              ? 'Loading animation'
              : 'Scroll to load animation'}
      </div>
    </div>
  )
}

export function MenuScreen({ userColor: _userColor, onNavigate, onOrder }: MenuScreenProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL')

  const filtered = drinkCatalog.filter((d) => {
    const matchesCat = activeCategory === 'ALL' || d.category === activeCategory
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    return matchesCat && matchesQuery
  })

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-header__title" style={{ textAlign: 'center', flex: 1 }}>
          Menu
        </span>
      </div>
      <div className="screen-body">
        <div className="menu-header">
          <div className="menu-header__title">BARCODE</div>
          <div className="menu-header__subtitle">── COCKTAIL MENU ──</div>
        </div>

        <div className="menu-search">
          <span style={{ color: 'var(--color-muted)', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search cocktails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="menu-categories">
          {FILTER_OPTIONS.map((cat) => (
            <button
              key={cat}
              className={`menu-cat-btn${activeCategory === cat ? ' menu-cat-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="menu-empty">No cocktails found.</div>
        )}

        {filtered.map((drink) => (
          <div key={drink.id} className="drink-card">
            <MenuDrinkMedia
              drinkId={drink.id}
              drinkName={drink.name}
              fallbackGradient={`linear-gradient(135deg, ${drink.colorPalette[0]}, ${drink.colorPalette[1]})`}
            />
            <div className="drink-card__body">
              <span className="category-pill">{CATEGORY_LABELS[drink.category]}</span>
              <div className="drink-card__name">{drink.name}</div>
              <div className="drink-card__flavor">{drink.flavorProfile}</div>
              <div className="drink-card__footer">
                <span className="drink-card__price">${drink.price}</span>
                <div className="drink-card__actions">
                  <button
                    className="btn-details"
                    onClick={() => onNavigate({ view: 'detail', drinkId: drink.id })}
                  >
                    Details
                  </button>
                  <button className="btn-order-sm" onClick={() => onOrder(drink.id)}>
                    Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
