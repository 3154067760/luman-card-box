import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPublishedNumbers } from '../lib/cardService'
import { buildNumberTree, type TreeNode } from '../lib/numbering'

function TreeBranch({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <li className="tree-node" style={{ paddingLeft: depth * 16 }}>
      <Link to={`/card/${node.number}`} className="tree-link">
        <span className="card-number sm">{node.number}</span>
      </Link>
      {node.children.length > 0 && (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeBranch key={child.number} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TreePage() {
  const [roots, setRoots] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllPublishedNumbers().then((nums) => {
      setRoots(buildNumberTree(nums))
      setLoading(false)
    })
  }, [])

  return (
    <div className="page">
      <section className="panel">
        <div className="section-head">
          <h2>目录树</h2>
          <Link to="/card/new" className="btn btn-primary">
            新建主线
          </Link>
        </div>
        <p className="muted">
          按卢曼编号层级浏览：数字主线 → 字母续写 → 数字分支，层层深入。
        </p>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : roots.length ? (
          <ul className="tree-root">
            {roots.map((node) => (
              <TreeBranch key={node.number} node={node} />
            ))}
          </ul>
        ) : (
          <p className="muted">还没有卡片，从主线 1 开始吧。</p>
        )}
      </section>
    </div>
  )
}
