import { useState } from 'react'
import { drinkCatalog } from '../data/drinkCatalog'
import type { DrinkCategory, UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
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
            {drink.imageUrl ? (
              <img className="drink-card__image" src={drink.imageUrl} alt={drink.name} />
            ) : (
              <div
                className="drink-card__image-placeholder"
                style={{ background: `linear-gradient(135deg, ${drink.colorPalette[0]}, ${drink.colorPalette[1]})` }}
              />
            )}
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
