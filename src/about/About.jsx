import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { DeskLayers, calm } from '../test/DeskDrop'
import { asset } from '../asset'
import Bulb, { Pool } from './Bulb'
import { click } from './click'
import Footer from './Footer'
import Table from './Table'
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
const SECTION_VH = 1050
const at = (vh) => vh / SECTION_VH // scroll positions below are written in screen-heights (vh) from the top
// the story cards on the table: one slice of scroll each, after the table has slid in
const CARD_START = 330
const CARD_VH = 230
const CARD_SPANS = [0, 1].map((i) => [at(CARD_START + i * CARD_VH), at(CARD_START + (i + 1) * CARD_VH)])
const FOOTER_AT = CARD_START + 2 * CARD_VH + 20 // footer starts sliding in here

// stage fit: whole frame on wide screens, big and bottom-anchored on phones
function fit(w, h) {
  const portrait = w / h < 0.9
  const s = portrait ? w / 675 : Math.min(w / SW, h / SH)
  return { s, left: (w - SW * s) / 2, top: portrait ? h - SH * s : (h - SH * s) / 2 }
}
// how far the camera sits below its resting frame during the fall: just enough to keep the bulb
// (glass ends at stage y ~207) above the top of the screen
const low = ({ s, top }) => top + 230 * s

// camera, part 1: glides down with the falling desk (same 1.9s as the fall) into a low shot,
// jolts on the first landing (0.55) and nudges on the second (0.85). y is in screen heights.
const CAM = {
  y: [0.55, 0, 0.016, -0.01, 0.005, 0, 0, 0.005, 0],
  x: [0, 0, -6, 7, -4, 0, 0, 2, 0],
  rotate: [0, 0, -0.4, 0.3, -0.15, 0, 0, 0, 0],
}
const CAM_T = { duration: 1.9, times: [0, 0.55, 0.58, 0.62, 0.66, 0.71, 0.85, 0.88, 1], ease: ['easeIn', 'easeOut', 'easeInOut', 'easeInOut', 'easeOut', 'linear', 'easeOut', 'easeIn'] }
// camera, part 2: once the desk has settled, tilt up to find the bulb
const TILT_AT = 2.1 // seconds after the fall starts
const TILT = { duration: 1.5, ease: [0.6, 0, 0.25, 1] }
const LIGHT_AT = 0.85 // of the tilt: the bulb catches just before the camera comes to rest

// the bulb catching: on, off, half, off, on
const FLICK_ON = { to: [0, 1, 0.05, 0, 0.85, 0.1, 1, 0.55, 1], duration: 1.3, times: [0, 0.06, 0.12, 0.3, 0.36, 0.44, 0.6, 0.7, 1] }
// then now and then a quick dip
const DIPS = [
  { to: [1, 0.3, 1], duration: 0.18 },
  { to: [1, 0.15, 0.9, 0.2, 1], duration: 0.4 },
  { to: [1, 0.6, 1], duration: 0.12 },
]
// the bulb is still swaying from the landing when the camera finds it (degrees)
const SWING = { to: [2.2, -1.6, 1.1, -0.6, 0.25, 0], duration: 3.4 }

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

  // in the dark the camera follows the desk down to a low shot, then tilts up to the bulb (which only
  // hangs there once the desk has landed); it flickers on as the camera arrives, then keeps dipping
  // now and then. Each time it catches, it clicks.
  const still = calm()
  const light = useMotionValue(still ? 1 : 0)
  const swing = useMotionValue(0)
  const hung = useMotionValue(still ? 1 : 0)
  const camX = useMotionValue(0)
  const camR = useMotionValue(0)
  const camY = useMotionValue(still ? 0 : CAM.y[0] * window.innerHeight - low(fit(window.innerWidth, window.innerHeight)))
  useEffect(() => {
    if (!go || still) return
    const h = window.innerHeight
    const off = low(fit(window.innerWidth, h))
    const ctls = [
      animate(camY, CAM.y.map((v) => v * h - off), CAM_T),
      animate(camX, CAM.x, CAM_T),
      animate(camR, CAM.rotate, CAM_T),
    ]
    let t
    const dip = () => {
      t = setTimeout(() => {
        const d = DIPS[Math.floor(Math.random() * DIPS.length)]
        ctls.push(animate(light, d.to, { duration: d.duration, ease: 'linear', onComplete: dip }))
      }, 2500 + Math.random() * 4500)
    }
    t = setTimeout(() => {
      hung.set(1) // still off-screen above the shot
      ctls.push(animate(camY, 0, TILT), animate(swing, SWING.to, { duration: SWING.duration, ease: 'easeInOut' }))
      t = setTimeout(() => {
        ctls.push(animate(light, FLICK_ON.to, { duration: FLICK_ON.duration, times: FLICK_ON.times, ease: 'linear', onComplete: dip }))
      }, TILT.duration * LIGHT_AT * 1000)
    }, TILT_AT * 1000)
    return () => { clearTimeout(t); ctls.forEach((c) => c.stop()) }
  }, [go, still, light, swing, hung, camX, camY, camR])
  useEffect(() => {
    let prev = light.get()
    return light.on('change', (v) => {
      if (prev < 0.5 && v >= 0.5) click(v)
      prev = v
    })
  }, [light])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })

  useMotionValueEvent(p, 'change', (v) => { if (v > at(FOOTER_AT + 84)) setFooterOn(true) })

  const { s, left, top } = fit(vp.w, vp.h)
  const ox = left + ZOOM_AT.x * s
  const oy = top + ZOOM_AT.y * s
  const yStart = -(top + CANVAS.y * s) / (CANVAS.scale * s) - 2100

  const zoom = useTransform(p, [at(30), at(216)], [1, 9])
  const sceneX = useTransform(p, [at(180), at(312), at(FOOTER_AT), at(FOOTER_AT + 156)], ['50%', '0%', '0%', '-50%']) // % of the 200%-wide row = one screen each
  const tableScale = useTransform(p, [at(180), at(330)], [1.2, 1])
  const title = useTransform(p, [0, at(48)], [1, 0])
  const cue = useTransform(p, [0, at(30)], [1, 0])
  const lightsOut = useTransform(p, [at(12), at(72)], [1, 0]) // the room brightens as the zoom starts

  return (
    <main ref={section} className="about" style={{ height: `${SECTION_VH}vh` }}>
      <a className="about-back hand" href="#/">← Home</a>
      <div className="ab-sticky">
        <motion.div className="ab-fall" style={{ scale: zoom, transformOrigin: `${ox}px ${oy}px` }}>
          <motion.div className="ab-cam" style={{ x: camX, y: camY, rotate: camR }}>
            <div className="ab-stage" style={{ width: SW, height: SH, left, top, transform: `scale(${s})` }}>
              <motion.h1 className="ab-who hand" style={{ opacity: idle ? title : 0 }} initial={false}
                animate={idle ? { scale: [0.6, 1.08, 1], y: [24, 0, 0] } : { scale: 0.6 }} transition={{ duration: 0.55, times: [0, 0.6, 1] }}>
                WHO IS <span className="ab-he">HE</span><span className="ab-q">?</span>
              </motion.h1>
              <Pool light={light} fade={lightsOut} />
              <div className="ab-canvas" style={{ left: CANVAS.x, top: CANVAS.y, transform: `scale(${CANVAS.scale})` }}>
                {go && <DeskLayers plain yStart={yStart} idle={idle} onIdle={() => setIdle(true)} />}
              </div>
              <Bulb light={light} fade={lightsOut} swing={swing} hung={hung} />
            </div>
          </motion.div>
        </motion.div>
        <motion.p className="ab-cue hand" style={{ opacity: idle ? cue : 0 }}>scroll →</motion.p>

        <motion.div className="ab-scene" style={{ x: sceneX }}>
          <Table vp={vp} scale={tableScale} p={p} spans={CARD_SPANS} />
          <Footer on={footerOn} />
        </motion.div>
      </div>
    </main>
  )
}
