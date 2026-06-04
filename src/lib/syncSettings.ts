import type { SyncSettings } from '../types/card'

const STORAGE_KEY = 'zettelkasten-sync-settings'
const DEVICE_KEY = 'zettelkasten-device-id'

const defaults: SyncSettings = {
  enabled: false,
  syncUrl: '',
  syncKey: '',
  autoSync: true,
  lastSyncAt: 0,
  lastSyncStatus: '',
  lastSyncMessage: '',
}

export function getSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveSyncSettings(patch: Partial<SyncSettings>): SyncSettings {
  const next = { ...getSyncSettings(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function generateSyncKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24)
}

export function getSyncApiBase(syncUrl: string): string {
  const trimmed = syncUrl.trim()
  if (trimmed) return trimmed.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
