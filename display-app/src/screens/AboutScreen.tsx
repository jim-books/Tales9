import type { UserColor } from '../types'
import './screens.css'

interface AboutScreenProps {
  userColor: UserColor
  onBack: () => void
}

const SECTIONS = [
  {
    heading: 'Our Story',
    body: 'Barcode opened in Central, Hong Kong with a single mission: to reimagine how people experience cocktails. Born from a love of craftsmanship and cutting-edge hospitality, we blended artisanal drink-making with interactive technology to create something entirely new.',
  },
  {
    heading: 'Our Philosophy',
    body: 'We believe the best cocktail is more than a drink — it\'s a memory. Every recipe is designed to surprise and delight, using premium ingredients and precise technique. We source locally where possible and collaborate with regional distilleries to bring you flavours unique to Barcode.',
  },
  {
    heading: 'What Makes Us Different',
    body: 'The table you\'re sitting at is intelligent. Capacitive sensors beneath the surface detect the unique signature of each coaster, triggering animations and stories tied to your drink. Order through your personal interface, watch your drink come to life as it arrives, and let the table become part of your evening.',
  },
]

export function AboutScreen({ userColor: _userColor, onBack }: AboutScreenProps): JSX.Element {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="screen-back" onClick={onBack}>←</button>
        <span className="screen-header__title">About</span>
      </div>
      <div className="screen-body">
        {SECTIONS.map((s) => (
          <div key={s.heading} className="about-section">
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
