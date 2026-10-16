import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { asset } from '../asset'
import { CATEGORIES, LIME, ORANGE, RAIL } from './data'
import Gallery from './Gallery'
import './projects.css'

// Five 1440 x 1024 pages that stack as you scroll: each page slides up over the previous one,
// which shrinks and dims underneath. Layout comes from the Figma pages.
const W = 1440
const H = 1024
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))

function StartPage({ next }) {
  return (
    <>
      <img className="logo-light" src={asset('home/logo.svg')} alt="KOMO.IS" draggable={false} />
      <div className="tile lime hero" style={{ left: 88, top: 187, width: 589, height: 482 }}>
        <h1 className="display">FOR<br />EVERYONE BUT<br />NOTANYONE</h1>
        <p className="mono">THROUGH THE WORKS, IDEAS AND<br />EXPRESSION COMES INTO THE STORIES</p>
      </div>
      <div className="tile orange center" style={{ left: 88, top: 689, width: 250, height: 147 }}><b className="display">2018 - PRESENT</b></div>
      <div className="tile lime center" style={{ left: 358, top: 689, width: 319, height: 147 }}><b className="display list">GRAPHIC DESIGN<br />UIUX DESIGN<br />PACKAGING<br />EDITORIAL</b></div>
      <div className="tile dark" style={{ left: 696, top: 187, width: 656, height: 649 }}>
        <button className="scroll-cue mono" onClick={next}>SCROLL DOWN
          <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><path d="M1 1h20L11 17z" fill="currentColor" /></svg>
        </button>
      </div>
      <p className="mono footer-note">LET’S TALK<br />ABOUT PROJECTS</p>
    </>
  )
}

function CategoryPage({ cat, onOpen }) {
  const { def, small } = cat
  return (
    <>
      {cat.tiles.map((t, i) => t.img
        ? <img key={i} className="tile-img" src={asset(`projects/${t.img}.webp`)} alt="" draggable={false} style={{ left: t.x, top: t.y, width: t.w, height: t.h }} />
        : <div key={i} className="tile" style={{ left: t.x, top: t.y, width: t.w, height: t.h, background: t.color }} />)}
      {small.img
        ? <img className="tile-img" src={asset(`projects/${small.img}.webp`)} alt="" draggable={false} style={{ left: small.x, top: small.y, width: small.w, height: small.h }} />
        : <div className="tile" style={{ left: small.x, top: small.y, width: small.w, height: small.h, background: small.color }} />}
      <div className="tile def" style={{ left: def.x, top: def.y, width: def.w, height: def.h, background: def.bg }}>
        <h3 className="mono">{def.head}</h3>
        <small className="mono">NOUN:</small>
        <p className="mono">{def.body}</p>
      </div>

      <button className="latest" style={{ left: 696, top: 355, width: 656, height: 482 }} onClick={onOpen} aria-label={`Open the ${cat.title} gallery`}>
        <span className="mono l-left">LATEST</span>
        <span className="mono l-right">DESIGN</span>
        <span className="display l-title">{cat.title}</span>
        <span className="mono l-sub">Projects done since 2018</span>
        <span className="fan" aria-hidden="true">
          <i style={{ background: ORANGE }} /><i style={{ background: LIME }} /><i style={{ background: '#2e4c8c' }} />
        </span>
        <span className="mono l-open">OPEN GALLERY →</span>
      </button>
      <p className="mono footer-note">{cat.footer[0]}<br />{cat.footer[1]}</p>
    </>
  )
}

function Section({ index, vh, scrollY, fit, children }) {
  // progress 0..1 while the NEXT page rises over this one: this page shrinks and dims
  const p = useTransform(scrollY, (y) => clamp((y - index * vh) / vh))
  const scale = useTransform(p, [0, 1], [1, 0.93])
  const filter = useTransform(p, (v) => `brightness(${1 - 0.5 * v})`)
  return (
    <section className={'proj-section' + (index > 0 ? ' over' : '')} style={{ zIndex: index + 1 }}>
      <motion.div className="proj-inner" style={{ scale, filter }}>
        <div className="proj-stage" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${fit})` }}>{children}</div>
      </motion.div>
    </section>
  )
}

export default function Projects() {
  const { scrollY } = useScroll()
  const [vh, setVh] = useState(window.innerHeight)
  const [fit, setFit] = useState(1)
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(null) // category whose gallery is open

  useEffect(() => {
    const update = () => { setVh(window.innerHeight); setFit(Math.min(window.innerWidth / W, window.innerHeight / H)) }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => scrollY.on('change', (y) => setCurrent(clamp(Math.round(y / vh), 0, RAIL.length - 1))), [scrollY, vh])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])

  const jump = (i) => window.scrollTo({ top: i * vh, behavior: 'smooth' })

  return (
    <main className="projects" style={{ height: vh * RAIL.length }}>
      <a className="home-link hand" href="#/">← Home</a>
      <nav className="rail" aria-label="Project sections">
        <span className="mono rail-count">{String(current + 1).padStart(2, '0')} / {String(RAIL.length).padStart(2, '0')}</span>
        {RAIL.map((label, i) => (
          <button key={label} className={'rail-dot' + (i === current ? ' on' : '')} onClick={() => jump(i)} aria-label={`Go to ${label}`} aria-current={i === current}>
            <span className="rail-label hand">{label}</span>
          </button>
        ))}
      </nav>

      <Section index={0} vh={vh} scrollY={scrollY} fit={fit}><StartPage next={() => jump(1)} /></Section>
      {CATEGORIES.map((cat, i) => (
        <Section key={cat.id} index={i + 1} vh={vh} scrollY={scrollY} fit={fit}>
          <CategoryPage cat={cat} onOpen={() => setOpen(cat)} />
        </Section>
      ))}

      <AnimatePresence>{open && <Gallery key={open.id} cat={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </main>
  )
}

