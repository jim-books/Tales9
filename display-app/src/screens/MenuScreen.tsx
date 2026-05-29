import { useCallback, useEffect, useRef, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { loadDrinkMenuMedia } from '../data/drinkMenuMedia'
import { usePressAction } from './usePressAction'
import './screens.css'

interface MenuScreenProps {
  userColor: UserColor
  onNavigate: (screen: PanelScreen) => void
  onOrder: (drinkId: string) => void
}

type FilterCategory = DrinkCategory | 'ALL'

const CATEGORY_OPTIONS: Array<{ value: FilterCategory; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'CLASSICS', label: 'Classics' },
  { value: 'COFFEE_BASED', label: 'Coffee' },
  { value: 'DESSERT_INSPIRED', label: 'Dessert' },
]

interface MenuDrinkMediaProps {
  drinkId: string
  drinkName: string
  fallbackGradient: string
}

const MAX_CONCURRENT_MENU_VIDEOS = 4
const activeMenuVideos = new Set<HTMLVideoElement>()

function capConcurrentMenuPlayback(videoEl: HTMLVideoElement): void {
  activeMenuVideos.add(videoEl)
  while (activeMenuVideos.size > MAX_CONCURRENT_MENU_VIDEOS) {
    const oldest = activeMenuVideos.values().next().value as HTMLVideoElement | undefined
    if (!oldest) break
    oldest.pause()
    oldest.currentTime = 0
    activeMenuVideos.delete(oldest)
  }
}

function MenuDrinkMedia({ drinkId, drinkName, fallbackGradient }: MenuDrinkMediaProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = useState(false)
  const [mediaSrc, setMediaSrc] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const canPlayVideo = Boolean(mediaSrc) && inView && !loadError

  useEffect(() => {
    if (!inView) {
      if (videoRef.current) {
        videoRef.current.pause()
        activeMenuVideos.delete(videoRef.current)
      }
      setMediaSrc(null)
      return
    }

    let cancelled = false
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
  }, [drinkId, inView])

  useEffect(() => {
    if (!containerRef.current) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const scrollRoot = containerRef.current.closest('.menu-screen__scroll')
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        rootMargin: '48px 0px',
        threshold: 0.35,
      },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return
    capConcurrentMenuPlayback(videoRef.current)
    void videoRef.current.play().catch(() => {
      setLoadError(true)
    })
  }, [canPlayVideo])

  useEffect(() => {
    if (canPlayVideo || !videoRef.current) return
    videoRef.current.pause()
    activeMenuVideos.delete(videoRef.current)
  }, [canPlayVideo])

  useEffect(() => {
    return () => {
      if (!videoRef.current) return
      videoRef.current.pause()
      activeMenuVideos.delete(videoRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="menu-drink-card__media"
      aria-label={`${drinkName} animation`}
    >
      {canPlayVideo ? (
        <video
          ref={videoRef}
          className="menu-drink-card__video"
          src={mediaSrc ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setLoadError(true)}
        />
      ) : (
        <div
          className="menu-drink-card__placeholder"
          style={{ background: fallbackGradient }}
        />
      )}
    </div>
  )
}

export function MenuScreen({ userColor: _userColor, onNavigate, onOrder: _onOrder }: MenuScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL')

  const handleCardPress = useCallback(
    (drinkId: string) => {
      onNavigate({ view: 'detail', drinkId })
    },
    [onNavigate],
  )

  const filtered = drinkCatalog.filter((drink) => {
    const matchesCategory = activeCategory === 'ALL' || drink.category === activeCategory
    const matchesQuery =
      drink.name.toLowerCase().includes(query.toLowerCase()) ||
      drink.ingredients.some((item) => item.toLowerCase().includes(query.toLowerCase()))
    return matchesCategory && matchesQuery
  })

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
          <div className="panel-brand__subtitle">Cocktail Menu</div>
        </div>
      </div>

      <div className="menu-screen__toolbar">
        <label className="menu-search">
          <span className="menu-search__icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search cocktails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search cocktails"
          />
        </label>

        <div className="menu-categories" role="tablist" aria-label="Drink categories">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeCategory === value}
              className={`menu-cat-btn${activeCategory === value ? ' menu-cat-btn--active' : ''}`}
              {...makePressHandlers<HTMLButtonElement>(() => setActiveCategory(value))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-screen__scroll">
        {filtered.length === 0 ? (
          <div className="menu-empty">No cocktails found.</div>
        ) : (
          <div className="menu-grid">
            {filtered.map((drink) => (
              <button
                key={drink.id}
                type="button"
                className="menu-drink-card"
                {...makePressHandlers<HTMLButtonElement>(() => handleCardPress(drink.id))}
              >
                <MenuDrinkMedia
                  drinkId={drink.id}
                  drinkName={drink.name}
                  fallbackGradient={`linear-gradient(160deg, ${drink.colorPalette[0]}88, ${drink.colorPalette[1]}44)`}
                />
                <div className="menu-drink-card__footer">
                  <span className="menu-drink-card__name">{drink.name}</span>
                  <span className="menu-drink-card__price">${drink.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
