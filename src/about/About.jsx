import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { DeskLayers, calm } from '../test/DeskDrop'
import { asset } from '../asset'
import './about.css'

// About: three scenes driven by scroll, pinned to the screen.
//   1. the desk falls in, "Who is he?" appears
//   2. scroll zooms into the desk, then the table slide moves in from the right
//   3. the footer slides in
const SW = 1440 // Figma frame
const SH = 1024
const CANVAS = { x: 349, y: 261, scale: 743 / 2000 } // where the 2000px desk canvas sits in the frame
const ZOOM_AT = { x: 349 + 800 * CANVAS.scale, y: 261 + 1500 * CANVAS.scale } // the dark opening under the desk
const SECTION_VH = 600

const NAV = [
  ['HOME', [['ABOUT', '#/about'], ['WORKS', '#/projects'], ['JOURNEY', '#/journey']], '#/'],
  ['PROJECTS', [['BEHANCE', '#'], ['UPWORK', '#']], '#/projects'],
  ['SOCIAL MEDIA', [['INSTAGRAM', '#'], ['LINKEDIN', '#']], null],
]

export default function About() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [idle, setIdle] = useState(false)
  const [go, setGo] = useState(false)
  const section = useRef(null)

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // let the desk fall first: no scrolling until it has landed (with a safety timeout)
  useEffect(() => {
    if (calm()) { setGo(true); setIdle(true); return }
    const t = setTimeout(() => setGo(true), 450)
    document.documentElement.style.overflow = 'hidden'
    const release = setTimeout(() => { document.documentElement.style.overflow = '' }, 4200)
    return () => { clearTimeout(t); clearTimeout(release); document.documentElement.style.overflow = '' }
  }, [])
  useEffect(() => { if (idle) document.documentElement.style.overflow = '' }, [idle])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })

  // stage fit: whole frame on wide screens, big and bottom-anchored on phones
  const portrait = vp.w / vp.h < 0.9
  const s = portrait ? vp.w / 675 : Math.min(vp.w / SW, vp.h / SH)
  const left = (vp.w - SW * s) / 2
  const top = portrait ? vp.h - SH * s : (vp.h - SH * s) / 2
  const ox = left + ZOOM_AT.x * s
  const oy = top + ZOOM_AT.y * s
  const yStart = -(top + CANVAS.y * s) / (CANVAS.scale * s) - 2100

  const zoom = useTransform(p, [0.05, 0.36], [1, 9])
  const sceneX = useTransform(p, [0.3, 0.52, 0.66, 0.92], ['50%', '0%', '0%', '-50%']) // % of the 200%-wide row = one screen each
  const tableScale = useTransform(p, [0.3, 0.55], [1.2, 1])
  const title = useTransform(p, [0.0, 0.08], [1, 0])
  const cue = useTransform(p, [0.0, 0.05], [1, 0])

  return (
    <main ref={section} className="about" style={{ height: `${SECTION_VH}vh` }}>
      <a className="about-back hand" href="#/">← Home</a>
      <div className="ab-sticky">
        <motion.div className="ab-fall" style={{ scale: zoom, transformOrigin: `${ox}px ${oy}px` }}>
          <div className="ab-stage" style={{ width: SW, height: SH, left, top, transform: `scale(${s})` }}>
            <motion.h1 className="ab-who hand" style={{ opacity: idle ? title : 0 }} initial={false}
              animate={idle ? { scale: [0.6, 1.08, 1], y: [24, 0, 0] } : { scale: 0.6 }} transition={{ duration: 0.55, times: [0, 0.6, 1] }}>
              WHO IS <span className="ab-he">HE</span><span className="ab-q">?</span>
            </motion.h1>
            <div className="ab-canvas" style={{ left: CANVAS.x, top: CANVAS.y, transform: `scale(${CANVAS.scale})` }}>
              {go && <DeskLayers plain yStart={yStart} idle={idle} onIdle={() => setIdle(true)} />}
            </div>
          </div>
        </motion.div>
        <motion.p className="ab-cue hand" style={{ opacity: idle ? cue : 0 }}>scroll →</motion.p>

        <motion.div className="ab-scene" style={{ x: sceneX }}>
          <section className="ab-slide ab-table" aria-label="About, at the table">
            <motion.img style={{ scale: tableScale }} src={asset('brand/about/table.webp')} alt="Komo's table seen from above, with stickers, scissors and paper" draggable={false} />
          </section>
          <section className="ab-slide ab-footer" aria-label="Contact">
            <div className="af-top">
              <div className="af-contact">
                <p className="af-small">Have an awesome project?</p>
                <p className="af-big">CONTACT ME</p>
                <p className="af-small af-brief">Or send your brief here</p>
                <a className="af-big af-mail" href="mailto:kmorebiisavere@gmail.com">kmorebiisavere@gmail.com</a>
              </div>
              <nav className="af-nav" aria-label="Site">
                {NAV.map(([head, links, href]) => (
                  <div key={head}>
                    {href ? <a className="af-head" href={href}>{head}</a> : <p className="af-head">{head}</p>}
                    {links.map(([name, to]) => <a key={name} href={to}>{name}</a>)}
                  </div>
                ))}
              </nav>
            </div>
            <img className="af-art" src={asset('brand/about/footer-art.webp')} alt="" draggable={false} />
          </section>
        </motion.div>
      </div>
    </main>
  )
}
