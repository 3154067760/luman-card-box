import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { extractWikiNumbers } from '../lib/cardService'

interface CardBodyProps {
  body: string
}

export function CardBody({ body }: CardBodyProps) {
  if (!body.trim()) {
    return <p className="muted">（暂无正文）</p>
  }

  const parts: ReactNode[] = []
  const linkPattern = /\[\[([0-9a-z]+)\]\]/gi
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(linkPattern.source, 'gi')

  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(body.slice(lastIndex, match.index))
    }
    const num = match[1]
    parts.push(
      <Link key={`${num}-${match.index}`} to={`/card/${num}`} className="wiki-link">
        [[{num}]]
      </Link>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < body.length) {
    parts.push(body.slice(lastIndex))
  }

  return (
    <div className="card-body-text">
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </div>
  )
}

export function WikiLinkHint() {
  return (
    <p className="field-hint">
      正文中用 <code>[[1a2]]</code> 引用其他卡片，保存后自动建立双向链接
    </p>
  )
}

export function parseBodyPreview(body: string): string[] {
  return extractWikiNumbers(body)
}
