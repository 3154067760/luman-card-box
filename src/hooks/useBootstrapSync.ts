import { useEffect, useRef } from 'react'
import { db } from '../db'
import { getSyncSettings } from '../lib/syncSettings'
import { bootstrapFromServer, tryAutoSync } from '../lib/syncService'

/** 启动时从服务器拉数据；之后自动同步 */
export function useBootstrapSync() {
  const ready = useRef(false)
  const syncing = useRef(false)

  const runSync = async () => {
    if (syncing.current) return
    syncing.current = true
    try {
      await tryAutoSync()
    } finally {
      syncing.current = false
    }
  }

  useEffect(() => {
    if (ready.current) return
    ready.current = true

    ;(async () => {
      // 稍延后同步，避免阻塞首屏交互
      await new Promise((r) => setTimeout(r, 800))
      const count = await db.cards.count()
      await bootstrapFromServer(count === 0)
    })()

    const onVisible = () => {
      if (document.visibilityState === 'visible') runSync()
    }
    document.addEventListener('visibilitychange', onVisible)

    const settings = getSyncSettings()
    const timer = settings.autoSync ? window.setInterval(runSync, 5 * 60 * 1000) : undefined

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (timer) window.clearInterval(timer)
    }
  }, [])
}
