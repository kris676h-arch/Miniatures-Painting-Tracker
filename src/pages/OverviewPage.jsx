import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DonutChart, ProgressBar, Spinner, EmptyState, SectionHeader } from '../components/ui.jsx'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null) // { factions: [{...faction, boxes:[{...box, minis:[...]}]}] }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: factions } = await supabase.from('factions').select(`
      id, name, icon, color,
      boxes ( id, name, description,
        miniatures ( id, status )
      )
    `).order('sort_order,created_at')
    setData(factions || [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const allMinis = (data || []).flatMap(f => f.boxes.flatMap(b => b.miniatures))
  const gs = stats(allMinis)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Global + per-faction charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        <ChartCard
          title="⚔ Total"
          done={gs.done} wip={gs.wip} unpainted={gs.unpainted}
          centerText={String(gs.total)}
          onClick={() => {}}
        />
        {(data || []).map(f => {
          const minis = f.boxes.flatMap(b => b.miniatures)
          const fs = stats(minis)
          return (
            <ChartCard
              key={f.id}
              title={`${f.icon} ${f.name}`}
              done={fs.done} wip={fs.wip} unpainted={fs.unpainted}
              centerText={`${Math.round(fs.done / (fs.total || 1) * 100)}%`}
              onClick={() => navigate(`/faction/${f.id}`)}
            />
          )
        })}
      </div>

      <SectionHeader title="Alle Fraktioner" />

      {(!data || data.length === 0) && <EmptyState icon="⚔" text="Ingen fraktioner endnu — tilføj din første via knappen i toppen." />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {(data || []).map(f => <FactionCard key={f.id} faction={f} navigate={navigate} />)}
      </div>
    </div>
  )
}

function stats(minis) {
  const done = minis.filter(m => m.status === 'done').length
  const wip  = minis.filter(m => m.status === 'wip').length
  const unpainted = minis.filter(m => m.status === 'unpainted').length
  return { done, wip, unpainted, total: minis.length }
}

function ChartCard({ title, done, wip, unpainted, centerText, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        padding: '24px 16px 20px', textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-dim)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
    >
      <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:'0.78rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'16px' }}>{title}</h3>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <DonutChart done={done} wip={wip} unpainted={unpainted} size={130} centerText={centerText} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <LegendItem color="#4ac466" label={`${done} færdig`} />
        <LegendItem color="#e8b84b" label={`${wip} i gang`} />
        <LegendItem color="#3a3a4a" label={`${unpainted} umalet`} />
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </div>
  )
}

function FactionCard({ faction: f, navigate }) {
  const [open, setOpen] = useState(true)
  const minis = f.boxes.flatMap(b => b.miniatures)
  const fs = stats(minis)
  const pct = fs.total > 0 ? Math.round(fs.done / fs.total * 100) : 0

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
      >
        <div style={{ width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0, background:`${f.color}22`, border:`1px solid ${f.color}66`, color: f.color }}>
          {f.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1rem', fontWeight:700, color:'var(--text-bright)', letterSpacing:'0.06em' }}>{f.name}</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-dim)', marginTop:'2px' }}>{fs.total} figurer · {pct}% færdig</div>
        </div>
        <span style={{ color:'var(--text-dim)', fontSize:'1rem', transition:'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
      </div>

      {open && (
        <div>
          {f.boxes.map(b => {
            const bt = b.miniatures.length
            const bd = b.miniatures.filter(m => m.status === 'done').length
            const bpct = bt > 0 ? Math.round(bd / bt * 100) : 0
            return (
              <div
                key={b.id}
                onClick={() => navigate(`/faction/${f.id}/box/${b.id}`)}
                style={{ borderBottom:'1px solid var(--border)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight:600, color:'var(--text)', fontSize:'0.95rem' }}>{b.name}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginTop:'2px' }}>{bd}/{bt} malet{b.description ? ' · ' + b.description : ''}</div>
                </div>
                <ProgressBar pct={bpct} />
              </div>
            )
          })}
          {f.boxes.length === 0 && (
            <div style={{ padding: '16px 20px', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.88rem' }}>Ingen bokse endnu</div>
          )}
          <button
            onClick={() => navigate(`/faction/${f.id}`)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'12px', background:'transparent', border:'none', borderTop:'1px dashed var(--border)', color:'var(--text-dim)', fontFamily:"'Crimson Text',serif", fontSize:'0.88rem', cursor:'pointer', transition:'color 0.2s, background 0.2s', letterSpacing:'0.04em' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--gold2)'; e.currentTarget.style.background='rgba(200,150,42,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.background='transparent' }}
          >⚙ Administrér {f.name}</button>
        </div>
      )}
    </div>
  )
}
