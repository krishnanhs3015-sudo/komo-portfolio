import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { asset } from '../asset'
import './loader.css'

// Loading screen, first visit of a session: Komo's three run on the spot in the middle, popping up one after
// another from the bottom; the big logo sweeps in front of them; then the whole screen lifts away into the site.
// It holds until the images for the page are loaded (but never longer than the safety limit).
const MIN_MS = 3200 // always at least this long
const MAX_MS = 9000 // never longer than this, even on a bad connection
const LOGO_AT = 2000 // when the logo sweeps in
const WIPE_S = 0.9

const CAST = [
  { id: 'star', alt: 'Komo as a star', k: 0.861, delay: 0.25, bob: '0.46s', lift: '9%', tilt: '3deg' },
  { id: 'runner', alt: 'Komo running', k: 0.972, delay: 0, bob: '0.36s', lift: '7%', tilt: '2deg' },
  { id: 'dizzy', alt: 'Dizzy Komo', k: 1, delay: 0.5, bob: '0.52s', lift: '6%', tilt: '7deg' },
]

const load = (src) => new Promise((resolve) => {
  const img = new Image()
  img.onload = img.onerror = () => resolve()
  img.src = src
})

export default function Loader({ preload, onReveal, onDone }) {
  const [logo, setLogo] = useState(false)
  const [wipe, setWipe] = useState(false)

  useEffect(() => {
    let dead = false
    const start = () => { if (!dead) setWipe(true) }
    const t1 = setTimeout(() => setLogo(true), LOGO_AT)
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const ready = Promise.race([Promise.all([...preload.map((p) => load(asset(p))), document.fonts?.ready]), wait(MAX_MS)])
    Promise.all([wait(MIN_MS), ready]).then(start)
    // a tap or key skips straight to the site
    const skip = () => { setLogo(true); start() }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => { dead = true; clearTimeout(t1); window.removeEventListener('pointerdown', skip); window.removeEventListener('keydown', skip) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (wipe) onReveal?.() }, [wipe, onReveal])

  return (
    <motion.div className="loader" role="status" aria-label="Loading"
      initial={false} animate={{ y: wipe ? '-108%' : '0%' }} transition={{ duration: WIPE_S, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => { if (wipe) onDone?.() }}>
      <div className="ld-row">
        {CAST.map((c) => (
          <motion.div key={c.id} className="ld-pop" style={{ '--k': c.k }}
            initial={{ y: '125%' }} animate={{ y: '0%' }} transition={{ type: 'spring', stiffness: 150, damping: 11, delay: c.delay }}>
            <div className="ld-bob" style={{ '--bob': c.bob, '--lift': c.lift, '--tilt': c.tilt }}>
              <img src={asset(`loader/${c.id}.webp`)} alt={c.alt} draggable={false} />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.img className="ld-logo" src={asset('home/logo.svg')} alt="KOMO.IS" draggable={false}
        initial={{ x: '-135vw', rotate: -4 }} animate={logo ? { x: '0vw', rotate: 0 } : { x: '-135vw', rotate: -4 }}
        transition={{ type: 'spring', stiffness: 95, damping: 15, mass: 0.9 }} />
    </motion.div>
  )
}
