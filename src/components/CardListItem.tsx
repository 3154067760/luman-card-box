import { Link } from 'react-router-dom'
import type { Card } from '../types/card'

interface CardListItemProps {
  card: Card
  showExcerpt?: boolean
}

export function CardListItem({ card, showExcerpt = true }: CardListItemProps) {
  const excerpt = card.body.replace(/\[\[([0-9a-z]+)\]\]/gi, '$1').slice(0, 120)

  return (
    <Link to={`/card/${card.number}`} className="card-list-item">
      <span className="card-number">{card.number}</span>
      <div className="card-list-content">
        {card.title && <strong className="card-title">{card.title}</strong>}
        {showExcerpt && card.body && <p className="card-excerpt">{excerpt}{card.body.length > 120 ? '…' : ''}</p>}
      </div>
    </Link>
  )
}

interface LinkPanelProps {
  title: string
  cards: Card[]
}

export function LinkPanel({ title, cards }: LinkPanelProps) {
  if (!cards.length) return null

  return (
    <section className="link-panel">
      <h3>{title}</h3>
      <ul className="link-list">
        {cards.map((c) => (
          <li key={c.id}>
            <Link to={`/card/${c.number}`}>
              <span className="card-number sm">{c.number}</span>
              {c.title || c.body.slice(0, 40) || '（空）'}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
