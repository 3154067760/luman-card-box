import { applySyncPayload, mergeSyncPayloads } from './merge'
import { exportSyncPayload } from './cardService'
import {
  getDeviceId,
  getSyncApiBase,
  getSyncSettings,
  saveSyncSettings,
} from './syncSettings'
import type { SyncPayload } from '../types/card'

export class SyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncError'
  }
}

async function fetchRemote(base: string, syncKey: string): Promise<SyncPayload | null> {
  const res = await fetch(`${base}/api/sync`, {
    headers: { 'X-Sync-Key': syncKey },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new SyncError(text || `拉取失败 (${res.status})`)
  }
  const data = (await res.json()) as SyncPayload
  if (!data || data.version !== 1) throw new SyncError('云端数据格式无效')
  return { ...data, tombstones: data.tombstones ?? [] }
}

async function pushRemote(base: string, syncKey: string, payload: SyncPayload): Promise<void> {
  const res = await fetch(`${base}/api/sync`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Sync-Key': syncKey,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new SyncError(text || `上传失败 (${res.status})`)
  }
}

export async function checkSyncHealth(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/sync/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

/** 拉取云端 → 与本地合并 → 写回本地 → 上传合并结果 */
export async function syncNow(): Promise<{ merged: SyncPayload; cardCount: number }> {
  const settings = getSyncSettings()
  if (!settings.syncKey.trim()) {
    throw new SyncError('请先设置同步密钥')
  }

  const base = getSyncApiBase(settings.syncUrl)
  if (!base) throw new SyncError('无法确定同步服务器地址')

  const local = await exportSyncPayload()
  local.deviceId = getDeviceId()

  const remote = await fetchRemote(base, settings.syncKey.trim())
  const merged = remote ? mergeSyncPayloads(local, remote) : local
  merged.deviceId = getDeviceId()
  merged.exportedAt = new Date().toISOString()

  await applySyncPayload(merged)
  await pushRemote(base, settings.syncKey.trim(), merged)

  saveSyncSettings({
    lastSyncAt: Date.now(),
    lastSyncStatus: 'ok',
    lastSyncMessage: `已同步 ${merged.cards.length} 张卡片`,
  })

  return { merged, cardCount: merged.cards.length }
}

export async function tryAutoSync(): Promise<void> {
  const settings = getSyncSettings()
  if (!settings.enabled || !settings.autoSync || !settings.syncKey.trim()) return

  try {
    await syncNow()
  } catch (err) {
    saveSyncSettings({
      lastSyncStatus: 'error',
      lastSyncMessage: err instanceof Error ? err.message : '同步失败',
    })
  }
}
