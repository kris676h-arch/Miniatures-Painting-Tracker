import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import Layout from './components/Layout.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import FactionPage from './pages/FactionPage.jsx'
import BoxPage from './pages/BoxPage.jsx'
import AuthPage from './pages/AuthPage.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (!session) return <AuthPage />

  return (
    <BrowserRouter>
      <Layout session={session}>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/faction/:factionId" element={<FactionPage />} />
          <Route path="/faction/:factionId/box/:boxId" element={<BoxPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}