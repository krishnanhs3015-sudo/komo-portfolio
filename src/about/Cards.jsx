import { motion, useTransform } from 'framer-motion'
import { asset } from '../asset'

// Story cards placed on the table by a hand, scrubbed by scroll. Everything is in the 1440x1024 Figma frame
// ("About slide to interest table ..." frames). Per card: where it lands (x, y, w, h, tilt), where the hand grips it
// (hand origin relative to the card), the side it comes in from, and where the hand leaves to.
// The hand is two images: the hand without its thumb sits under the card, the thumb sits on top of it.
export const CARDS = [
  { x: 836, y: 349, w: 353, h: 353, rot: 4.3, fill: '#d9d9d9', grip: [153, 210], from: [520, 700], exit: [20, 780],
    text: 'Hi I’m Krishnan! A designer specialising in the realms of creating experiences in UIUX, branding and graphics. Striving to change how adaptable is catered to people.' },
  { x: 612, y: 222, w: 353, h: 606, rot: 4.3, fill: '#a9cf50', grip: [172, 462], from: [-90, 780], exit: [260, 760] },
]
const HAND = { w: 299, h: 485, rot: 17.8 }
const THUMB = { dx: 25, dy: -39, w: 127, h: 242, pivot: '63px 222px' } // thumb origin relative to the hand; pivot = its base joint
const TEXT = { x: 236, y: 410, w: 560 } // where a card's story appears (wide screens)
const MAT = { x: 98, y: 201, w: 1244, h: 668 }

// one card's timeline, u = 0..1 across its slice of the scroll
//   0 → .40  hand carries the card in, held up a little (bigger shadow)
//  .40 → .62 presses it down, the card settles with a small bounce
//  .52 → .66 the thumb lifts off the card
//  .62 → 1   the hand slides away; the card stays
function Card({ c, p, span }) {
  const u = useTransform(p, span, [0, 1], { clamp: true })
  const shown = useTransform(u, (v) => (v > 0.001 ? 1 : 0))
  const handShown = useTransform(u, (v) => (v > 0.001 && v < 0.985 ? 1 : 0)) // the hand is gone once it has left
  const cx = useTransform(u, [0, 0.4], [c.from[0], 0], { clamp: true })
  const cy = useTransform(u, [0, 0.4], [c.from[1], 0], { clamp: true })
  const lift = useTransform(u, [0, 0.4, 0.5, 0.56, 0.62], [1.05, 1.05, 0.985, 1.01, 1])
  const shadow = useTransform(u, [0.38, 0.5], [1, 0])
  const shadowCss = useTransform(shadow, (k) => `drop-shadow(0 ${4 + 26 * k}px ${6 + 30 * k}px rgba(16, 24, 48, ${0.25 + 0.15 * k}))`)
  const press = useTransform(u, [0.4, 0.48, 0.56], [0, 8, 0])
  const ex = useTransform(u, [0.62, 1], [0, c.exit[0]], { ease: (t) => t * t })
  const ey = useTransform(u, [0.62, 1], [0, c.exit[1]], { ease: (t) => t * t })
  const hx = useTransform([cx, ex], ([a, b]) => a + b)
  const hy = useTransform([cy, ey, press], ([a, b, d]) => a + b + d)
  const thumbRot = useTransform(u, [0.52, 0.66], [0, 22], { clamp: true })
  const thumbScale = useTransform(u, [0.52, 0.66], [1, 1.07], { clamp: true })

  const handBox = { left: c.x + c.grip[0], top: c.y + c.grip[1], width: HAND.w, height: HAND.h }
  const thumbBox = { left: c.x + c.grip[0] + THUMB.dx, top: c.y + c.grip[1] + THUMB.dy, width: THUMB.w, height: THUMB.h }
  return (
    <>
      <motion.img className="tb-hand" src={asset('brand/about/table/hand.webp')} alt="" draggable={false}
        style={{ ...handBox, x: hx, y: hy, rotate: -HAND.rot, opacity: handShown, transformOrigin: '0 0' }} />
      <motion.div className="tb-story" style={{ left: c.x, top: c.y, width: c.w, height: c.h, x: cx, y: cy, rotate: -c.rot, opacity: shown, transformOrigin: '0 0' }}>
        <motion.div className="tb-story-card" style={{ background: c.fill, scale: lift, filter: shadowCss }} />
      </motion.div>
      <motion.div className="tb-thumb-wrap" style={{ ...thumbBox, x: hx, y: hy, rotate: -HAND.rot, opacity: handShown, transformOrigin: '0 0' }}>
        <motion.img className="tb-thumb" src={asset('brand/about/table/thumb.webp')} alt="" draggable={false}
          style={{ rotate: thumbRot, scale: thumbScale, transformOrigin: THUMB.pivot }} />
      </motion.div>
    </>
  )
}

// a card's story shows once it is down and fades as the next card comes over it
function Story({ c, p, span, next, portrait }) {
  const [s, e] = span
  const L = e - s
  const keys = next ? [s + 0.66 * L, s + 0.82 * L, next[0] + 0.22 * (next[1] - next[0]), next[0] + 0.38 * (next[1] - next[0])] : [s + 0.66 * L, s + 0.82 * L]
  const opacity = useTransform(p, keys, next ? [0, 1, 1, 0] : [0, 1])
  const y = useTransform(opacity, [0, 1], [12, 0])
  return (
    <motion.p className="tb-text hand" style={portrait ? { left: 24, top: 548, width: 372, fontSize: 19, opacity, y } : { left: TEXT.x, top: TEXT.y, width: TEXT.w, opacity, y }}>
      {c.text}
    </motion.p>
  )
}

// spans: [start, end] scroll progress for each card
export default function Cards({ p, spans, portrait }) {
  // on phones the wide mat is shrunk to fit the portrait mat (16, 190, 388 x 440 in the 420-wide layout)
  const k = 388 / MAT.w
  const group = portrait
    ? { transform: `translate(${16 - MAT.x * k}px, ${190 + (440 - MAT.h * k) / 2 - MAT.y * k}px) scale(${k})`, transformOrigin: '0 0' }
    : {}
  return (
    <>
      <div className="tb-cards" style={group}>
        {CARDS.map((c, i) => <Card key={i} c={c} p={p} span={spans[i]} />)}
      </div>
      {CARDS.map((c, i) => c.text && <Story key={'t' + i} c={c} p={p} span={spans[i]} next={spans[i + 1]} portrait={portrait} />)}
    </>
  )
}
