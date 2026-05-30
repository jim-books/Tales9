import { useCallback, useRef, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor, UserEdge } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { menuScrollDelta, panelLocalDragY } from './menuScroll'
import { usePressAction } from './usePressAction'
import './screens.css'

interface MenuScreenProps {
  userColor: UserColor
  panelEdge: UserEdge
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

function MenuDrinkMedia({ drinkId, drinkName, fallbackGradient }: MenuDrinkMediaProps): JSX.Element {
  const [posterError, setPosterError] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const posterSrc = `/menu-posters/${drinkId}.jpg`
  const canShowPoster = !posterError && !loadError

  return (
    <div
      className="menu-drink-card__media"
      aria-label={`${drinkName} poster`}
    >
      {canShowPoster ? (
        <img
          className="menu-drink-card__video"
          src={posterSrc}
          alt={`${drinkName} poster`}
          loading="lazy"
          onError={() => {
            setPosterError(true)
            setLoadError(true)
          }}
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

export function MenuScreen({
  userColor: _userColor,
  panelEdge,
  onNavigate,
  onOrder: _onOrder,
}: MenuScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const suppressNavigateUntilRef = useRef(0)
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startTop: 0,
    dragging: false,
  })

  const handleCardPress = useCallback(
    (drinkId: string) => {
      if (Date.now() < suppressNavigateUntilRef.current) return
      onNavigate({ view: 'detail', drinkId })
    },
    [onNavigate],
  )

  const handleScrollPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || !scrollRef.current) return
    dragStateRef.current.pointerId = e.pointerId
    dragStateRef.current.startX = e.clientX
    dragStateRef.current.startY = e.clientY
    dragStateRef.current.startTop = scrollRef.current.scrollTop
    dragStateRef.current.dragging = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handleScrollPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current || dragStateRef.current.pointerId !== e.pointerId) return
    const deltaX = e.clientX - dragStateRef.current.startX
    const deltaY = e.clientY - dragStateRef.current.startY
    const localDragY = panelLocalDragY(panelEdge, deltaX, deltaY)
    if (!dragStateRef.current.dragging && Math.abs(localDragY) > 8) {
      dragStateRef.current.dragging = true
      suppressNavigateUntilRef.current = Date.now() + 350
    }
    if (!dragStateRef.current.dragging) return
    const scrollDelta = menuScrollDelta(panelEdge, deltaX, deltaY)
    scrollRef.current.scrollTop = dragStateRef.current.startTop + scrollDelta
    e.preventDefault()
  }, [panelEdge])

  const clearDragState = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== e.pointerId) return
    if (dragStateRef.current.dragging) {
      suppressNavigateUntilRef.current = Date.now() + 250
    }
    dragStateRef.current.pointerId = -1
    dragStateRef.current.dragging = false
  }, [])

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

      <div
        ref={scrollRef}
        className="menu-screen__scroll"
        onPointerDown={handleScrollPointerDown}
        onPointerMove={handleScrollPointerMove}
        onPointerUp={clearDragState}
        onPointerCancel={clearDragState}
      >
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
