import { useEffect, useState } from 'react'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** 设置页：手机安装到桌面说明（含华为 Nova 4e） */
export function InstallAppPanel() {
  const [standalone, setStandalone] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    setStandalone(isStandalone())
    setMobile(isMobile())
  }, [])

  if (standalone) {
    return (
      <section className="panel">
        <h2>手机 App</h2>
        <p className="sync-hint ok">当前已从桌面图标打开，可像 App 一样全屏使用。</p>
      </section>
    )
  }

  if (!mobile) {
    return (
      <section className="panel">
        <h2>手机 App（华为 Nova 4e 等）</h2>
        <p className="muted">
          在手机上用浏览器打开本站，选择「添加到主屏幕」即可安装。详细步骤见项目文档{' '}
          <code>docs/INSTALL-NOVA4E.md</code>。
        </p>
      </section>
    )
  }

  const isHuawei = /Huawei|Honor|HONOR|HUAWEI/i.test(navigator.userAgent)

  return (
    <section className="panel">
      <h2>安装到手机桌面</h2>
      <p className="muted">安装后桌面会有「卡片盒」图标，使用体验与 App 相同。</p>
      <ol className="tips-list install-steps">
        {isHuawei ? (
          <>
            <li>点浏览器右上角 <strong>菜单</strong></li>
            <li>选择 <strong>添加至</strong> → <strong>桌面</strong></li>
            <li>确认后从桌面图标打开</li>
          </>
        ) : (
          <>
            <li>点 Chrome 右上角 <strong>⋮</strong></li>
            <li>选择 <strong>添加到主屏幕</strong> 或 <strong>安装应用</strong></li>
            <li>确认后从桌面图标打开</li>
          </>
        )}
      </ol>
      <p className="muted">需联网时数据会自动同步到服务器；也可在下方手动点「同步到服务器」。</p>
    </section>
  )
}
