import { asset } from '../asset'
import { CATEGORIES, NAMES, SWATCH } from './data'
import './projects.css'

// Placeholder case-study page (same structure as the Figma "Project page" template). Replace the colour blocks with real images.
export default function ProjectDetail({ id }) {
  const [catId, n] = id.split('-')
  const cat = CATEGORIES.find((c) => c.id === catId)
  const i = Math.max(1, Math.min(6, parseInt(n, 10) || 1))
  if (!cat) return <div className="soon"><h1 className="hand">Not found</h1><a className="mono" href="#/projects">BACK TO PROJECTS</a></div>
  const next = `#/project/${cat.id}-${(i % 6) + 1}`
  return (
    <main className="detail">
      <header className="detail-bar">
        <img src={asset('home/logo.svg')} alt="KOMO.IS" />
        <a className="mono" href="#/projects">BACK</a>
      </header>
      <div className="d-hero" style={{ background: SWATCH[i - 1] }}><b className="display">{String(i).padStart(2, '0')}</b></div>
      <h1 className="display d-title">{NAMES[i - 1].toUpperCase()}</h1>
      <p className="mono d-cat">{cat.title} · 2025</p>
      <div className="d-grid">
        <div className="d-meta">
          <div><small className="mono">ROLE</small><span className="hand">Designer</span></div>
          <div><small className="mono">YEAR</small><span className="hand">2025</span></div>
          <div><small className="mono">TOOLS</small><span className="hand">Figma, Illustrator</span></div>
        </div>
        <p className="hand d-over">Short overview of the brief, what you made and the result. Replace this with your real project story.</p>
      </div>
      <div className="d-blocks"><i style={{ background: '#e36547' }} /><i style={{ background: '#a9cf50' }} /><i className="wide" style={{ background: '#1c2748' }} /></div>
      <a className="mono d-next" href={next}>NEXT PROJECT</a>
    </main>
  )
}
