import { useRef, useState } from 'react'
import { exportAll, importAll } from '../lib/cardService'
import { loadDemoExamples, loadMLDemoExamples } from '../lib/loadDemo'
import type { ExportBundle } from '../types/card'

export function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const handleExport = async () => {
    const bundle = await exportAll()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zettelkasten-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('已导出 JSON 备份')
  }

  const handleExportMarkdown = async () => {
    const bundle = await exportAll()
    const published = bundle.cards.filter((c) => c.status === 'published')
    const lines = published.map((c) => {
      const parts = [
        `# ${c.number}${c.title ? ` ${c.title}` : ''}`,
        '',
        c.body,
        '',
        c.source ? `文献: ${c.source}` : '',
        c.note ? `备注: ${c.note}` : '',
        '',
        '---',
        '',
      ]
      return parts.filter(Boolean).join('\n')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zettelkasten-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('已导出 Markdown')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const bundle = JSON.parse(text) as ExportBundle
      if (!bundle.cards || bundle.version !== 1) {
        throw new Error('无效的备份文件')
      }
      const replace = confirm('导入方式：确定 = 覆盖现有数据；取消 = 合并导入')
      await importAll(bundle, replace)
      setMessage(replace ? '已覆盖导入' : '已合并导入')
    } catch {
      setMessage('导入失败，请检查文件格式')
    }
    e.target.value = ''
  }

  return (
    <div className="page">
      <section className="panel">
        <h2>备份与恢复</h2>
        <p className="muted">
          数据存在浏览器 IndexedDB 中。清除站点数据会丢失卡片，请定期导出备份。
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            导出 JSON
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExportMarkdown}>
            导出 Markdown
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            导入 JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
        </div>
        {message && <p className="settings-message">{message}</p>}
      </section>

      <section className="panel">
        <h2>示例数据</h2>
        <p className="muted">
          用法示例（编号 1–3）与机器学习笔记（编号 4–7）可分别加载，已有编号会跳过。
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              const { added, skipped } = await loadDemoExamples()
              setMessage(
                added > 0
                  ? `已加载 ${added} 条用法示例（跳过 ${skipped} 条已存在）`
                  : `用法示例已齐全，共跳过 ${skipped} 条`,
              )
            }}
          >
            加载 / 补全用法示例
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              const { added, skipped } = await loadMLDemoExamples()
              setMessage(
                added > 0
                  ? `已加载 ${added} 条 ML 笔记示例（跳过 ${skipped} 条已存在）`
                  : `ML 示例已齐全，共跳过 ${skipped} 条`,
              )
            }}
          >
            加载 / 补全 ML 笔记示例
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>卢曼卡片盒要点</h2>
        <ul className="tips-list">
          <li><strong>一卡一事</strong> — 每张卡片只论证一个命题，便于重组与引用。</li>
          <li><strong>Folgezettel 编号</strong> — 1 → 1a → 1a1，数字与字母交替，延伸而非分类。</li>
          <li><strong>双向链接</strong> — 在正文写 [[编号]]，让想法之间互相指向。</li>
          <li><strong>闪念 → 正式</strong> — 先捕获，后整理，避免打断思考流。</li>
        </ul>
      </section>
    </div>
  )
}
