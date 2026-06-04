import { useEffect, useState } from 'react'
import { checkSyncHealth, syncNow, SyncError } from '../lib/syncService'
import { getSyncSettings, saveSyncSettings } from '../lib/syncSettings'
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
    checkSyncHealth().then(setServerOk)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { cardCount } = await syncNow()
      refreshSettings()
      onMessage(`已同步到服务器，共 ${cardCount} 张卡片`)
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
      <h2>同步到服务器</h2>
      <p className="muted">
        本机 IndexedDB 仍是日常读写来源。点「同步到服务器」会把卡片与服务器上的数据<strong>自动合并</strong>（较新的覆盖较旧的），手机 / 电脑打开同一网站即可互通，无需密钥。
      </p>

      {serverOk === false && (
        <p className="sync-hint err">当前无法连接同步服务，请确认在服务器站点打开（如 http://39.105.176.96:3005）</p>
      )}
      {serverOk === true && <p className="sync-hint ok">服务器在线，可以同步</p>}

      <label className="field sync-toggle">
        <span>打开页面时自动同步</span>
        <input
          type="checkbox"
          checked={settings.autoSync}
          onChange={(e) => {
            saveSyncSettings({ autoSync: e.target.checked })
            refreshSettings()
          }}
        />
      </label>

      <div className="settings-actions">
        <button type="button" className="btn btn-primary" disabled={syncing} onClick={handleSync}>
          {syncing ? '同步中…' : '同步到服务器'}
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
    </section>
  )
}
