import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DonutChart, ProgressBar, Spinner, EmptyState, SectionHeader, Modal, FormGroup, Btn, BtnRow, StatusBadge } from '../components/ui.jsx'

export default function FactionPage() {
  const { factionId } = useParams()
  const navigate = useNavigate()
  const [faction, setFaction] = useState(null)
  const [boxes, setBoxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [addBoxOpen, setAddBoxOpen] = useState(false)
  const [editFactionOpen, setEditFactionOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [boxForm, setBoxForm] = useState({ name: '', description: '' })
  const [factionForm, setFactionForm] = useState({ name: '', icon: '', color: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [factionId])

  async function fetchData() {
    setLoading(true)
    const [{ data: f }, { data: b }] = await Promise.all([
      supabase.from('factions').select('*').eq('id', factionId).single(),
      supabase.from('boxes').select(`id, name, description, miniatures(id, status)`).eq('faction_id', factionId).order('sort_order,created_at'),
    ])
    if (f) { setFaction(f); setFactionForm({ name: f.name, icon: f.icon, color: f.color }) }
    setBoxes(b || [])
    setLoading(false)
  }

  async function addBox() {
    if (!boxForm.name.trim()) return
    setSaving(true)
    await supabase.from('boxes').insert({ faction_id: factionId, name: boxForm.name.trim(), description: boxForm.description.trim() })
    setSaving(false)
    setAddBoxOpen(false)
    setBoxForm({ name: '', description: '' })
    fetchData()
  }

  async function deleteBox(boxId, e) {
    e.stopPropagation()
    if (!confirm('Slet denne boks og alle dens figurer?')) return
    await supabase.from('boxes').delete().eq('id', boxId)
    fetchData()
  }

  async function saveFaction() {
    setSaving(true)
    await supabase.from('factions').update({ name: factionForm.name, icon: factionForm.icon, color: factionForm.color }).eq('id', factionId)
    setSaving(false)
    setEditFactionOpen(false)
    fetchData()
  }

  async function deleteFaction() {
    await supabase.from('factions').delete().eq('id', factionId)
    navigate('/')
  }

  if (loading) return <Spinner />
  if (!faction) return <div style={{ padding: '40px', color: 'var(--text-dim)' }}>Fraktion ikke fundet.</div>

  const allMinis = boxes.flatMap(b => b.miniatures)
  const done = allMinis.filter(m => m.status === 'done').length
  const wip  = allMinis.filter(m => m.status === 'wip').length
  const unpainted = allMinis.filter(m => m.status === 'unpainted').length
  const total = allMinis.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', fontSize:'0.82rem', color:'var(--text-dim)' }}>
        <span onClick={() => navigate('/')} style={{ cursor:'pointer' }} onMouseEnter={e=>e.target.style.color='var(--gold2)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>Oversigt</span>
        <span style={{ opacity:0.4 }}>›</span>
        <span style={{ color:'var(--text)' }}>{faction.icon} {faction.name}</span>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:'3.5rem', lineHeight:1 }}>{faction.icon}</div>
        <div style={{ flex:1, minWidth:'200px' }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1.8rem', color:'var(--text-bright)', marginBottom:'4px' }}>{faction.name}</div>
          <div style={{ color:'var(--text-dim)', fontStyle:'italic' }}>{boxes.length} bokse · {total} figurer</div>
          <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' }}>
            <Btn variant="ghost" style={{ fontSize:'0.68rem', padding:'6px 14px' }} onClick={() => setEditFactionOpen(true)}>✏ Redigér</Btn>
            <Btn variant="danger" style={{ fontSize:'0.68rem', padding:'6px 14px' }} onClick={() => setDeleteConfirmOpen(true)}>🗑 Slet fraktion</Btn>
          </div>
        </div>
        <DonutChart done={done} wip={wip} unpainted={unpainted} size={120} centerText={`${pct}%`} />
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
        {[
          { num: done,      label: 'Færdig',  color: '#4ac466' },
          { num: wip,       label: 'I gang',  color: '#e8b84b' },
          { num: unpainted, label: 'Umalet',  color: 'var(--text)' },
          { num: total,     label: 'Total',   color: faction.color },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 20px', textAlign:'center', minWidth:'90px' }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1.8rem', color: s.color, lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Bokse" action="＋ Tilføj boks" onAction={() => setAddBoxOpen(true)} />

      {boxes.length === 0 && <EmptyState icon="📦" text="Ingen bokse endnu — tilføj din første boks." />}

      <div style={{ background:'var(--bg2)', border: boxes.length ? '1px solid var(--border)' : 'none' }}>
        {boxes.map(b => {
          const bt = b.miniatures.length
          const bd = b.miniatures.filter(m => m.status === 'done').length
          const bpct = bt > 0 ? Math.round(bd / bt * 100) : 0
          return (
            <div
              key={b.id}
              style={{ borderBottom:'1px solid var(--border)', padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex:1 }} onClick={() => navigate(`/faction/${factionId}/box/${b.id}`)}>
                <div style={{ fontWeight:600, color:'var(--text)', fontSize:'0.95rem' }}>{b.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginTop:'2px' }}>{bd}/{bt} malet{b.description ? ' · ' + b.description : ''}</div>
              </div>
              <ProgressBar pct={bpct} />
              <button
                onClick={e => deleteBox(b.id, e)}
                style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:'1rem', padding:'2px 6px', flexShrink:0, transition:'color 0.15s' }}
                title="Slet boks"
                onMouseEnter={e => e.target.style.color = 'var(--red-bright)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
              >🗑</button>
            </div>
          )
        })}
      </div>

      {/* Add Box Modal */}
      <Modal open={addBoxOpen} onClose={() => setAddBoxOpen(false)} title="Tilføj Boks">
        <FormGroup label="Boksnavn">
          <input value={boxForm.name} onChange={e => setBoxForm(f => ({ ...f, name: e.target.value }))}
            placeholder="f.eks. Berserkers Squad I" onKeyDown={e => e.key === 'Enter' && addBox()} />
        </FormGroup>
        <FormGroup label="Beskrivelse (valgfri)">
          <input value={boxForm.description} onChange={e => setBoxForm(f => ({ ...f, description: e.target.value }))}
            placeholder="f.eks. 10 modeller" />
        </FormGroup>
        <BtnRow>
          <Btn onClick={() => setAddBoxOpen(false)}>Annuller</Btn>
          <Btn variant="primary" onClick={addBox} disabled={saving}>{saving ? '...' : 'Tilføj'}</Btn>
        </BtnRow>
      </Modal>

      {/* Edit Faction Modal */}
      <Modal open={editFactionOpen} onClose={() => setEditFactionOpen(false)} title="Redigér Fraktion">
        <FormGroup label="Navn">
          <input value={factionForm.name} onChange={e => setFactionForm(f => ({ ...f, name: e.target.value }))} />
        </FormGroup>
        <FormGroup label="Ikon (emoji)">
          <input value={factionForm.icon} onChange={e => setFactionForm(f => ({ ...f, icon: e.target.value }))} maxLength={4} />
        </FormGroup>
        <FormGroup label="Farve">
          <div style={{ display:'flex', gap:'8px' }}>
            <input value={factionForm.color} onChange={e => setFactionForm(f => ({ ...f, color: e.target.value }))} />
            <input type="color" value={factionForm.color} onChange={e => setFactionForm(f => ({ ...f, color: e.target.value }))}
              style={{ width:'44px', height:'40px', padding:'2px', border:'1px solid var(--border)', background:'var(--bg3)', cursor:'pointer' }} />
          </div>
        </FormGroup>
        <BtnRow>
          <Btn onClick={() => setEditFactionOpen(false)}>Annuller</Btn>
          <Btn variant="primary" onClick={saveFaction} disabled={saving}>{saving ? '...' : 'Gem'}</Btn>
        </BtnRow>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Slet Fraktion">
        <p style={{ color:'var(--text)', marginBottom:'8px' }}>Er du sikker? Dette sletter <strong style={{ color:'var(--red-bright)' }}>{faction.name}</strong> og alle dens bokse og figurer.</p>
        <BtnRow>
          <Btn onClick={() => setDeleteConfirmOpen(false)}>Annuller</Btn>
          <Btn variant="danger" onClick={deleteFaction}>Ja, slet alt</Btn>
        </BtnRow>
      </Modal>
    </div>
  )
}
