import { useAppStore } from '../store/useAppStore'
import { CANVAS_SIZE } from '../engine/CalibrationMapper'

const px = (n: number): string => Math.round(n).toString()

/**
 * DiagnosticsOverlay
 *
 * Developer debug panel showing live system state.
 * Toggle with the 'D' key (handled in App.tsx).
 */
export function DiagnosticsOverlay(): JSX.Element {
  const sessionActive = useAppStore((s) => s.sessionActive)
  const userNodes = useAppStore((s) => s.userNodes)
  const coasters = useAppStore((s) => s.coasters)
  const gameState = useAppStore((s) => s.gameState)
  const orders = useAppStore((s) => s.orders)

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        zIndex: 20,
        background: 'rgba(0,0,0,0.82)',
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: 13,
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid #00ff8866',
        lineHeight: 1.7,
        pointerEvents: 'none',
        maxWidth: 440,
        whiteSpace: 'pre',
      }}
    >
      {'─── DIAGNOSTICS (D to hide) ───────────────\n'}
      {`Canvas:   ${CANVAS_SIZE}×${CANVAS_SIZE}px\n`}
      {`Session:  ${sessionActive ? 'ACTIVE' : 'STANDBY'}  users=${userNodes.length}\n`}
      {`Game:     ${gameState ? `${gameState.type}  phase=${gameState.phase}  chosen=${gameState.chosenUserId ?? '—'}` : 'none'}\n`}
      {'─── Coasters ───────────────────────────────\n'}
      {coasters.length === 0
        ? '  (none)\n'
        : coasters.map((c) =>
            `  [${c.id}] ${c.detected ? '◉' : '○'}  ` +
            `pos=(${px(c.centroid.x)},${px(c.centroid.y)})  ` +
            `drink=${c.drinkId ?? '—'}\n`,
          )}
      {'─── User Nodes ─────────────────────────────\n'}
      {userNodes.length === 0
        ? '  (none)\n'
        : userNodes.map((n) =>
            `  [${n.id}] ${n.color}  ` +
            `pos=(${px(n.position.x * CANVAS_SIZE)},${px(n.position.y * CANVAS_SIZE)})  ` +
            `panel=${n.panelOpen ? 'open' : 'closed'}\n`,
          )}
      {'─── Orders ─────────────────────────────────\n'}
      {orders.length === 0
        ? '  (none)\n'
        : orders.map((o) =>
            `  [${o.id}] user=${o.userId}  drink=${o.drinkId}  status=${o.status}\n`,
          )}
    </div>
  )
}
