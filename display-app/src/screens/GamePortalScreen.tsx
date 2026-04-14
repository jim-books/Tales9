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
    <div className="screen">
      <div className="screen-header">
        <button className="screen-back" {...makePressHandlers<HTMLButtonElement>(onBack)} aria-label="Back to home">
          ←
        </button>
        <span className="screen-header__title" style={{ textAlign: 'center', flex: 1 }}>
          Game
        </span>
      </div>

      <div className="screen-body">
        <div className="game-portal">
          <div className="game-portal__title">Choose a Table Game</div>
          <div className="game-portal__subtitle">
            Launch a shared game in the common space.
          </div>

          <button
            className="game-portal__card"
            {...makePressHandlers<HTMLButtonElement>(() => onStartGame('truth_or_dare'))}
          >
            <span className="game-portal__card-title">Truth or Dare</span>
            <span className="game-portal__card-sub">Spin, pick, and broadcast the challenge.</span>
          </button>

          <button
            className="game-portal__card"
            {...makePressHandlers<HTMLButtonElement>(() => onStartGame('kings_game'))}
          >
            <span className="game-portal__card-title">King&apos;s Game</span>
            <span className="game-portal__card-sub">Crown one player and execute a decree.</span>
          </button>
        </div>
      </div>
    </div>
  )
}
