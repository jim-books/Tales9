import { getDrinkById } from '../data/drinkCatalog'
import type { UserColor } from '../types'
import { PressableButton } from '../components/PressableButton'
import './screens.css'

interface DrinkDetailModalProps {
  drinkId: string
  userColor: UserColor
  onOrder: (drinkId: string) => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  CLASSICS: 'Classics',
  COFFEE_BASED: 'Coffee Based',
  DESSERT_INSPIRED: 'Dessert Inspired',
}

export function DrinkDetailModal({ drinkId, userColor: _userColor, onOrder, onBack }: DrinkDetailModalProps): JSX.Element {
  const drink = getDrinkById(drinkId)

  if (!drink) {
    return (
      <div className="screen">
        <div className="screen-header">
          <PressableButton className="screen-back" onPress={onBack}>←</PressableButton>
          <span className="screen-header__title">Drink Details</span>
        </div>
        <div className="screen-body">
          <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Drink not found.</p>
          <PressableButton className="btn-secondary" onPress={onBack}>Go Back</PressableButton>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <PressableButton className="screen-back" onPress={onBack}>←</PressableButton>
        <span className="screen-header__title">Drink Details</span>
      </div>
      <div className="screen-body">
        <div className="detail-hero">
          {drink.imageUrl ? (
            <img src={drink.imageUrl} alt={drink.name} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${drink.colorPalette[0]}, ${drink.colorPalette[1]}, ${drink.colorPalette[2]})`,
              }}
            />
          )}
        </div>

        <span className="category-pill">{CATEGORY_LABELS[drink.category] ?? drink.category}</span>
        <div className="detail-name">{drink.name}</div>
        <div className="detail-flavor">{drink.flavorProfile}</div>

        <div className="detail-label">Ingredients</div>
        <ul className="detail-ingredients">
          {drink.ingredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>

        <div className="detail-price">${drink.price}</div>
        <p className="detail-description">{drink.description}</p>

        <PressableButton className="btn-primary" onPress={() => onOrder(drink.id)}>
          Order This Drink
        </PressableButton>
        <PressableButton className="btn-ghost" onPress={onBack}>
          ← Back to Menu
        </PressableButton>
      </div>
    </div>
  )
}
