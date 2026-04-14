import { useAppStore } from '../store/useAppStore'
import { panelAnchorStyleForEdge, panelTransformForEdge } from '../components/UserNode'

const COLOR_MAP: Record<string, string> = {
  blue:   '#3d8bff',
  green:  '#3dff8b',
  orange: '#ff8b3d',
  purple: '#a03dff',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
  pointerEvents: 'none',
}

const POPUP_WIDTH = 240
const POPUP_HEIGHT = 172

const cardStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 20, 0.88)',
  border: '2px solid rgba(255,255,255,0.18)',
  borderRadius: 18,
  padding: '18px 20px',
  textAlign: 'center',
  color: '#ffffff',
  fontFamily: '"Inter", system-ui, sans-serif',
  width: POPUP_WIDTH,
  height: POPUP_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '0.04em',
  margin: 0,
  lineHeight: 1.1,
}

const subStyle: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.65,
  marginBottom: 14,
  marginTop: 6,
  lineHeight: 1.4,
}

const btnRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
  marginTop: 6,
}

function btn(label: string, color: string, onClick: () => void): JSX.Element {
  return (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderRadius: 10,
        border: `2px solid ${color}`,
        background: 'transparent',
        color,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </button>
  )
}

function popupTransformOriginForNode(nodeX: number, edge: 'top' | 'right' | 'bottom' | 'left'): React.CSSProperties['transformOrigin'] {
  switch (edge) {
    case 'top':
    case 'bottom':
      return nodeX <= 0.5 ? 'left center' : 'right center'
    case 'left':
      return 'left center'
    case 'right':
      return 'right center'
  }
}

function popupWrapperSizeForEdge(edge: 'top' | 'right' | 'bottom' | 'left'): React.CSSProperties {
  if (edge === 'left' || edge === 'right') {
    return { width: POPUP_HEIGHT, height: POPUP_WIDTH }
  }
  return { width: POPUP_WIDTH, height: POPUP_HEIGHT }
}

/**
 * GameOverlay
 *
 * Full-canvas React overlay shown after the PixiJS animation completes (phase ≥ 1).
 * Displays per-user notifications next to each node; only the chosen user receives actions.
 */
export function GameOverlay(): JSX.Element | null {
  const gameState = useAppStore((s) => s.gameState)
  const userNodes = useAppStore((s) => s.userNodes)
  const endGame = useAppStore((s) => s.endGame)

  if (!gameState || gameState.phase < 1) return null

  const chosenNode = userNodes.find((n) => n.id === gameState.chosenUserId)
  if (!chosenNode) return null

  const chosenColor = COLOR_MAP[chosenNode.color] ?? '#ffffff'
  const chosenLabel = chosenNode.color.toUpperCase()

  return (
    <div style={overlayStyle}>
      {userNodes.map((node) => {
        const isChosen = node.id === chosenNode.id
        const displayEdge = node.lockedEdge ?? node.viewEdge ?? node.ownerEdge
        const anchorStyle = panelAnchorStyleForEdge(displayEdge, node.position.x)
        const transform = panelTransformForEdge(displayEdge)
        const transformOrigin = popupTransformOriginForNode(node.position.x, displayEdge)
        const wrapperSize = popupWrapperSizeForEdge(displayEdge)
        const accentColor = isChosen ? chosenColor : 'rgba(255,255,255,0.18)'

        const content = gameState.type === 'truth_or_dare'
          ? isChosen
            ? {
                kicker: `${chosenLabel} — it's your turn`,
                title: 'TRUTH OR DARE?',
                body: 'Choose wisely…',
              }
            : {
                kicker: `${chosenLabel} was chosen`,
                title: 'WAIT FOR DECISION',
                body: `${chosenLabel} is deciding between truth and dare.`,
              }
          : isChosen
            ? {
                kicker: 'THE KING IS…',
                title: chosenLabel,
                body: 'Your decree awaits.',
              }
            : {
                kicker: 'THE KING IS…',
                title: chosenLabel,
                body: 'Awaiting the king\'s decree.',
              }

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.position.x * 100}%`,
              top: `${node.position.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                ...anchorStyle,
                ...wrapperSize,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  borderColor: accentColor,
                  boxShadow: isChosen ? `0 0 18px ${chosenColor}33` : 'none',
                  transform,
                  transformOrigin,
                  pointerEvents: isChosen ? 'auto' : 'none',
                }}
              >
                {gameState.type === 'kings_game' && isChosen ? (
                  <div style={{ fontSize: 30, marginBottom: 6 }}>♛</div>
                ) : null}
                <p style={{ ...subStyle, color: isChosen ? chosenColor : '#ffffff', opacity: 1, marginBottom: 6 }}>
                  {content.kicker}
                </p>
                <h2 style={{ ...headingStyle, color: isChosen ? chosenColor : '#ffffff' }}>{content.title}</h2>
                <p style={subStyle}>{content.body}</p>
                {isChosen ? (
                  gameState.type === 'truth_or_dare' ? (
                    <div style={btnRowStyle}>
                      {btn('TRUTH', '#3d8bff', endGame)}
                      {btn('DARE', '#ff3344', endGame)}
                    </div>
                  ) : (
                    <div style={btnRowStyle}>
                      {btn('RULE!', chosenColor, endGame)}
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
