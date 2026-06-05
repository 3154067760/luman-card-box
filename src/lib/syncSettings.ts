import type { SyncSettings } from '../types/card'
import { newId } from './uuid'

const STORAGE_KEY = 'zettelkasten-sync-settings'
const DEVICE_KEY = 'zettelkasten-device-id'

const defaults: SyncSettings = {
  autoSync: true,
  lastSyncAt: 0,
  lastSyncStatus: '',
  lastSyncMessage: '',
}

export function getSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw) as Partial<SyncSettings>
    return { ...defaults, autoSync: parsed.autoSync ?? true, ...parsed }
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
    id = newId()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function getSyncApiBase(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
