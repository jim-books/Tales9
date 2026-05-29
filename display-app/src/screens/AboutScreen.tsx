import type { UserColor } from '../types'
import { usePressAction } from './usePressAction'
import './screens.css'

interface AboutScreenProps {
  userColor: UserColor
  onBack: () => void
}

const OPENING_HOURS = [
  { days: 'Tuesday – Thursday', hours: '6:00 PM – 2:00 AM' },
  { days: 'Friday – Saturday', hours: '6:00 PM – 2:00 AM' },
  { days: 'Sunday', hours: '6:00 PM – 12:00 AM' },
  { days: 'Monday', hours: 'Closed' },
]

export function AboutScreen({ userColor: _userColor, onBack }: AboutScreenProps): JSX.Element {
  const { makePressHandlers } = usePressAction()

  return (
    <div className="panel-page about-screen">
      <div className="panel-brand">
        <div className="panel-brand__name">BARCODE</div>
      </div>

      <div className="panel-page__content">
        <h2 className="panel-page__title">About Barcode</h2>

        <div className="panel-page__body about-screen__sections">
          <section className="about-block">
            <h3 className="about-block__heading about-block__heading--cyan">Our Story</h3>
            <div className="about-block__body">
              <p>
                Barcode is an immersive mixology lounge where craft cocktails meet interactive
                art. Every drink unlocks pixel-perfect visuals on the table — a blend of
                artisanal bartending and cutting-edge hospitality designed for memorable evenings.
              </p>
            </div>
          </section>

          <section className="about-block">
            <h3 className="about-block__heading about-block__heading--red">Opening Hours</h3>
            <ul className="about-hours">
              {OPENING_HOURS.map((row) => (
                <li key={row.days} className="about-hours__row">
                  <span className="about-hours__days">{row.days}</span>
                  <span className="about-hours__time">{row.hours}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <button
          type="button"
          className="panel-page__exit"
          {...makePressHandlers<HTMLButtonElement>(onBack)}
        >
          ← Return to Main
        </button>
      </div>
    </div>
  )
}
