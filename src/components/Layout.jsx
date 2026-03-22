import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { Modal, FormGroup, Btn, BtnRow } from './ui.jsx'

export default function Layout({ children, session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [factions, setFactions] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '⚔', color: '#c43030' })
  const [saving, setSaving] = useState(false)
  const userId = session?.user?.id

  useEffect(() => {
    fetchFactions()
    const channel = supabase.channel('factions-nav')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factions' }, fetchFactions)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchFactions() {
    const { data } = await supabase.from('factions').select('id,name,icon,color').order('sort_order,created_at')
    if (data) setFactions(data)
  }

  async function addFaction() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('factions').insert({ name: form.name.trim(), icon: form.icon || '⚔', color: form.color || '#888899', user_id: userId })
    setSaving(false)
    setAddOpen(false)
    setForm({ name: '', icon: '⚔', color: '#c43030' })
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div>
      <header style={{
        textAlign: 'center', padding: '36px 20px 20px',
        borderBottom: '1px solid var(--border)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)',
          width: '200px', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        }} />
        <h1
          onClick={() => navigate('/')}
          style={{
            fontFamily: "'Cinzel', serif", fontWeight: 900, cursor: 'pointer',
            fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
            color: 'var(--gold2)', letterSpacing: '0.1em', textTransform: 'uppercase',
            textShadow: '0 0 40px rgba(200,150,42,0.3), 0 2px 4px rgba(0,0,0,0.8)',
          }}
        >⚔ Miniature Tracker</h1>
        <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '4px', fontSize: '0.9rem' }}>
          Din hær. Din fremgang. Din ære.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>
          {session?.user?.email}
        </p>
      </header>

      <nav style={{
        display: 'flex', justifyContent: 'center', gap: '6px',
        padding: '16px', flexWrap: 'wrap',
        borderBottom: '1px solid var(--border)',
      }}>
        <NavBtn active={location.pathname === '/'} onClick={() => navigate('/')}>Oversigt</NavBtn>
        {factions.map(f => (
          <NavBtn
            key={f.id}
            active={isActive(`/faction/${f.id}`)}
            onClick={() => navigate(`/faction/${f.id}`)}
          >{f.icon} {f.name}</NavBtn>
        ))}
        <NavBtn onClick={() => setAddOpen(true)}>＋ Fraktion</NavBtn>
        <NavBtn onClick={() => supabase.auth.signOut()}>Log ud</NavBtn>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {children}
      </main>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tilføj Fraktion">
        <FormGroup label="Fraksionsnavn">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="f.eks. Death Guard" onKeyDown={e => e.key === 'Enter' && addFaction()} />
        </FormGroup>
        <FormGroup label="Ikon (emoji)">
          <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="⚔" maxLength={4} />
        </FormGroup>
        <FormGroup label="Farve (hex)">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#c43030" />
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              style={{ width: '44px', height: '40px', padding: '2px', border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer' }} />
          </div>
        </FormGroup>
        <BtnRow>
          <Btn onClick={() => setAddOpen(false)}>Annuller</Btn>
          <Btn variant="primary" onClick={addFaction} disabled={saving}>{saving ? '...' : 'Tilføj'}</Btn>
        </BtnRow>
      </Modal>
    </div>
  )
}

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,150,42,0.08)' : 'var(--bg3)',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        color: active ? 'var(--gold2)' : 'var(--text-dim)',
        fontFamily: "'Cinzel', serif",
        fontSize: '0.72rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '8px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--gold2)'; e.currentTarget.style.borderColor = 'var(--gold-dim)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
    >{children}</button>
  )
}