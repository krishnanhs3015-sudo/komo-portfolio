import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { DeskLayers, calm } from '../test/DeskDrop'
import { asset } from '../asset'
import Bulb from './Bulb'
import Footer from './Footer'
import './about.css'

// About: three scenes driven by scroll, pinned to the screen.
//   1. in the dark, the camera follows the desk down and shakes as it lands,
//      then the hanging bulb flickers on over "Who is he?" and Komo
//   2. scroll zooms into the desk, then the table slide moves in from the right
//   3. the footer slides in
const SW = 1440 // Figma frame
const SH = 1024
const CANVAS = { x: 349, y: 261, scale: 743 / 2000 } // where the 2000px desk canvas sits in the frame
const ZOOM_AT = { x: 349 + 800 * CANVAS.scale, y: 261 + 1500 * CANVAS.scale } // the dark opening under the desk
const SECTION_VH = 600

// camera: starts above, glides down with the falling desk (same 1.9s as the fall), jolts on the
// first landing (0.55) and nudges on the second (0.85)
const CAM = {
  y: ['55vh', '0vh', '1.6vh', '-1vh', '0.5vh', '0vh', '0vh', '0.5vh', '0vh'],
  x: [0, 0, -6, 7, -4, 0, 0, 2, 0],
  rotate: [0, 0, -0.4, 0.3, -0.15, 0, 0, 0, 0],
}
const CAM_T = { duration: 1.9, times: [0, 0.55, 0.58, 0.62, 0.66, 0.71, 0.85, 0.88, 1], ease: ['easeIn', 'easeOut', 'easeInOut', 'easeInOut', 'easeOut', 'linear', 'easeOut', 'easeIn'] }

// the bulb catching: on, off, half, off, on
const FLICK_ON = { to: [0, 1, 0.05, 0, 0.85, 0.1, 1, 0.55, 1], duration: 1.3, times: [0, 0.06, 0.12, 0.3, 0.36, 0.44, 0.6, 0.7, 1] }
// then now and then a quick dip
const DIPS = [
  { to: [1, 0.3, 1], duration: 0.18 },
  { to: [1, 0.15, 0.9, 0.2, 1], duration: 0.4 },
  { to: [1, 0.6, 1], duration: 0.12 },
]

export default function About() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [idle, setIdle] = useState(false)
  const [go, setGo] = useState(false)
  const [footerOn, setFooterOn] = useState(false)
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

  // dark until the desk has landed, then the bulb flickers on and keeps dipping now and then
  const still = calm()
  const light = useMotionValue(still ? 1 : 0)
  useEffect(() => {
    if (!idle || still) return
    let ctl, t
    const dip = () => {
      t = setTimeout(() => {
        const d = DIPS[Math.floor(Math.random() * DIPS.length)]
        ctl = animate(light, d.to, { duration: d.duration, ease: 'linear', onComplete: dip })
      }, 2500 + Math.random() * 4500)
    }
    t = setTimeout(() => {
      ctl = animate(light, FLICK_ON.to, { duration: FLICK_ON.duration, times: FLICK_ON.times, ease: 'linear', onComplete: dip })
    }, 200)
    return () => { clearTimeout(t); ctl?.stop() }
  }, [idle, still, light])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })

  useMotionValueEvent(p, 'change', (v) => { if (v > 0.8) setFooterOn(true) })

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
  const lightsOut = useTransform(p, [0.02, 0.12], [1, 0]) // the room brightens as the zoom starts

  return (
    <main ref={section} className="about" style={{ height: `${SECTION_VH}vh` }}>
      <a className="about-back hand" href="#/">← Home</a>
      <div className="ab-sticky">
        <motion.div className="ab-fall" style={{ scale: zoom, transformOrigin: `${ox}px ${oy}px` }}>
          <motion.div className="ab-cam" initial={still ? false : { y: CAM.y[0] }} animate={go && !still ? CAM : undefined} transition={CAM_T}>
          <div className="ab-stage" style={{ width: SW, height: SH, left, top, transform: `scale(${s})` }}>
            <motion.h1 className="ab-who hand" style={{ opacity: idle ? title : 0 }} initial={false}
              animate={idle ? { scale: [0.6, 1.08, 1], y: [24, 0, 0] } : { scale: 0.6 }} transition={{ duration: 0.55, times: [0, 0.6, 1] }}>
              WHO IS <span className="ab-he">HE</span><span className="ab-q">?</span>
            </motion.h1>
            <div className="ab-canvas" style={{ left: CANVAS.x, top: CANVAS.y, transform: `scale(${CANVAS.scale})` }}>
              {go && <DeskLayers plain yStart={yStart} idle={idle} onIdle={() => setIdle(true)} />}
            </div>
            <Bulb light={light} fade={lightsOut} />
          </div>
          </motion.div>
        </motion.div>
        <motion.p className="ab-cue hand" style={{ opacity: idle ? cue : 0 }}>scroll →</motion.p>

        <motion.div className="ab-scene" style={{ x: sceneX }}>
          <section className="ab-slide ab-table" aria-label="About, at the table">
            <motion.img style={{ scale: tableScale }} src={asset('brand/about/table.webp')} alt="Komo's table seen from above, with stickers, scissors and paper" draggable={false} />
          </section>
          <Footer on={footerOn} />
        </motion.div>
      </div>
    </main>
  )
}
