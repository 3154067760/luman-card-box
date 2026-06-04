import { useEffect } from 'react'
import { loadDemoExamples } from '../lib/loadDemo'

const SEED_KEY = 'zettelkasten-seeded-v2'

/** 首次打开且数据库为空时写入示例 */
export function useSeedDemo() {
  useEffect(() => {
    if (localStorage.getItem(SEED_KEY)) return

    loadDemoExamples().then(({ added }) => {
      if (added > 0) localStorage.setItem(SEED_KEY, '1')
    })
  }, [])
}
