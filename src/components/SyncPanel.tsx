import { useEffect, useState } from 'react'
import {
  checkSyncHealth,
  syncNow,
  SyncError,
} from '../lib/syncService'
import {
  generateSyncKey,
  getSyncApiBase,
  getSyncSettings,
  saveSyncSettings,
} from '../lib/syncSettings'
import type { SyncSettings } from '../types/card'

interface SyncPanelProps {
  onMessage: (msg: string) => void
}

export function SyncPanel({ onMessage }: SyncPanelProps) {
  const [settings, setSettings] = useState<SyncSettings>(() => getSyncSettings())
  const [syncing, setSyncing] = useState(false)
  const [serverOk, setServerOk] = useState<boolean | null>(null)

  const refreshSettings = () => setSettings(getSyncSettings())

  useEffect(() => {
    const base = getSyncApiBase(settings.syncUrl)
    if (!base) {
      setServerOk(null)
      return
    }
    checkSyncHealth(base).then(setServerOk)
  }, [settings.syncUrl])

  const patch = (p: Partial<SyncSettings>) => {
    const next = saveSyncSettings(p)
    setSettings(next)
  }

  const handleGenerateKey = () => {
    const key = generateSyncKey()
    patch({ syncKey: key, enabled: true })
    onMessage(`已生成同步密钥，请复制到其他设备`)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      patch({ enabled: true })
      const { cardCount } = await syncNow()
      refreshSettings()
      onMessage(`同步成功，共 ${cardCount} 张卡片`)
    } catch (err) {
      const msg = err instanceof SyncError ? err.message : '同步失败'
      saveSyncSettings({ lastSyncStatus: 'error', lastSyncMessage: msg })
      refreshSettings()
      onMessage(msg)
    } finally {
      setSyncing(false)
    }
  }

  const lastSyncText = settings.lastSyncAt
    ? new Date(settings.lastSyncAt).toLocaleString()
    : '从未同步'

  return (
    <section className="panel">
      <h2>多设备同步</h2>
      <p className="muted">
        数据仍保存在本机 IndexedDB；开启同步后，会用<strong>同一把密钥</strong>把卡片合并到云端，手机 / 电脑 / 平板输入相同密钥即可互通。
      </p>

      <label className="field sync-toggle">
        <span>启用云同步</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
      </label>

      <label className="field">
        <span>同步服务器（留空 = 当前网站域名）</span>
        <input
          className="input"
          placeholder="例如 http://39.105.176.96 或留空"
          value={settings.syncUrl}
          onChange={(e) => patch({ syncUrl: e.target.value })}
        />
        {serverOk === true && <small className="sync-hint ok">服务器在线</small>}
        {serverOk === false && <small className="sync-hint err">无法连接同步服务，请确认 server 已启动</small>}
      </label>

      <label className="field">
        <span>同步密钥（所有设备必须相同）</span>
        <div className="sync-key-row">
          <input
            className="input"
            value={settings.syncKey}
            onChange={(e) => patch({ syncKey: e.target.value.trim() })}
            placeholder="点击右侧生成，或粘贴已有密钥"
          />
          <button type="button" className="btn btn-secondary" onClick={handleGenerateKey}>
            生成密钥
          </button>
        </div>
      </label>

      <label className="field sync-toggle">
        <span>打开页面 / 切回标签时自动同步（每 5 分钟一次）</span>
        <input
          type="checkbox"
          checked={settings.autoSync}
          onChange={(e) => patch({ autoSync: e.target.checked })}
        />
      </label>

      <div className="settings-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={syncing || !settings.syncKey}
          onClick={handleSync}
        >
          {syncing ? '同步中…' : '立即同步'}
        </button>
      </div>

      <p className="sync-meta muted">
        上次同步：{lastSyncText}
        {settings.lastSyncMessage && (
          <>
            {' '}
            ·{' '}
            <span className={settings.lastSyncStatus === 'error' ? 'sync-hint err' : ''}>
              {settings.lastSyncMessage}
            </span>
          </>
        )}
      </p>

      <ol className="tips-list sync-steps">
        <li>在一台设备「生成密钥」并复制</li>
        <li>其它设备设置页粘贴<strong>相同密钥</strong>和<strong>相同服务器地址</strong></li>
        <li>点「立即同步」或开启自动同步</li>
        <li>两边同时改同一张卡时，以<strong>最后更新时间</strong>为准；删除会同步到各端</li>
      </ol>
    </section>
  )
}
