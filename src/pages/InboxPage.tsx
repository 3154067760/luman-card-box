import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCard, deleteCard, getInboxCards, promoteInboxCard, updateCard } from '../lib/cardService'
import { schedulePushSync } from '../lib/syncService'
import type { Card, CreateCardMode } from '../types/card'

export function InboxPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Card[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setItems(await getInboxCards())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const addFlash = async () => {
    const text = draft.trim()
    if (!text) {
      setMsg('请先输入内容')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      await createCard({ mode: 'top', body: text, status: 'inbox' })
      setDraft('')
      await load()
      schedulePushSync()
      setMsg('已存入闪念')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const promote = async (id: string, mode: CreateCardMode) => {
    const card = items.find((c) => c.id === id)
    if (!card) return

    let refNumber: string | undefined
    if (mode !== 'top') {
      refNumber = prompt(mode === 'child' ? '从哪张卡分支？输入编号' : '同级续写参考编号？') ?? ''
      if (!refNumber.trim()) return
    }

    try {
      const published = await promoteInboxCard(id, mode, refNumber?.trim())
      schedulePushSync()
      navigate(`/card/${published.number}`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '转正失败')
    }
  }

  const saveEdit = async (id: string, body: string) => {
    try {
      await updateCard(id, { body })
      await load()
      schedulePushSync()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '保存失败')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('删除这条闪念？')) return
    try {
      await deleteCard(id)
      await load()
      schedulePushSync()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="page">
      <section className="panel">
        <h2>闪念区</h2>
        <p className="muted">
          随手捕获灵感，不必立刻编号。成熟后再转为正式卡片——对应卢曼的临时便签。
        </p>
        <div className="inbox-compose">
          <textarea
            className="textarea"
            rows={4}
            placeholder="此刻的想法…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="button" className="btn btn-primary" disabled={saving} onClick={addFlash}>
            {saving ? '保存中…' : '存入闪念'}
          </button>
        </div>
        {msg && <p className={msg.includes('失败') ? 'sync-hint err' : 'settings-message'}>{msg}</p>}
      </section>

      <section className="panel">
        <h2>待整理 ({items.length})</h2>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : items.length ? (
          <ul className="inbox-list">
            {items.map((item) => (
              <InboxItem
                key={item.id}
                item={item}
                onPromote={promote}
                onSave={saveEdit}
                onDelete={remove}
              />
            ))}
          </ul>
        ) : (
          <p className="muted">闪念区是空的。</p>
        )}
      </section>
    </div>
  )
}

function InboxItem({
  item,
  onPromote,
  onSave,
  onDelete,
}: {
  item: Card
  onPromote: (id: string, mode: CreateCardMode) => void
  onSave: (id: string, body: string) => void
  onDelete: (id: string) => void
}) {
  const [body, setBody] = useState(item.body)
  const [editing, setEditing] = useState(false)

  return (
    <li className="inbox-item">
      {editing ? (
        <>
          <textarea className="textarea" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="inbox-actions">
            <button type="button" className="btn btn-primary" onClick={() => { onSave(item.id, body); setEditing(false) }}>
              保存
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              取消
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="inbox-body">{item.body}</p>
          <div className="inbox-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
              编辑
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onPromote(item.id, 'top')}>
              转为主线
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onPromote(item.id, 'sibling')}>
              同级续写
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onPromote(item.id, 'child')}>
              下级分支
            </button>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(item.id)}>
              删除
            </button>
          </div>
        </>
      )}
    </li>
  )
}
