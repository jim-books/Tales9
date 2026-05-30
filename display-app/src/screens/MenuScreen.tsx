import { useCallback, useEffect, useRef, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor, UserEdge } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { menuScrollDelta, panelLocalDragY } from './menuScroll'
import { usePressAction } from './usePressAction'
import './screens.css'

interface MenuScreenProps {
  userColor: UserColor
  panelEdge: UserEdge
  menuEntrySuppressUntil: number
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

interface ScrollDragState {
  activeId: number
  startX: number
  startY: number
  startTop: number
  dragging: boolean
  inputType: 'pointer' | 'touch' | 'none'
}

const INITIAL_DRAG_STATE: ScrollDragState = {
  activeId: -1,
  startX: 0,
  startY: 0,
  startTop: 0,
  dragging: false,
  inputType: 'none',
}

export function MenuScreen({
  userColor: _userColor,
  panelEdge,
  menuEntrySuppressUntil,
  onNavigate,
  onOrder: _onOrder,
}: MenuScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const panelEdgeRef = useRef(panelEdge)
  const suppressNavigateUntilRef = useRef(0)
  const dragStateRef = useRef<ScrollDragState>({ ...INITIAL_DRAG_STATE })

  panelEdgeRef.current = panelEdge

  const applyScrollDrag = useCallback((clientX: number, clientY: number) => {
    const scrollEl = scrollRef.current
    const drag = dragStateRef.current
    if (!scrollEl || drag.inputType === 'none') return

    const deltaX = clientX - drag.startX
    const deltaY = clientY - drag.startY
    const localDragY = panelLocalDragY(panelEdgeRef.current, deltaX, deltaY)

    if (!drag.dragging && Math.abs(localDragY) > 8) {
      drag.dragging = true
      suppressNavigateUntilRef.current = Date.now() + 450
    }
    if (!drag.dragging) return

    const scrollDelta = menuScrollDelta(panelEdgeRef.current, deltaX, deltaY)
    scrollEl.scrollTop = drag.startTop + scrollDelta
  }, [])

  const beginScrollDrag = useCallback(
    (inputType: 'pointer' | 'touch', activeId: number, clientX: number, clientY: number) => {
      if (!scrollRef.current) return
      dragStateRef.current = {
        activeId,
        startX: clientX,
        startY: clientY,
        startTop: scrollRef.current.scrollTop,
        dragging: false,
        inputType,
      }
    },
    [],
  )

  const endScrollDrag = useCallback((inputType: 'pointer' | 'touch', activeId: number) => {
    const drag = dragStateRef.current
    if (drag.inputType !== inputType || drag.activeId !== activeId) return
    if (drag.dragging) {
      suppressNavigateUntilRef.current = Date.now() + 450
    }
    dragStateRef.current = { ...INITIAL_DRAG_STATE }
  }, [])

  const handleCardPress = useCallback(
    (drinkId: string) => {
      const now = Date.now()
      if (dragStateRef.current.dragging) return
      if (now < suppressNavigateUntilRef.current || now < menuEntrySuppressUntil) return
      onNavigate({ view: 'detail', drinkId })
    },
    [menuEntrySuppressUntil, onNavigate],
  )

  const handleScrollPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' || !scrollRef.current) return
      beginScrollDrag('pointer', e.pointerId, e.clientX, e.clientY)
    },
    [beginScrollDrag],
  )

  const handleScrollPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current
      if (drag.inputType !== 'pointer' || drag.activeId !== e.pointerId) return
      applyScrollDrag(e.clientX, e.clientY)
      if (drag.dragging) e.preventDefault()
    },
    [applyScrollDrag],
  )

  const handleScrollPointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endScrollDrag('pointer', e.pointerId)
    },
    [endScrollDrag],
  )

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.changedTouches[0]
      if (!touch) return
      beginScrollDrag('touch', touch.identifier, touch.clientX, touch.clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      const drag = dragStateRef.current
      if (drag.inputType !== 'touch') return
      const touch = Array.from(e.touches).find((t) => t.identifier === drag.activeId)
      if (!touch) return
      applyScrollDrag(touch.clientX, touch.clientY)
      if (dragStateRef.current.dragging) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        endScrollDrag('touch', touch.identifier)
      }
    }

    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true })
    scrollEl.addEventListener('touchmove', onTouchMove, { passive: false })
    scrollEl.addEventListener('touchend', onTouchEnd, { passive: true })
    scrollEl.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      scrollEl.removeEventListener('touchstart', onTouchStart)
      scrollEl.removeEventListener('touchmove', onTouchMove)
      scrollEl.removeEventListener('touchend', onTouchEnd)
      scrollEl.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [applyScrollDrag, beginScrollDrag, endScrollDrag])

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
        onPointerUp={handleScrollPointerEnd}
        onPointerCancel={handleScrollPointerEnd}
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
