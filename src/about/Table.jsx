import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { asset } from '../asset'

// The table, seen from above, built from separate pieces in the 1440x1024 Figma frame (x, y, w, h in frame units).
// The whole frame is fitted to the screen and the cream fills the rest, so nothing is cut off on wide screens.
const W = 1440
const H = 1024
const img = (n) => asset(`brand/about/table/${n}.webp`)
const PIECES = [
  ['mat', 98, 201, 1244, 668],
  ['box', 1222, 723, 240.4, 292],
  ['st1', -27, 717, 178, 188.9],
  ['st2', 0, 602, 177.5, 174.9],
  ['st3', 70, 771, 221.2, 192.7],
]
const SHEETS = [
  ['sheetR', 644, 777, 417, 422],
  ['sheetB', 323, 839, 450.3, 450.3],
]
const SCIS = { x: 1207, y: 47, w: 376.2, h: 354.8, pivot: [199, 161] } // pivot = the screw, in the scissors' own pixels
const CARD = { x: 129, y: 46, w: 317.6, h: 223.7 }
const EYES = { x: 270.2, y: 54.8, w: 74.4, h: 47.7 } // whites + lids sit here; pupils are circles between them
const WHITES = [[17, 23, -3, 0], [55, 31, -4, -1]] // eye-white centre and where the pupil rests (x, y, dx, dy)
const PUPIL = 24
const REACH = 4.5 // how far a pupil can slide inside its eye
// two quick snips: each blade swings toward the other and back
const SNIP = { snip: (side) => ({ rotate: side === 'a' ? [0, -30, 0, -30, 0] : [0, 30, 0, 30, 0], transition: { duration: 1, ease: 'easeInOut' } }) }

export default function Table({ vp, scale }) {
  const portrait = vp.w / vp.h < 0.9
  const s = portrait ? vp.w / 900 : Math.min(vp.w / W, vp.h / H)
  const eyes = useRef(null)
  const pupils = useRef([])
  const snip = useAnimationControls()

  // the card's pupils look toward the cursor
  useEffect(() => {
    const move = (e) => {
      const box = eyes.current?.getBoundingClientRect()
      if (!box) return
      const k = box.width / EYES.w
      WHITES.forEach(([cx, cy, dx, dy], i) => {
        const vx = e.clientX - (box.left + cx * k)
        const vy = e.clientY - (box.top + cy * k)
        const d = Math.hypot(vx, vy) || 1
        const f = Math.min(1, d / (160 * k))
        pupils.current[i]?.style.setProperty('transform', `translate(${(vx / d) * f * REACH + dx}px, ${(vy / d) * f * REACH + dy}px)`)
      })
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const doSnip = () => snip.start('snip')
  const origin = `${SCIS.pivot[0]}px ${SCIS.pivot[1]}px`

  return (
    <section className="ab-slide ab-table" aria-label="About, at the table">
      <motion.div className="ab-table-fit" style={{ scale }}>
        <div className="ab-table-stage" style={{ width: W, height: H, left: (vp.w - W * s) / 2, top: (vp.h - H * s) / 2, transform: `scale(${s})` }}>
          {PIECES.map(([n, x, y, w, h]) => <img key={n} className="tb-img" src={img(n)} alt="" draggable={false} style={{ left: x, top: y, width: w, height: h }} />)}

          <motion.div className="tb-scis" style={{ left: SCIS.x, top: SCIS.y, width: SCIS.w, height: SCIS.h }} onPointerEnter={doSnip} aria-label="Scissors" role="img">
            <motion.img className="tb-img tb-full" src={img('scA')} alt="" draggable={false} custom="a" variants={SNIP} animate={snip} style={{ transformOrigin: origin }} />
            <motion.img className="tb-img tb-full" src={img('scB')} alt="" draggable={false} custom="b" variants={SNIP} animate={snip} style={{ transformOrigin: origin }} />
            <img className="tb-img tb-full" src={img('scP')} alt="" draggable={false} />
          </motion.div>

          {SHEETS.map(([n, x, y, w, h]) => <img key={n} className="tb-img" src={img(n)} alt="" draggable={false} style={{ left: x, top: y, width: w, height: h }} />)}

          <div className="tb-card" style={{ left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h }}>
            <img className="tb-img tb-full" src={img('card')} alt="Komo's photo card with huge eyes" draggable={false} />
            <div ref={eyes} className="tb-eyes" style={{ left: EYES.x - CARD.x, top: EYES.y - CARD.y, width: EYES.w, height: EYES.h }}>
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
