import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import useIsMobile from '../useIsMobile'
import { asset } from '../asset'
import { DeskScene } from '../test/DeskDrop'
import './brand.css'

// Belief page: everything is laid out in Figma units (1440 wide) and the whole stage is scaled to fit.
const TOP_W = 1440
const REST = { x: 917.5, y: 341 } // where the strap ends when the card hangs still
const ANCHOR = { x: 917.5, y: -60 } // strap is pinned here, above the top edge
const PIVOT = { x: 193.5, y: 19 } // where the strap meets the card, in card-image pixels
const STRAP_W = 107.5
const END_H = 60
const MAX_PULL = 230
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// the ID card on its yellow strap: drag it, fling it, it swings back like a pendulum
function Lanyard({ toLocal, onGrab }) {
  const strap = useRef(null)
  const strapTop = useRef(null)
  const card = useRef(null)
  const st = useRef({ x: REST.x, y: REST.y - 330, vx: 0, vy: 0, psi: 0, vpsi: 0, drag: false, gx: 0, gy: 0, lt: 0 })

  useEffect(() => {
    const s = st.current
    if (reduced()) s.y = REST.y
    let raf
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000) || 0.016
      last = now
      const pvx = s.vx
      if (!s.drag) {
        const k = 55, c = 5.2
        s.vx += (-k * (s.x - REST.x) - c * s.vx) * dt
        s.vy += (-k * (s.y - REST.y) - c * s.vy) * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
      }
      // card tilts against the pull (sideways acceleration) and settles with its own spring
      const ax = (s.vx - pvx) / dt
      s.vpsi += (ax * 0.03 - 90 * s.psi - 6 * s.vpsi) * dt
      s.psi += s.vpsi * dt
      const dx = s.x - ANCHOR.x
      const dy = s.y - ANCHOR.y
      const len = Math.hypot(dx, dy)
      const phi = (Math.atan2(dx, dy) * 180) / Math.PI
      const theta = -phi * 0.7 + Math.max(-40, Math.min(40, s.psi))
      if (strap.current) {
        strap.current.style.transform = `translate(${ANCHOR.x - STRAP_W / 2}px, ${ANCHOR.y}px) rotate(${-phi}deg)`
        strapTop.current.style.height = Math.max(20, len - END_H) + 'px'
      }
      if (card.current) card.current.style.transform = `translate(${s.x - PIVOT.x}px, ${s.y - PIVOT.y}px) rotate(${theta}deg)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const down = (e) => {
    const s = st.current
    const p = toLocal(e)
    s.drag = true
    s.gx = p.x - s.x
    s.gy = p.y - s.y
    s.lt = performance.now()
    s.vx = 0
    s.vy = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    onGrab()
  }
  const move = (e) => {
    const s = st.current
    if (!s.drag) return
    const p = toLocal(e)
    let dx = p.x - s.gx - REST.x
    let dy = p.y - s.gy - REST.y
    const r = Math.hypot(dx, dy)
    if (r > 0) {
      const r2 = MAX_PULL * Math.tanh(r / MAX_PULL) // rubber band: harder to pull the further it goes
      dx *= r2 / r
      dy *= r2 / r
    }
    const nx = REST.x + dx
    const ny = REST.y + dy
    const now = performance.now()
    const dt = Math.max(0.008, (now - s.lt) / 1000)
    s.vx = s.vx * 0.5 + ((nx - s.x) / dt) * 0.5
    s.vy = s.vy * 0.5 + ((ny - s.y) / dt) * 0.5
    s.lt = now
    s.x = nx
    s.y = ny
  }
  const up = () => { st.current.drag = false }

  return (
    <>
      <div ref={strap} className="b-strap" style={{ width: STRAP_W }}>
        <img ref={strapTop} className="b-strap-top" src={asset('brand/strap-top.webp')} alt="" draggable={false} />
        <img className="b-strap-end" src={asset('brand/strap-end.webp')} alt="" draggable={false} style={{ height: END_H }} />
      </div>
      <img ref={card} className="b-card" src={asset('brand/card.webp')} alt="Komo ID card: The Designer, Komo.is" draggable={false}
        style={{ width: 433, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </>
  )
}

// a sticker or polaroid you can pick up, throw, and leave wherever you like
function Piece({ src, alt, left, top, width, delay = 0, toLocal, front, tilt = 0 }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [z, setZ] = useState(7)
  const [held, setHeld] = useState(false)
  const g = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, lt: 0, vx: 0, vy: 0, lx: 0, ly: 0 })

  const down = (e) => {
    const p = toLocal(e)
    const s = g.current
    s.sx = p.x; s.sy = p.y; s.ox = x.get(); s.oy = y.get(); s.lx = p.x; s.ly = p.y; s.vx = 0; s.vy = 0; s.lt = performance.now()
    x.stop(); y.stop()
    setZ(front())
    setHeld(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    if (!held) return
    const p = toLocal(e)
    const s = g.current
    const now = performance.now()
    const dt = Math.max(0.008, (now - s.lt) / 1000)
    s.vx = s.vx * 0.6 + ((p.x - s.lx) / dt) * 0.4
    s.vy = s.vy * 0.6 + ((p.y - s.ly) / dt) * 0.4
    s.lx = p.x; s.ly = p.y; s.lt = now
    x.set(s.ox + p.x - s.sx)
    y.set(s.oy + p.y - s.sy)
  }
  const up = () => {
    if (!held) return
    setHeld(false)
    const s = g.current
    const spring = { type: 'spring', stiffness: 90, damping: 15 }
    animate(x, x.get() + s.vx * 0.18, { ...spring, velocity: s.vx })
    animate(y, y.get() + s.vy * 0.18, { ...spring, velocity: s.vy })
  }

  return (
    <motion.div className="b-piece" style={{ left, top, width, x, y, zIndex: z, rotate: tilt }}
      initial={reduced() ? false : { opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: held ? 1.07 : 1 }}
      viewport={{ once: true, amount: 0.2 }} animate={{ scale: held ? 1.07 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16, delay }}
      whileHover={{ scale: 1.04 }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={asset(src)} alt={alt} draggable={false} style={{ width: '100%', display: 'block', filter: held ? 'drop-shadow(0 14px 18px rgba(10,20,50,.45))' : 'drop-shadow(0 4px 6px rgba(10,20,50,.25))' }} />
    </motion.div>
  )
}

export default function Brand() {
  const mobile = useIsMobile()
  const [k, setK] = useState(1)
  const [grabbed, setGrabbed] = useState(false)
  const stage = useRef(null)
  const zTop = useRef(20)
  const front = () => ++zTop.current

  const W = mobile ? 820 : 1440
  const H = mobile ? 1560 : 2120
  const m = mobile ? 0.58 : 1 // scale of the banner + card group inside the stage

  useEffect(() => {
    const on = () => setK(window.innerWidth / W)
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [W])

  // pointer position in stage units, whatever the screen scale
  const toStage = (e) => {
    const r = stage.current.getBoundingClientRect()
    const s = r.width / W
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }
  }
  const topT = mobile ? `translate(${8 - 57 * m}px, ${60 * m}px) scale(${m})` : 'none'
  const topOffset = mobile ? { x: 8 - 57 * m, y: 60 * m } : { x: 0, y: 0 }
  // same, but inside the banner + card group (which is scaled on phones)
  const toTop = (e) => {
    const p = toStage(e)
    return { x: (p.x - topOffset.x) / m, y: (p.y - topOffset.y) / m }
  }

  const lower = mobile
    ? [
        { src: 'brand/pol1.webp', alt: 'Polaroid: Komo with huge eyes', left: 24, top: 600, width: 229, delay: 0 },
        { src: 'brand/pol2.webp', alt: 'Polaroid: Komo running', left: 300, top: 585, width: 135, delay: 0.08 },
        { src: 'brand/pol3.webp', alt: 'Polaroid: Komo covered in coffee', left: 545, top: 555, width: 181, delay: 0.16 },
      ]
    : [
        { src: 'brand/pol1.webp', alt: 'Polaroid: Komo with huge eyes', left: 197, top: 1038, width: 318, delay: 0 },
        { src: 'brand/pol2.webp', alt: 'Polaroid: Komo running', left: 654, top: 1013, width: 188, delay: 0.08 },
        { src: 'brand/pol3.webp', alt: 'Polaroid: Komo covered in coffee', left: 978, top: 941, width: 252, delay: 0.16 },
      ]
  const squig = mobile ? { left: 57, top: 890, width: 705 } : { left: 132, top: 1284, width: 1175 }
  const desk = mobile ? { left: 128, top: 940, size: 563 } : { left: 407, top: 1436, size: 626 }

  return (
    <main className="brand" style={{ height: H * k }}>
      <a className="brand-back hand" href="#/">← Home</a>
      <h1 className="sr-only">Krishnan, UIUX graphic designer. Experience should feel epic.</h1>
      <div ref={stage} className="b-stage" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="b-top" style={{ width: TOP_W, height: 960, transform: topT }}>
          <img className="b-fixed" src={asset('brand/banner.webp')} alt="" draggable={false} style={{ left: 150, top: 165, width: 1120, zIndex: 1 }} />
          <Piece src="brand/clover.webp" alt="Komo sticker in a clover" left={31.75} top={103} width={277.5} delay={0.1} toLocal={toTop} front={front} />
          <Piece src="brand/stkR.webp" alt="Komo sticker, gritting teeth" left={1184.75} top={386.75} width={226.5} delay={0.2} toLocal={toTop} front={front} />
          <Piece src="brand/stkL.webp" alt="Komo sticker, smirking" left={395.5} top={669.75} width={242} delay={0.3} toLocal={toTop} front={front} />
          <Lanyard toLocal={toTop} onGrab={() => setGrabbed(true)} />
          <p className="hand b-hint" style={{ opacity: grabbed ? 0 : 1 }}>pull the card!</p>
        </div>
        {lower.map((p) => <Piece key={p.src} {...p} toLocal={toStage} front={front} />)}
        <img className="b-fixed" src={asset('brand/squig.webp')} alt="" draggable={false} style={{ ...squig, zIndex: 1 }} />
        <DeskScene size={desk.size} style={{ position: 'absolute', left: desk.left, top: desk.top, zIndex: 2 }} />
      </div>
    </main>
  )
}
