import { useAppStore } from '../store/useAppStore'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'
import type { GameType } from '../types'

const px = (n: number): string => Math.round(n).toString()

export interface DebugPanelProps {
  activeCoasterIds: Set<string>
  onStartSession: () => void
  onEndSession: () => void
  onToggleCoaster: (idx: number) => void
  onStartGame: (type: GameType) => void
  onEndGame: () => void
  onClose: () => void
}

/**
 * DebugPanel
 *
 * Combined debug/demo panel showing live system state + action buttons for demo flow.
 * - Session control buttons (start/end)
 * - Coaster toggle buttons (1-4) with active state indicators
 * - Game control buttons (start truth/kings/end)
 * - Full diagnostics display (same as DiagnosticsOverlay)
 */
export function DebugPanel({
  activeCoasterIds,
  onStartSession,
  onEndSession,
  onToggleCoaster,
  onStartGame,
  onEndGame,
  onClose,
}: DebugPanelProps): JSX.Element {
  const sessionActive = useAppStore((s) => s.sessionActive)
  const userNodes = useAppStore((s) => s.userNodes)
  const coasters = useAppStore((s) => s.coasters)
  const gameState = useAppStore((s) => s.gameState)
  const orders = useAppStore((s) => s.orders)

  const DEMO_DRINKS = ['Pisco-Colada', 'Espresso Martini', 'Momo Sour', 'Apple Tart']

  const buttonStyle = (active: boolean) => ({
    padding: '6px 12px',
    margin: '4px 2px',
    border: active ? '1px solid #00ff88' : '1px solid #00ff8844',
    borderRadius: 4,
    background: active ? 'rgba(0,255,136,0.15)' : 'rgba(0,255,136,0.05)',
    color: active ? '#00ff88' : '#00ff88aa',
    fontFamily: 'monospace',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.1s',
    fontWeight: 600,
    textTransform: 'uppercase',
  })

  const actionButtonStyle = {
    padding: '6px 12px',
    margin: '4px 2px',
    border: '1px solid #00ff8866',
    borderRadius: 4,
    background: 'rgba(0,255,136,0.1)',
    color: '#00ff88',
    fontFamily: 'monospace',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.1s',
    fontWeight: 600,
    textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        zIndex: 25,
        background: 'rgba(0,0,0,0.92)',
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: 13,
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid #00ff8866',
        lineHeight: 1.7,
        pointerEvents: 'auto',
        maxWidth: 600,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span>{'── DEBUG PANEL ──────────'}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ff88',
            cursor: 'pointer',
            fontSize: 16,
            padding: 0,
            marginLeft: 12,
          }}
        >
          ✕
        </button>
      </div>

      {/* Session Control */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 4 }}>{'── Session ──'}</div>
        <div>
          <button
            onClick={onStartSession}
            style={{
              ...actionButtonStyle,
              opacity: sessionActive ? 0.5 : 1,
            }}
            disabled={sessionActive}
          >
            ▶ Start Session
          </button>
          <button
            onClick={onEndSession}
            style={{
              ...actionButtonStyle,
              opacity: !sessionActive ? 0.5 : 1,
            }}
            disabled={!sessionActive}
          >
            ■ End Session
          </button>
        </div>
      </div>

      {/* Demo Coasters */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 4 }}>{'── Demo Coasters (1–4) ──'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {DEMO_DRINKS.map((drink, idx) => {
            const id = `demo-coaster-${idx}`
            const isActive = activeCoasterIds.has(id)
            return (
              <button
                key={idx}
                onClick={() => onToggleCoaster(idx)}
                style={buttonStyle(isActive)}
              >
                {idx + 1} {drink}
              </button>
            )
          })}
        </div>
      </div>

      {/* Game Controls */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 4 }}>{'── Games ──'}</div>
        <div>
          <button
            onClick={() => onStartGame('truth_or_dare')}
            style={{
              ...actionButtonStyle,
              opacity: gameState ? 0.5 : 1,
            }}
            disabled={!!gameState}
          >
            T Truth/Dare
          </button>
          <button
            onClick={() => onStartGame('kings_game')}
            style={{
              ...actionButtonStyle,
              opacity: gameState ? 0.5 : 1,
            }}
            disabled={!!gameState}
          >
            K King's Game
          </button>
          <button
            onClick={onEndGame}
            style={{
              ...actionButtonStyle,
              opacity: !gameState ? 0.5 : 1,
            }}
            disabled={!gameState}
          >
            G End Game
          </button>
        </div>
      </div>

      {/* Diagnostics */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #00ff8844',
        }}
      >
        <div>{'─── DIAGNOSTICS ─────────────────────'}</div>
        <div>{`Canvas:   ${CANVAS_SIZE}×${CANVAS_SIZE}px\n`}</div>
        <div>{`Session:  ${sessionActive ? 'ACTIVE' : 'STANDBY'}  users=${userNodes.length}\n`}</div>
        <div>{`Game:     ${gameState ? `${gameState.type}  phase=${gameState.phase}  chosen=${gameState.chosenUserId ?? '—'}` : 'none'}\n`}</div>
        <div>{'─── Coasters ─────────────────────────\n'}</div>
        {coasters.length === 0 ? (
          <div>{'  (none)\n'}</div>
        ) : (
          coasters.map((c) => (
            <div key={c.id}>
              {`  [${c.id}] ${c.detected ? '◉' : '○'}  ` +
                `pos=(${px(c.centroid.x)},${px(c.centroid.y)})  ` +
                `drink=${c.drinkId ?? '—'}\n`}
            </div>
          ))
        )}
        <div>{'─── User Nodes ───────────────────────\n'}</div>
        {userNodes.length === 0 ? (
          <div>{'  (none)\n'}</div>
        ) : (
          userNodes.map((n) => (
            <div key={n.id}>
              {`  [${n.id}] ${n.color}  ` +
                `pos=(${px(n.position.x * CANVAS_SIZE)},${px(n.position.y * CANVAS_SIZE)})  ` +
                `panel=${n.panelOpen ? 'open' : 'closed'}\n`}
            </div>
          ))
        )}
        <div>{'─── Orders ───────────────────────────\n'}</div>
        {orders.length === 0 ? (
          <div>{'  (none)\n'}</div>
        ) : (
          orders.map((o) => (
            <div key={o.id}>
              {`  [${o.id}] user=${o.userId}  drink=${o.drinkId}  status=${o.status}\n`}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
