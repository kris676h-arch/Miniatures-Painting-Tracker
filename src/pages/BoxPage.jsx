import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { Spinner, EmptyState, SectionHeader, Modal, FormGroup, Btn, BtnRow, StatusBadge, StatusPicker } from '../components/ui.jsx'

export default function BoxPage() {
  const { factionId, boxId } = useParams()
  const navigate = useNavigate()
  const [faction, setFaction] = useState(null)
  const [box, setBox] = useState(null)
  const [minis, setMinis] = useState([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', unit_type: '', status: 'unpainted', count: 1 })
  const [addSaving, setAddSaving] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', unit_type: '', status: 'unpainted', notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [imgUploading, setImgUploading] = useState(false)
  const imgInputRef = useRef(null)

  const [deleteBoxOpen, setDeleteBoxOpen] = useState(false)

  useEffect(() => { fetchData() }, [boxId])

  async function fetchData() {
    setLoading(true)
    const [{ data: f }, { data: b }, { data: m }] = await Promise.all([
      supabase.from('factions').select('id,name,icon,color').eq('id', factionId).single(),
      supabase.from('boxes').select('*').eq('id', boxId).single(),
      supabase.from('miniatures').select('*').eq('box_id', boxId).order('created_at'),
    ])
    setFaction(f)
    setBox(b)
    setMinis(m || [])
    setLoading(false)
  }

  async function addMini() {
    if (!addForm.name.trim()) return
    setAddSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const count = Math.max(1, Math.min(100, parseInt(addForm.count) || 1))
    const rows = Array.from({ length: count }, (_, i) => ({
      box_id: boxId,
      name: count === 1 ? addForm.name.trim() : `${addForm.name.trim()} #${i + 1}`,
      unit_type: addForm.unit_type.trim(),
      status: addForm.status,
      user_id: user.id,
    }))
    await supabase.from('miniatures').insert(rows)
    setAddSaving(false)
    setAddOpen(false)
    setAddForm({ name: '', unit_type: '', status: 'unpainted', count: 1 })
    fetchData()
  }

  function openDetail(mini) {
    setSelectedMini(mini)
    setEditForm({ name: mini.name, unit_type: mini.unit_type || '', status: mini.status, notes: mini.notes || '' })
    setDetailOpen(true)
  }

  async function saveMini() {
    if (!selectedMini) return
    setEditSaving(true)
    await supabase.from('miniatures').update({
      name: editForm.name.trim() || selectedMini.name,
      unit_type: editForm.unit_type.trim(),
      status: editForm.status,
      notes: editForm.notes,
    }).eq('id', selectedMini.id)
    setEditSaving(false)
    setDetailOpen(false)
    fetchData()
  }

  async function deleteMini() {
    if (!selectedMini) return
    if (!confirm(`Slet "${selectedMini.name}"?`)) return
    if (selectedMini.image_url) {
      const path = selectedMini.image_url.split('/miniature-images/')[1]
      if (path) await supabase.storage.from('miniature-images').remove([path])
    }
    await supabase.from('miniatures').delete().eq('id', selectedMini.id)
    setDetailOpen(false)
    fetchData()
  }

  async function handleImgUpload(e) {
    const file = e.target.files[0]
    if (!file || !selectedMini) return
    setImgUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${selectedMini.id}-${Date.now()}.${ext}`
    if (selectedMini.image_url) {
      const oldPath = selectedMini.image_url.split('/miniature-images/')[1]
      if (oldPath) await supabase.storage.from('miniature-images').remove([oldPath])
    }
    const { error } = await supabase.storage.from('miniature-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('miniature-images').getPublicUrl(path)
      await supabase.from('miniatures').update({ image_url: publicUrl }).eq('id', selectedMini.id)
      setSelectedMini(m => ({ ...m, image_url: publicUrl }))
      fetchData()
    }
    setImgUploading(false)
    e.target.value = ''
  }

  async function deleteBox() {
    for (const m of minis) {
      if (m.image_url) {
        const path = m.image_url.split('/miniature-images/')[1]
        if (path) await supabase.storage.from('miniature-images').remove([path])
      }
    }
    await supabase.from('boxes').delete().eq('id', boxId)
    navigate(`/faction/${factionId}`)
  }

  if (loading) return <Spinner />
  if (!box) return <div style={{ padding:'40px', color:'var(--text-dim)' }}>Boks ikke fundet.</div>

  const done = minis.filter(m => m.status === 'done').length
  const wip = minis.filter(m => m.status === 'wip').length
  const unpainted = minis.filter(m => m.status === 'unpainted').length

  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', fontSize:'0.82rem', color:'var(--text-dim)', flexWrap:'wrap' }}>
        <span onClick={() => navigate('/')} style={{ cursor:'pointer' }} onMouseEnter={e=>e.target.style.color='var(--gold2)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>Oversigt</span>
        <span style={{ opacity:0.4 }}>›</span>
        <span onClick={() => navigate(`/faction/${factionId}`)} style={{ cursor:'pointer' }} onMouseEnter={e=>e.target.style.color='var(--gold2)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>{faction?.icon} {faction?.name}</span>
        <span style={{ opacity:0.4 }}>›</span>
        <span style={{ color:'var(--text)' }}>{box.name}</span>
      </div>

      <div style={{ display:'flex', alignItems:'flex-start', gap:'20px', flexWrap:'wrap', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ flex:1, minWidth:'200px' }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1.6rem', color:'var(--text-bright)', marginBottom:'4px' }}>{box.name}</div>
          <div style={{ color:'var(--text-dim)', fontStyle:'italic' }}>{box.description || ''} · {minis.length} figurer</div>
          <div style={{ marginTop:'10px' }}>
            <Btn variant="danger" style={{ fontSize:'0.68rem', padding:'6px 14px' }} onClick={() => setDeleteBoxOpen(true)}>🗑 Slet boks</Btn>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
        {[
          { num: done, label: 'Færdig', color:'#4ac466' },
          { num: wip, label: 'I gang', color:'#e8b84b' },
          { num: unpainted, label: 'Umalet', color:'var(--text)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 20px', textAlign:'center', minWidth:'90px' }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1.8rem', color:s.color, lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Miniaturer" action="＋ Tilføj figur" onAction={() => setAddOpen(true)} />

      {minis.length === 0 && <EmptyState icon="🎨" text="Ingen figurer endnu — tilføj din første." />}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:'14px' }}>
        {minis.map(m => (
          <MiniCard key={m.id} mini={m} onClick={() => openDetail(m)} />
        ))}
        <AddMiniTile onClick={() => setAddOpen(true)} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tilføj Miniature">
        <FormGroup label="Navn">
          <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            placeholder="f.eks. Khorne Berserker" onKeyDown={e => e.key === 'Enter' && addMini()} />
        </FormGroup>
        <FormGroup label="Type / Enhed">
          <input value={addForm.unit_type} onChange={e => setAddForm(f => ({ ...f, unit_type: e.target.value }))}
            placeholder="f.eks. Infantry, HQ, Vehicle..." />
        </FormGroup>
        <FormGroup label="Antal figurer">
          <input type="number" min="1" max="100" value={addForm.count}
            onChange={e => setAddForm(f => ({ ...f, count: e.target.value }))} placeholder="1" />
        </FormGroup>
        {parseInt(addForm.count) > 1 && addForm.name.trim() && (
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', padding:'12px 14px', marginBottom:'16px', fontSize:'0.82rem', color:'var(--text-dim)' }}>
            Opretter <span style={{ color:'var(--gold2)' }}>{addForm.count} figurer</span>: {addForm.name.trim()} #1, {addForm.name.trim()} #2 ...
          </div>
        )}
        <FormGroup label="Status">
          <StatusPicker value={addForm.status} onChange={v => setAddForm(f => ({ ...f, status: v }))} />
        </FormGroup>
        <BtnRow>
          <Btn onClick={() => setAddOpen(false)}>Annuller</Btn>
          <Btn variant="primary" onClick={addMini} disabled={addSaving}>
            {addSaving ? '...' : `Tilføj ${parseInt(addForm.count) > 1 ? addForm.count + ' figurer' : 'figur'}`}
          </Btn>
        </BtnRow>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selectedMini?.name || 'Miniature'} large>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
          <div>
            <div onClick={() => imgInputRef.current?.click()} style={{ aspectRatio:'1', background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', cursor:'pointer' }}>
              {selectedMini?.image_url ? (
                <img src={selectedMini.image_url} alt={selectedMini.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ textAlign:'center', color:'var(--text-dim)' }}>
                  <span style={{ fontSize:'3rem', display:'block', marginBottom:'8px' }}>{imgUploading ? '⏳' : '🎨'}</span>
                  <p style={{ fontSize:'0.8rem' }}>{imgUploading ? 'Uploader...' : 'Klik for billede'}</p>
                </div>
              )}
              <div style={{ position:'absolute', bottom:'8px', left:0, right:0, textAlign:'center', fontSize:'0.72rem', color:'var(--text-dim)', background:'rgba(10,10,12,0.7)', padding:'4px' }}>
                {imgUploading ? 'Uploader...' : 'Klik for at skifte billede'}
              </div>
            </div>
            <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImgUpload} style={{ display:'none' }} />
            {selectedMini?.image_url && (
              <button onClick={async () => {
                if (!confirm('Fjern billede?')) return
                const path = selectedMini.image_url.split('/miniature-images/')[1]
                if (path) await supabase.storage.from('miniature-images').remove([path])
                await supabase.from('miniatures').update({ image_url: null }).eq('id', selectedMini.id)
                setSelectedMini(m => ({ ...m, image_url: null }))
                fetchData()
              }} style={{ width:'100%', marginTop:'8px', background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'6px', fontSize:'0.78rem', cursor:'pointer', fontFamily:"'Crimson Text',serif" }}>
                Fjern billede
              </button>
            )}
          </div>
          <div>
            <FormGroup label="Navn">
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Type / Enhed">
              <input value={editForm.unit_type} onChange={e => setEditForm(f => ({ ...f, unit_type: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Status">
              <StatusPicker value={editForm.status} onChange={v => setEditForm(f => ({ ...f, status: v }))} />
            </FormGroup>
            <FormGroup label="Noter">
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Farver brugt, fremgang, idéer..." />
            </FormGroup>
          </div>
        </div>
        <BtnRow>
          <Btn variant="danger" onClick={deleteMini}>🗑 Slet figur</Btn>
          <Btn onClick={() => setDetailOpen(false)}>Annuller</Btn>
          <Btn variant="primary" onClick={saveMini} disabled={editSaving}>{editSaving ? '...' : 'Gem'}</Btn>
        </BtnRow>
      </Modal>

      <Modal open={deleteBoxOpen} onClose={() => setDeleteBoxOpen(false)} title="Slet Boks">
        <p style={{ color:'var(--text)', marginBottom:'8px' }}>Er du sikker? Dette sletter <strong style={{ color:'var(--red-bright)' }}>{box.name}</strong> og alle dens figurer permanent.</p>
        <BtnRow>
          <Btn onClick={() => setDeleteBoxOpen(false)}>Annuller</Btn>
          <Btn variant="danger" onClick={deleteBox}>Ja, slet boks</Btn>
        </BtnRow>
      </Modal>
    </div>
  )
}

function MiniCard({ mini, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}
    >
      <div style={{ width:'100%', aspectRatio:'1', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', fontSize:'2.5rem' }}>
        {mini.image_url ? <img src={mini.image_url} alt={mini.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🎨'}
      </div>
      <div style={{ padding:'10px 10px 8px' }}>
        <div style={{ fontSize:'0.85rem', color:'var(--text)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mini.name}</div>
        {mini.unit_type && <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginBottom:'4px' }}>{mini.unit_type}</div>}
        <StatusBadge status={mini.status} />
      </div>
    </div>
  )
}

function AddMiniTile({ onClick }) {
  return (
    <div onClick={onClick} style={{ background:'var(--bg2)', border:'1px dashed var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', aspectRatio:'1', cursor:'pointer', color:'var(--text-dim)', transition:'all 0.2s', fontFamily:"'Crimson Text',serif", fontSize:'0.82rem' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold-dim)'; e.currentTarget.style.color='var(--gold2)'; e.currentTarget.style.background='rgba(200,150,42,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.background='var(--bg2)' }}
    >
      <span style={{ fontSize:'2rem', lineHeight:1 }}>+</span>
      <span>Tilføj figur</span>
    </div>
  )
}