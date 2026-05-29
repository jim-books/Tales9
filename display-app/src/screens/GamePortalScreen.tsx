import type { GameType, UserColor } from '../types'
import { usePressAction } from './usePressAction'
import './screens.css'

interface GamePortalScreenProps {
  userColor: UserColor
  onBack: () => void
  onStartGame: (type: GameType) => void
}

export function GamePortalScreen({ userColor: _userColor, onBack, onStartGame }: GamePortalScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()

  return (
    <div className="panel-page game-screen">
      <div className="panel-brand">
        <div className="panel-brand__name">BARCODE</div>
      </div>

      <div className="panel-page__content">
        <div className="panel-page__body game-screen__main">
          <h2 className="panel-page__title">Table Games</h2>
          <p className="panel-page__subtitle">
            Place your smart coasters together to link up and play.
          </p>

          <div className="game-screen__cards">
          <button
            type="button"
            className="game-card game-card--cyan"
            {...makePressHandlers<HTMLButtonElement>(() => onStartGame('truth_or_dare'))}
          >
            <span className="game-card__title">Truth or Dare</span>
            <span className="game-card__sub">Spill secrets or take the challenge</span>
          </button>

          <button
            type="button"
            className="game-card game-card--red"
            {...makePressHandlers<HTMLButtonElement>(() => onStartGame('kings_game'))}
          >
            <span className="game-card__title">King&apos;s Game</span>
            <span className="game-card__sub">The classic drinking game</span>
          </button>
        </div>
        </div>

        <button
          type="button"
          className="panel-page__exit"
          {...makePressHandlers<HTMLButtonElement>(onBack)}
        >
          ← Leave Arcade
        </button>
      </div>
    </div>
  )
}
