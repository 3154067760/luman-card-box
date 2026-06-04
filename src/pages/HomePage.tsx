import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardListItem } from '../components/CardListItem'
import { quickStartSteps } from '../lib/demoData'
import { mlQuickStartSteps } from '../lib/mlDemoData'
import { hasDemoCards, hasMLDemoCards, loadDemoExamples, loadMLDemoExamples } from '../lib/loadDemo'
import { getRandomCard, getRecentCards } from '../lib/cardService'
import type { Card } from '../types/card'

export function HomePage() {
  const [recent, setRecent] = useState<Card[]>([])
  const [random, setRandom] = useState<Card | undefined>()
  const [loading, setLoading] = useState(true)
  const [hasDemo, setHasDemo] = useState(false)
  const [hasMLDemo, setHasMLDemo] = useState(false)
  const [demoMsg, setDemoMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const [r, rand, demo, mlDemo] = await Promise.all([
      getRecentCards(),
      getRandomCard(),
      hasDemoCards(),
      hasMLDemoCards(),
    ])
    setRecent(r)
    setRandom(rand)
    setHasDemo(demo)
    setHasMLDemo(mlDemo)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const pickRandom = async () => {
    setRandom(await getRandomCard())
  }

  const handleLoadDemo = async () => {
    const { added } = await loadDemoExamples()
    setDemoMsg(added > 0 ? `已加载 ${added} 条示例` : '示例已在，可直接点击下方步骤浏览')
    await load()
  }

  const handleLoadMLDemo = async () => {
    const { added } = await loadMLDemoExamples()
    setDemoMsg(
      added > 0
        ? `已加载 ${added} 条机器学习示例`
        : 'ML 示例已在，可直接点击下方步骤浏览',
    )
    await load()
  }

  return (
    <div className="page">
      <section className="hero panel">
        <h2>欢迎来到你的第二大脑</h2>
        <p>
          卢曼用卡片盒积累九十万字著述。核心做法：每张卡片只写一件事，用编号延伸思路，用交叉引用织成网络。
        </p>
        <div className="hero-actions">
          <Link to="/card/new" className="btn btn-primary">
            写第一张卡片
          </Link>
          <Link to="/inbox" className="btn btn-secondary">
            记录闪念
          </Link>
          {!hasDemo && (
            <button type="button" className="btn btn-secondary" onClick={handleLoadDemo}>
              加载示例卡片
            </button>
          )}
        </div>
        {demoMsg && <p className="settings-message">{demoMsg}</p>}
      </section>

      <section className="panel quick-start">
        <h2>快速上手 · 跟着示例走一遍</h2>
        <p className="muted">点击下方步骤，体验编号、双向链接、闪念、搜索。</p>
        {!hasDemo && (
          <p className="muted">
            还没有示例？先点上方「加载示例卡片」，或{' '}
            <button type="button" className="btn-inline" onClick={handleLoadDemo}>
              点此加载
            </button>
          </p>
        )}
        <p className="quick-start-extra">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLoadDemo}>
            加载 / 补全全部示例
          </button>
        </p>
        <ol className="quick-start-list">
          {quickStartSteps.map((s) => (
            <li key={s.step}>
              <Link to={s.to} className="quick-start-item">
                <span className="quick-start-num">{s.step}</span>
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.desc}</small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel quick-start ml-quick-start">
        <div className="section-head">
          <h2>机器学习笔记示例</h2>
          {!hasMLDemo && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleLoadMLDemo}>
              加载 ML 示例
            </button>
          )}
        </div>
        <p className="muted">
          14 张正式卡（编号 4–7 主线）+ 2 条 ML 闪念。演示如何用卡片盒记概念、训练、神经网络与论文。
        </p>
        <p className="quick-start-extra">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLoadMLDemo}>
            加载 / 补全 ML 示例
          </button>
        </p>
        <ol className="quick-start-list">
          {mlQuickStartSteps.map((s) => (
            <li key={s.step}>
              <Link to={s.to} className="quick-start-item">
                <span className="quick-start-num">{s.step}</span>
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.desc}</small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>随机碰撞</h2>
          <button type="button" className="btn btn-ghost" onClick={pickRandom}>
            再抽一张
          </button>
        </div>
        {random ? (
          <CardListItem card={random} />
        ) : (
          <p className="muted">还没有正式卡片，先加载示例或写一张吧。</p>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>最近更新</h2>
          <Link to="/tree" className="btn btn-ghost">
            查看目录树
          </Link>
        </div>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : recent.length ? (
          <div className="card-list">
            {recent.map((c) => (
              <CardListItem key={c.id} card={c} />
            ))}
          </div>
        ) : (
          <p className="muted">暂无卡片。</p>
        )}
      </section>
    </div>
  )
}
