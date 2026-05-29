import { useCallback, useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
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
