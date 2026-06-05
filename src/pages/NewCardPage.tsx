import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WikiLinkHint } from '../components/CardBody'
import { allocateNumber, createCard } from '../lib/cardService'
import { schedulePushSync } from '../lib/syncService'
import type { CreateCardMode } from '../types/card'

const modes: { value: CreateCardMode; label: string; desc: string }[] = [
  { value: 'top', label: '新开主线', desc: '独立主题，编号如 1、2、3' },
  { value: 'sibling', label: '同级续写', desc: '延续同一思路，如 1a → 1b' },
  { value: 'child', label: '下级分支', desc: '对某点展开，如 1a → 1a1' },
]

export function NewCardPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const refFromUrl = params.get('ref') ?? ''
  const modeFromUrl = (params.get('mode') as CreateCardMode) || 'top'

  const [mode, setMode] = useState<CreateCardMode>(modeFromUrl)
  const [refNumber, setRefNumber] = useState(refFromUrl)
  const [previewNumber, setPreviewNumber] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refreshPreview = async () => {
    try {
      if (mode === 'top') {
        setPreviewNumber(await allocateNumber('top'))
      } else if (refNumber.trim()) {
        setPreviewNumber(await allocateNumber(mode, refNumber.trim()))
      } else {
        setPreviewNumber('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '编号预览失败')
    }
  }

  useEffect(() => {
    refreshPreview()
  }, [])

  const onModeChange = async (m: CreateCardMode) => {
    setMode(m)
    if (m === 'top') {
      setPreviewNumber(await allocateNumber('top'))
    } else if (refNumber.trim()) {
      setPreviewNumber(await allocateNumber(m, refNumber.trim()))
    }
  }

  const onRefBlur = async () => {
    if (mode !== 'top' && refNumber.trim()) {
      setPreviewNumber(await allocateNumber(mode, refNumber.trim()))
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) {
      setError('请填写正文')
      return
    }
    setSaving(true)
    setError('')
    try {
      const card = await createCard({
        mode,
        refNumber: mode === 'top' ? undefined : refNumber.trim(),
        title,
        body: body.trim(),
        source,
        note,
      })
      schedulePushSync()
      navigate(`/card/${encodeURIComponent(card.number)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <form className="panel form-panel" onSubmit={submit}>
        <h2>新建卡片</h2>
        <p className="muted">每张卡片只承载一个想法。编号由系统按卢曼规则分配。</p>

        <fieldset className="mode-group">
          <legend>编号方式</legend>
          {modes.map((m) => (
            <label key={m.value} className="mode-option">
              <input
                type="radio"
                name="mode"
                checked={mode === m.value}
                onChange={() => onModeChange(m.value)}
              />
              <span>
                <strong>{m.label}</strong>
                <small>{m.desc}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {mode !== 'top' && (
          <label className="field">
            <span>参考编号</span>
            <input
              className="input"
              placeholder="如 1 或 1a"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              onBlur={onRefBlur}
              required
            />
          </label>
        )}

        {previewNumber && (
          <p className="number-preview">
            将分配编号：<span className="card-number">{previewNumber}</span>
          </p>
        )}

        <label className="field">
          <span>短标题（可选）</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="field">
          <span>正文</span>
          <textarea className="textarea" rows={12} value={body} onChange={(e) => setBody(e.target.value)} required />
        </label>
        <WikiLinkHint />

        <label className="field">
          <span>文献来源</span>
          <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
        </label>

        <label className="field">
          <span>备注</span>
          <textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '创建中…' : '创建卡片'}
          </button>
        </div>
        {error && <p className="sync-hint err">{error}</p>}
      </form>
    </div>
  )
}
