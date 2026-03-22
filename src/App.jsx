import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import FactionPage from './pages/FactionPage.jsx'
import BoxPage from './pages/BoxPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/faction/:factionId" element={<FactionPage />} />
          <Route path="/faction/:factionId/box/:boxId" element={<BoxPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
