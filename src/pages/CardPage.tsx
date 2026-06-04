import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardBody, WikiLinkHint } from '../components/CardBody'
import { LinkPanel } from '../components/CardListItem'
import {
  createCard,
  deleteCard,
  getBackwardLinks,
  getCardByNumber,
  getForwardLinks,
  updateCard,
} from '../lib/cardService'
import type { Card } from '../types/card'

export function CardPage() {
  const { number = '' } = useParams()
  const navigate = useNavigate()
  const [card, setCard] = useState<Card | null>(null)
  const [forward, setForward] = useState<Card[]>([])
  const [backward, setBackward] = useState<Card[]>([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', body: '', source: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = async () => {
    const c = await getCardByNumber(number)
    if (!c) {
      setNotFound(true)
      return
    }
    setNotFound(false)
    setCard(c)
    setDraft({
      title: c.title,
      body: c.body,
      source: c.source,
      note: c.note,
    })
    const [f, b] = await Promise.all([getForwardLinks(c.id), getBackwardLinks(c.id)])
    setForward(f)
    setBackward(b)
  }

  useEffect(() => {
    load()
  }, [number])

  const save = async () => {
    if (!card) return
    setSaving(true)
    const updated = await updateCard(card.id, draft)
    setCard(updated)
    setEditing(false)
    setSaving(false)
    await load()
  }

  const remove = async () => {
    if (!card) return
    if (!confirm(`确定删除卡片 ${card.number}？此操作不可恢复。`)) return
    await deleteCard(card.id)
    navigate('/tree')
  }

  const spawn = async (mode: 'sibling' | 'child') => {
    const created = await createCard({ mode, refNumber: number })
    navigate(`/card/${created.number}`)
  }

  if (notFound) {
    return (
      <div className="page">
        <div className="panel">
          <h2>未找到卡片 {number}</h2>
          <Link to="/card/new" className="btn btn-primary">
            新建卡片
          </Link>
        </div>
      </div>
    )
  }

  if (!card) {
    return <div className="page muted">加载中…</div>
  }

  return (
    <div className="page card-page">
      <header className="card-header panel">
        <div className="card-header-top">
          <span className="card-number lg">{card.number}</span>
          <div className="card-actions">
            {!editing ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
                  编辑
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => spawn('sibling')}>
                  同级续写
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => spawn('child')}>
                  下级分支
                </button>
                <button type="button" className="btn btn-danger" onClick={remove}>
                  删除
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? '保存中…' : '保存'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                  取消
                </button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <input
            className="input title-input"
            placeholder="短标题（可选）"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        ) : (
          card.title && <h2 className="card-page-title">{card.title}</h2>
        )}
      </header>

      <div className="card-layout">
        <article className="panel card-main">
          {editing ? (
            <>
              <label className="field">
                <span>正文 · 一卡一事</span>
                <textarea
                  className="textarea"
                  rows={14}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
              </label>
              <WikiLinkHint />
              <label className="field">
                <span>文献来源</span>
                <input
                  className="input"
                  value={draft.source}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                />
              </label>
              <label className="field">
                <span>备注</span>
                <textarea
                  className="textarea"
                  rows={3}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                />
              </label>
            </>
          ) : (
            <>
              <CardBody body={card.body} />
              {card.source && (
                <p className="meta-line">
                  <strong>文献：</strong>
                  {card.source}
                </p>
              )}
              {card.note && (
                <p className="meta-line">
                  <strong>备注：</strong>
                  {card.note}
                </p>
              )}
            </>
          )}
        </article>

        <aside className="card-sidebar">
          <LinkPanel title="引用 outgoing" cards={forward} />
          <LinkPanel title="被引用 incoming" cards={backward} />
          {!forward.length && !backward.length && (
            <p className="muted sidebar-hint">在正文中写 [[编号]] 与其他卡片建立双向链接</p>
          )}
        </aside>
      </div>
    </div>
  )
}
