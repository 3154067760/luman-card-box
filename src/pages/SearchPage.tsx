import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardListItem } from '../components/CardListItem'
import { searchCards } from '../lib/cardService'
import type { Card } from '../types/card'

export function SearchPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<Card[]>([])
  const [searched, setSearched] = useState(false)

  const runSearch = async (q: string) => {
    const list = await searchCards(q)
    setResults(list)
    setSearched(true)
  }

  useEffect(() => {
    const q = params.get('q')
    if (q) {
      setQuery(q)
      runSearch(q)
    }
  }, [params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await runSearch(query)
  }

  return (
    <div className="page">
      <section className="panel">
        <h2>搜索</h2>
        <form className="search-bar" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="编号、标题、正文、文献…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            搜索
          </button>
        </form>
      </section>

      {searched && (
        <section className="panel">
          <h2>结果 ({results.length})</h2>
          {results.length ? (
            <div className="card-list">
              {results.map((c) => (
                <CardListItem key={c.id} card={c} />
              ))}
            </div>
          ) : (
            <p className="muted">没有匹配的卡片。</p>
          )}
        </section>
      )}
    </div>
  )
}
