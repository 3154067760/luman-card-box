import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import './Layout.css'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/tree', label: '目录树' },
  { to: '/inbox', label: '闪念' },
  { to: '/search', label: '搜索' },
  { to: '/settings', label: '设置' },
]

export function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <span className="layout-mark">Z</span>
          <div>
            <h1>卢曼卡片盒</h1>
            <p className="layout-tagline">一卡一事 · 编号串联 · 双向关联</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '浅色' : '深色'}
        </button>
      </header>

      <nav className="layout-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
        <Link to="/card/new" className="nav-link nav-link-accent">
          新建卡片
        </Link>
      </nav>

      <main className="layout-main">
        <Outlet />
      </main>

      <footer className="layout-footer">
        数据优先保存在本机 · 设置里可「同步到服务器」备份多设备
      </footer>
    </div>
  )
}
