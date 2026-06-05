import { applySyncPayload, mergeSyncPayloads } from './merge'
import { exportSyncPayload } from './cardService'
import { getDeviceId, getSyncApiBase, getSyncSettings, saveSyncSettings } from './syncSettings'
import type { SyncPayload } from '../types/card'

export class SyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncError'
  }
}

/** 同步进行中时，本地写入需等待，避免被 applySyncPayload 清空 */
let syncTail: Promise<void> = Promise.resolve()

export function waitForSyncIdle(): Promise<void> {
  return syncTail
}

function runWithSyncLock<T>(fn: () => Promise<T>): Promise<T> {
  const task = syncTail.then(fn)
  syncTail = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

async function fetchRemote(base: string): Promise<SyncPayload | null> {
  const res = await fetch(`${base}/api/sync`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new SyncError(text || `拉取失败 (${res.status})`)
  }
  const data = (await res.json()) as SyncPayload
  if (!data || data.version !== 1) throw new SyncError('服务器数据格式无效')
  return { ...data, tombstones: data.tombstones ?? [] }
}

async function pushRemote(base: string, payload: SyncPayload): Promise<void> {
  const res = await fetch(`${base}/api/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new SyncError(text || `上传失败 (${res.status})`)
  }
}

export async function checkSyncHealth(base?: string): Promise<boolean> {
  const url = base ?? getSyncApiBase()
  if (!url) return false
  try {
    const res = await fetch(`${url}/api/sync/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

/** 拉取服务器 → 与本地合并 → 写回本地 → 上传合并结果 */
export async function syncNow(): Promise<{ merged: SyncPayload; cardCount: number }> {
  return runWithSyncLock(async () => {
    const base = getSyncApiBase()
    if (!base) throw new SyncError('无法确定服务器地址')

    const local = await exportSyncPayload()
    local.deviceId = getDeviceId()

    const remote = await fetchRemote(base)
    const merged = remote?.cards?.length ? mergeSyncPayloads(local, remote) : local
    merged.deviceId = getDeviceId()
    merged.exportedAt = new Date().toISOString()

    await applySyncPayload(merged)
    await pushRemote(base, merged)

    saveSyncSettings({
      lastSyncAt: Date.now(),
      lastSyncStatus: 'ok',
      lastSyncMessage: `已同步 ${merged.cards.length} 张卡片`,
    })

    return { merged, cardCount: merged.cards.length }
  })
}

let pushTimer: ReturnType<typeof setTimeout> | undefined

/** 本地改动后延迟上传到服务器（不依赖「自动同步」开关） */
export function schedulePushSync(): void {
  if (typeof window === 'undefined') return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => {
    pushLocalChanges().catch(() => {})
  }, 1500)
}

/** 保存/删除后上传；失败时写入设置页状态 */
async function pushLocalChanges(): Promise<void> {
  try {
    const ok = await checkSyncHealth()
    if (!ok) return
    await syncNow()
  } catch (err) {
    saveSyncSettings({
      lastSyncStatus: 'error',
      lastSyncMessage: err instanceof Error ? err.message : '上传失败',
    })
  }
}

/** 定时 / 切回页面时的后台同步（需开启自动同步） */
export async function tryAutoSync(): Promise<void> {
  const settings = getSyncSettings()
  if (!settings.autoSync) return

  try {
    const ok = await checkSyncHealth()
    if (!ok) return
    await syncNow()
  } catch (err) {
    saveSyncSettings({
      lastSyncStatus: 'error',
      lastSyncMessage: err instanceof Error ? err.message : '同步失败',
    })
  }
}

/** 启动时：仅在本机无数据时从服务器加载，不再每次打开都全量覆盖 */
export async function bootstrapFromServer(localEmpty: boolean): Promise<void> {
  const base = getSyncApiBase()
  if (!base) return

  return runWithSyncLock(async () => {
    try {
      const ok = await checkSyncHealth(base)
      if (!ok) return

      if (!localEmpty) return

      const remote = await fetchRemote(base)
      if (remote && remote.cards.length > 0) {
        await applySyncPayload({ ...remote, tombstones: remote.tombstones ?? [] })
        saveSyncSettings({
          lastSyncAt: Date.now(),
          lastSyncStatus: 'ok',
          lastSyncMessage: `已从服务器加载 ${remote.cards.length} 张卡片`,
        })
      }
    } catch (err) {
      saveSyncSettings({
        lastSyncStatus: 'error',
        lastSyncMessage: err instanceof Error ? err.message : '同步失败',
      })
    }
  })
}
