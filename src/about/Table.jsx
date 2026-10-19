import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { asset } from '../asset'

// The table, seen from above, built from separate pieces. Each piece is [x, y, w, h, f]: where it sits, its
// natural size in the 1440x1024 Figma frame, and the scale f it is drawn at. Wide screens use the Figma layout
// (the whole frame is fitted to the screen and the cream fills the rest, so nothing is cut off). Phones held
// upright get their own arrangement in a 420-wide column, because the wide table would be tiny or cropped.
const img = (n) => asset(`brand/about/table/${n}.webp`)
const WIDE = { w: 1440, h: 1024, mat: [98, 201, 1244, 668, 1], box: [1222, 723, 240.4, 292, 1], st1: [-27, 717, 178, 188.9, 1], st2: [0, 602, 177.5, 174.9, 1], st3: [70, 771, 221.2, 192.7, 1], sheetR: [644, 777, 417, 422, 1], sheetB: [323, 839, 450.3, 450.3, 1], scis: [1207, 47, 376.2, 354.8, 1], card: [129, 46, 317.6, 223.7, 1] }
const TALL = { w: 420, h: 760, mat: [16, 190, 388, 440, 1], box: [292, 520, 240.4, 292, 0.5], st1: [-12, 590, 178, 188.9, 0.5], st2: [8, 540, 177.5, 174.9, 0.5], st3: [48, 600, 221.2, 192.7, 0.5], sheetR: [176, 600, 417, 422, 0.45], sheetB: [66, 628, 450.3, 450.3, 0.45], scis: [226, 34, 376.2, 354.8, 0.5], card: [10, 64, 317.6, 223.7, 0.62] }
const SCIS = { pivot: [199, 161] } // the screw, in the scissors' own pixels
const EYES = { x: 270.2 - 129, y: 54.8 - 46, w: 74.4, h: 47.7 } // whites + lids, inside the card; pupils are circles between them
const WHITES = [[17, 23, -3, 0], [55, 31, -4, -1]] // eye-white centre and where the pupil rests (x, y, dx, dy)
const PUPIL = 24
const REACH = 4.5 // how far a pupil can slide inside its eye
// two quick snips: each blade swings toward the other and back
const SNIP = { snip: (side) => ({ rotate: side === 'a' ? [0, -30, 0, -30, 0] : [0, 30, 0, 30, 0], transition: { duration: 1, ease: 'easeInOut' } }) }

const box = ([x, y, w, h, f]) => ({ left: x, top: y, width: w, height: h, transform: `scale(${f})`, transformOrigin: '0 0' })

export default function Table({ vp, scale }) {
  const portrait = vp.w / vp.h < 0.9
  const L = portrait ? TALL : WIDE
  const s = portrait ? vp.w / L.w : Math.min(vp.w / L.w, vp.h / L.h)
  const eyes = useRef(null)
  const pupils = useRef([])
  const snip = useAnimationControls()

  // the card's pupils look toward the cursor (or the finger)
  useEffect(() => {
    const move = (e) => {
      const b = eyes.current?.getBoundingClientRect()
      if (!b) return
      const k = b.width / EYES.w
      WHITES.forEach(([cx, cy, dx, dy], i) => {
        const vx = e.clientX - (b.left + cx * k)
        const vy = e.clientY - (b.top + cy * k)
        const d = Math.hypot(vx, vy) || 1
        const f = Math.min(1, d / (160 * k))
        pupils.current[i]?.style.setProperty('transform', `translate(${(vx / d) * f * REACH + dx}px, ${(vy / d) * f * REACH + dy}px)`)
      })
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const origin = `${SCIS.pivot[0]}px ${SCIS.pivot[1]}px`
  const flat = (n) => <img key={n} className="tb-img tb-full" src={img(n)} alt="" draggable={false} style={box(L[n])} />

  return (
    <section className="ab-slide ab-table" aria-label="About, at the table">
      <motion.div className="ab-table-fit" style={{ scale }}>
        <div className="ab-table-stage" style={{ width: L.w, height: L.h, left: (vp.w - L.w * s) / 2, top: (vp.h - L.h * s) / 2, transform: `scale(${s})` }}>
          {portrait ? <div className="tb-mat" style={box(L.mat)} /> : flat('mat')}
          {['box', 'st1', 'st2', 'st3'].map(flat)}

          <motion.div className="tb-scis" style={box(L.scis)} onPointerEnter={() => snip.start('snip')} aria-label="Scissors" role="img">
            <motion.img className="tb-img tb-full" src={img('scA')} alt="" draggable={false} custom="a" variants={SNIP} animate={snip} style={{ transformOrigin: origin }} />
            <motion.img className="tb-img tb-full" src={img('scB')} alt="" draggable={false} custom="b" variants={SNIP} animate={snip} style={{ transformOrigin: origin }} />
            <img className="tb-img tb-full" src={img('scP')} alt="" draggable={false} />
          </motion.div>

          {['sheetR', 'sheetB'].map(flat)}

          <div className="tb-card" style={box(L.card)}>
            <img className="tb-img tb-full" src={img('card')} alt="Komo's photo card with huge eyes" draggable={false} />
            <div ref={eyes} className="tb-eyes" style={{ left: EYES.x, top: EYES.y, width: EYES.w, height: EYES.h }}>
              <img className="tb-img tb-full" src={img('eyeW')} alt="" draggable={false} />
              {WHITES.map(([cx, cy, dx, dy], i) => (
                <i key={i} ref={(el) => { pupils.current[i] = el }} className="tb-pupil"
                  style={{ left: cx - PUPIL / 2, top: cy - PUPIL / 2, width: PUPIL, height: PUPIL, transform: `translate(${dx}px, ${dy}px)` }} />
              ))}
              <img className="tb-img tb-full" src={img('eyeL')} alt="" draggable={false} />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
