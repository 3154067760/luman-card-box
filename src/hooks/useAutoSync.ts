import { useEffect, useRef } from 'react'
import { getSyncSettings } from '../lib/syncSettings'
import { tryAutoSync } from '../lib/syncService'

/** 打开页面 / 切回标签页时自动同步 */
export function useAutoSync() {
  const syncing = useRef(false)

  const run = async () => {
    if (syncing.current) return
    syncing.current = true
    try {
      await tryAutoSync()
    } finally {
      syncing.current = false
    }
  }

  useEffect(() => {
    run()

    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)

    const settings = getSyncSettings()
    const intervalMs = 5 * 60 * 1000
    const timer = settings.autoSync ? window.setInterval(run, intervalMs) : undefined

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (timer) window.clearInterval(timer)
    }
  }, [])
}
