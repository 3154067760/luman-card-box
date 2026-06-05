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
import { schedulePushSync } from '../lib/syncService'
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
    try {
      const updated = await updateCard(card.id, draft)
      setCard(updated)
      setEditing(false)
      schedulePushSync()
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!card) return
    if (!confirm(`确定删除卡片 ${card.number}？此操作不可恢复。`)) return
    try {
      await deleteCard(card.id)
      schedulePushSync()
      navigate('/tree')
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const spawn = async (mode: 'sibling' | 'child') => {
    try {
      const created = await createCard({ mode, refNumber: number })
      schedulePushSync()
      navigate(`/card/${created.number}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    }
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
          <LinkPanel title="本卡引用" cards={forward} />
          <LinkPanel title="被其它卡引用" cards={backward} />
          {!forward.length && !backward.length && (
            <p className="muted sidebar-hint">编辑正文，写入 [[编号]] 建立引用；其它卡写 [[{card.number}]] 会出现在下方</p>
          )}
        </aside>
      </div>
    </div>
  )
}
