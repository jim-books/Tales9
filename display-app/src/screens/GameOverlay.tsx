import { useAppStore } from '../store/useAppStore'

const COLOR_MAP: Record<string, string> = {
  blue:   '#3d8bff',
  green:  '#3dff8b',
  orange: '#ff8b3d',
  purple: '#a03dff',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  pointerEvents: 'none',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 20, 0.88)',
  border: '2px solid rgba(255,255,255,0.18)',
  borderRadius: 24,
  padding: '40px 56px',
  textAlign: 'center',
  color: '#ffffff',
  fontFamily: '"Inter", system-ui, sans-serif',
  pointerEvents: 'auto',
  maxWidth: 520,
}

const headingStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 800,
  letterSpacing: '0.04em',
  margin: 0,
  lineHeight: 1.1,
}

const subStyle: React.CSSProperties = {
  fontSize: 22,
  opacity: 0.65,
  marginBottom: 32,
  marginTop: 10,
}

const btnRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  justifyContent: 'center',
}

function btn(label: string, color: string, onClick: () => void): JSX.Element {
  return (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '14px 44px',
        borderRadius: 12,
        border: `2px solid ${color}`,
        background: 'transparent',
        color,
        fontSize: 20,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </button>
  )
}

/**
 * GameOverlay
 *
 * Full-canvas React overlay shown after the PixiJS animation completes (phase ≥ 1).
 * Displays the game result and action buttons centred in the CommonSpace.
 */
export function GameOverlay(): JSX.Element | null {
  const gameState = useAppStore((s) => s.gameState)
  const userNodes = useAppStore((s) => s.userNodes)
  const endGame = useAppStore((s) => s.endGame)

  if (!gameState || gameState.phase < 1) return null

  const chosenNode = userNodes.find((n) => n.id === gameState.chosenUserId)
  const userColor = chosenNode ? COLOR_MAP[chosenNode.color] ?? '#ffffff' : '#ffffff'
  const userLabel = chosenNode ? chosenNode.color.toUpperCase() : 'A PLAYER'

  if (gameState.type === 'truth_or_dare') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <p style={{ ...subStyle, color: userColor, opacity: 1, marginBottom: 6 }}>
            {userLabel} — it's your turn
          </p>
          <h2 style={headingStyle}>TRUTH OR DARE?</h2>
          <p style={subStyle}>Choose wisely…</p>
          <div style={btnRowStyle}>
            {btn('TRUTH', '#3d8bff', endGame)}
            {btn('DARE',  '#ff3344', endGame)}
          </div>
        </div>
      </div>
    )
  }

  // King's Game
  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>♛</div>
        <p style={{ ...subStyle, marginBottom: 4 }}>THE KING IS…</p>
        <h2 style={{ ...headingStyle, color: userColor }}>{userLabel}</h2>
        <p style={subStyle}>Your decree awaits</p>
        <div style={btnRowStyle}>
          {btn('RULE!', userColor, endGame)}
        </div>
      </div>
    </div>
  )
}
