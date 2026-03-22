import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Tjek din email og bekræft din konto!')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border-bright)', padding:'40px', width:'100%', maxWidth:'400px' }}>
        <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:'1.8rem', color:'var(--gold2)', textAlign:'center', marginBottom:'8px', letterSpacing:'0.1em' }}>⚔ MINIATURE TRACKER</h1>
        <p style={{ textAlign:'center', color:'var(--text-dim)', fontStyle:'italic', marginBottom:'32px' }}>Din hær. Din fremgang. Din ære.</p>

        <div style={{ display:'flex', marginBottom:'24px', border:'1px solid var(--border)' }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:'10px', border:'none', cursor:'pointer',
              background: mode === m ? 'rgba(200,150,42,0.12)' : 'transparent',
              color: mode === m ? 'var(--gold2)' : 'var(--text-dim)',
              fontFamily:"'Cinzel',serif", fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase',
              borderBottom: mode === m ? '2px solid var(--gold)' : '2px solid transparent',
              transition:'all 0.2s'
            }}>{m === 'login' ? 'Log ind' : 'Opret konto'}</button>
          ))}
        </div>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'6px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@email.dk" />
        </div>
        <div style={{ marginBottom:'24px' }}>
          <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'6px' }}>Adgangskode</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div style={{ background:'rgba(196,48,48,0.15)', border:'1px solid var(--red2)', color:'var(--red-bright)', padding:'10px 14px', marginBottom:'16px', fontSize:'0.88rem' }}>{error}</div>}
        {message && <div style={{ background:'rgba(42,140,66,0.15)', border:'1px solid var(--green2)', color:'var(--green-bright)', padding:'10px 14px', marginBottom:'16px', fontSize:'0.88rem' }}>{message}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'12px', border:'1px solid var(--gold)', cursor:'pointer',
          background:'rgba(200,150,42,0.12)', color:'var(--gold2)',
          fontFamily:"'Cinzel',serif", fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase',
          transition:'all 0.2s', opacity: loading ? 0.6 : 1
        }}>{loading ? '...' : mode === 'login' ? 'Log ind' : 'Opret konto'}</button>
      </div>
    </div>
  )
}