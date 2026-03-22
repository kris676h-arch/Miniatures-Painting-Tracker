import { useEffect, useRef } from 'react'

/* ─── Button ─── */
export function Btn({ variant = 'ghost', children, style, ...props }) {
  const styles = {
    fontFamily: "'Cinzel', serif",
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '10px 22px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: variant === 'primary' ? 'rgba(200,150,42,0.12)'
              : variant === 'danger'  ? 'rgba(196,48,48,0.12)'
              : 'transparent',
    borderColor: variant === 'primary' ? 'var(--gold)'
               : variant === 'danger'  ? 'var(--red2)'
               : 'var(--border)',
    color: variant === 'primary' ? 'var(--gold2)'
         : variant === 'danger'  ? 'var(--red-bright)'
         : 'var(--text-dim)',
    ...style,
  }
  return <button style={styles} {...props}>{children}</button>
}

/* ─── Modal ─── */
export function Modal({ open, onClose, title, children, large }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(3px)', padding: '16px',
      }}
    >
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border-bright)',
        width: '100%', maxWidth: large ? '700px' : '520px',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '28px', position: 'relative',
        animation: 'modalIn 0.2s ease',
      }}>
        <button
          onClick={onClose}
          style={{ position:'absolute',top:'16px',right:'18px',background:'none',border:'none',color:'var(--text-dim)',fontSize:'1.4rem',cursor:'pointer' }}
        >✕</button>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:'1.1rem', color:'var(--gold2)', marginBottom:'20px', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── FormGroup ─── */
export function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

/* ─── StatusPicker ─── */
export function StatusPicker({ value, onChange }) {
  const options = [
    { key: 'unpainted', label: 'Umalet',  activeStyle: { borderColor:'#555', color:'var(--text)', background:'rgba(100,100,120,0.15)' } },
    { key: 'wip',       label: 'I gang',  activeStyle: { borderColor:'var(--gold)', color:'var(--gold2)', background:'rgba(200,150,42,0.1)' } },
    { key: 'done',      label: 'Færdig',  activeStyle: { borderColor:'var(--green2)', color:'var(--green-bright)', background:'rgba(42,140,66,0.1)' } },
  ]
  return (
    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
      {options.map(o => (
        <div
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            padding:'6px 14px', border:'1px solid var(--border)',
            cursor:'pointer', fontSize:'0.8rem', transition:'all 0.15s',
            background:'var(--bg3)', color:'var(--text-dim)',
            ...(value === o.key ? o.activeStyle : {})
          }}
        >{o.label}</div>
      ))}
    </div>
  )
}

/* ─── StatusBadge ─── */
export function StatusBadge({ status }) {
  const map = {
    done:      { label: '✓ Færdig', bg: 'rgba(42,140,66,0.15)',   color: 'var(--green-bright)' },
    wip:       { label: '⚒ I gang', bg: 'rgba(200,150,42,0.15)',  color: 'var(--gold2)' },
    unpainted: { label: '○ Umalet', bg: 'rgba(100,100,120,0.2)',  color: 'var(--text-dim)' },
  }
  const s = map[status] || map.unpainted
  return (
    <span style={{ fontSize:'0.72rem', padding:'2px 7px', background:s.bg, color:s.color, borderRadius:'2px', display:'inline-block' }}>
      {s.label}
    </span>
  )
}

/* ─── DonutChart ─── */
export function DonutChart({ done = 0, wip = 0, unpainted = 0, size = 130, centerText = '' }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = size, H = size
    ctx.clearRect(0, 0, W, H)
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) / 2 - 8
    const inner = r * 0.62
    const total = (done + wip + unpainted) || 1
    const segments = [
      { val: done,      color: '#4ac466' },
      { val: wip,       color: '#e8b84b' },
      { val: unpainted, color: '#3a3a4a' },
    ]
    let angle = -Math.PI / 2
    segments.forEach(s => {
      if (!s.val) return
      const sweep = (s.val / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, angle, angle + sweep)
      ctx.closePath()
      ctx.fillStyle = s.color
      ctx.fill()
      angle += sweep
    })
    ctx.beginPath()
    ctx.arc(cx, cy, inner, 0, Math.PI * 2)
    ctx.fillStyle = '#111118'
    ctx.fill()
    if (centerText) {
      ctx.fillStyle = '#e8b84b'
      ctx.font = `bold ${Math.round(inner * 0.5)}px Cinzel, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(centerText, cx, cy)
    }
  }, [done, wip, unpainted, size, centerText])

  return <canvas ref={canvasRef} width={size} height={size} style={{ display:'block' }} />
}

/* ─── ProgressBar ─── */
export function ProgressBar({ pct }) {
  const color = pct === 100 ? '#4ac466' : pct > 0 ? '#e8b84b' : '#3a3a4a'
  return (
    <div style={{ width:'80px', height:'5px', background:'var(--bg4)', borderRadius:'3px', overflow:'hidden', flexShrink:0 }}>
      <div style={{ height:'100%', borderRadius:'3px', width:`${pct}%`, background: color, transition:'width 0.4s' }} />
    </div>
  )
}

/* ─── Spinner ─── */
export function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid var(--border)', borderTopColor:'var(--gold2)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )
}

/* ─── SectionHeader ─── */
export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
      <span style={{ fontFamily:"'Cinzel',serif", fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-dim)', whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
      {action && (
        <button onClick={onAction} style={{ fontSize:'0.75rem', color:'var(--gold-dim)', cursor:'pointer', background:'none', border:'none', fontFamily:"'Cinzel',serif", letterSpacing:'0.08em', transition:'color 0.15s' }}
          onMouseEnter={e => e.target.style.color='var(--gold2)'}
          onMouseLeave={e => e.target.style.color='var(--gold-dim)'}
        >{action}</button>
      )}
    </div>
  )
}

/* ─── BtnRow ─── */
export function BtnRow({ children }) {
  return <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px', flexWrap:'wrap' }}>{children}</div>
}

/* ─── EmptyState ─── */
export function EmptyState({ icon = '📦', text }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 16px', color:'var(--text-dim)' }}>
      <span style={{ fontSize:'3rem', display:'block', marginBottom:'12px' }}>{icon}</span>
      <p style={{ fontStyle:'italic' }}>{text}</p>
    </div>
  )
}
