import type { UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { usePressAction } from './usePressAction'
import './screens.css'

interface HomeScreenProps {
  userColor: UserColor
  onNavigate: (screen: PanelScreen) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()

  return (
    <div className="home-screen">
      <div className="panel-brand">
        <div className="panel-brand__name">BARCODE</div>
      </div>

      <div className="home-actions">
        <button
          className="home-btn home-btn--primary"
          {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'menu' }))}
        >
          <span className="home-btn__title">Menu</span>
          <span className="home-btn__sub">Explore Crafted Cocktails</span>
        </button>

        <div className="home-btn-row">
          <button
            className="home-btn home-btn--secondary"
            {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'game' }))}
          >
            <span className="home-btn__title">Games</span>
            <span className="home-btn__sub">Interactive Play</span>
          </button>
          <button
            className="home-btn home-btn--secondary"
            {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'quiz' }))}
          >
            <span className="home-btn__title">Quiz</span>
            <span className="home-btn__sub">Find Your Drink</span>
          </button>
        </div>

        <button
          className="home-btn home-btn--tertiary"
          {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'about' }))}
        >
          <span className="home-btn__title">About the Bar</span>
        </button>
      </div>
    </div>
  )
}
