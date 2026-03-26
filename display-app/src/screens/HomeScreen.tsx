import type { UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import './screens.css'

interface HomeScreenProps {
  userColor: UserColor
  onNavigate: (screen: PanelScreen) => void
}

const CARDS = [
  {
    view: 'about' as const,
    title: 'About the Bar',
    sub: 'Learn about Barcode and our story',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
        <path d="M12 3v18" />
        <path d="M4 9h16" />
      </svg>
    ),
  },
  {
    view: 'quiz' as const,
    title: 'Take a Quiz',
    sub: 'Find your perfect drink based on your mood',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    view: 'menu' as const,
    title: 'Menu',
    sub: 'Browse our full selection of drinks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
  },
]

export function HomeScreen({ onNavigate }: HomeScreenProps): JSX.Element {
  return (
    <div className="home-screen">
      <div className="home-logo">
        <div className="home-logo__name">BARCODE</div>
        <div className="home-logo__tagline">WHERE EVERY DRINK TELLS A STORY</div>
      </div>

      <div className="home-cards">
        {CARDS.map((card) => (
          <button
            key={card.view}
            className="home-card"
            onClick={() => onNavigate({ view: card.view })}
          >
            <span className="home-card__icon">{card.icon}</span>
            <span className="home-card__text">
              <span className="home-card__title">{card.title}</span>
              <span className="home-card__sub">{card.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
