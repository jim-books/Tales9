import { getDrinkById } from '../data/drinkCatalog'
import type { Order, OrderStatus, UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import './screens.css'

interface OrderStatusPanelProps {
  userColor: UserColor
  orders: Order[]
  onNavigate: (screen: PanelScreen) => void
}

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending:    'YOUR DRINK IS BEING PREPARED...',
  preparing:  'YOUR DRINK IS BEING PREPARED...',
  on_the_way: 'YOUR DRINK IS ON THE WAY...',
  arrived:    'YOUR DRINK HAS ARRIVED',
}

type DotClass = 'order-status-dot--preparing' | 'order-status-dot--on-way' | 'order-status-dot--arrived'

const STATUS_DOT: Record<OrderStatus, DotClass> = {
  pending:    'order-status-dot--preparing',
  preparing:  'order-status-dot--preparing',
  on_the_way: 'order-status-dot--on-way',
  arrived:    'order-status-dot--arrived',
}

export function OrderStatusPanel({ userColor: _userColor, orders, onNavigate }: OrderStatusPanelProps): JSX.Element {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="screen-back" onClick={() => onNavigate({ view: 'home' })}>←</button>
        <span className="screen-header__title">Your Orders</span>
      </div>
      <div className="screen-body">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>No orders yet.</p>
            <button className="btn-primary" onClick={() => onNavigate({ view: 'menu' })}>
              Browse Menu
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const drink = getDrinkById(order.drinkId)
            return (
              <div
                key={order.id}
                className="order-card"
                style={{ opacity: order.status === 'arrived' ? 0.65 : 1 }}
              >
                <div className="order-card__name">{drink?.name ?? order.drinkId}</div>
                <div className="order-card__status">
                  <span className={`order-status-dot ${STATUS_DOT[order.status]}`} />
                  <span className="order-status-text">{STATUS_TEXT[order.status]}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
