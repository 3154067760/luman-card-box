import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CardPage } from './pages/CardPage'
import { HomePage } from './pages/HomePage'
import { InboxPage } from './pages/InboxPage'
import { NewCardPage } from './pages/NewCardPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { TreePage } from './pages/TreePage'
import { useSeedDemo } from './hooks/useSeedDemo'
import { useAutoSync } from './hooks/useAutoSync'

function App() {
  useSeedDemo()
  useAutoSync()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tree" element={<TreePage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="card/new" element={<NewCardPage />} />
          <Route path="card/:number" element={<CardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
