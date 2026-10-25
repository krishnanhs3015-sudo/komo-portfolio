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
const HAND = { w: 299, h: 985, rot: 17.8 } // hand-long.webp: the drawing plus a straight wrist extension, so the cut edge stays off screen
// The thumb is drawn in the hand's own (rotated) frame, so both always move together.
// In Figma the thumb's origin is (25, -39) from the hand's in frame space; undoing the 17.8° tilt gives this offset.
const THUMB = { x: 35.7, y: -29.5, w: 127, h: 242, pivot: '63px 222px' } // pivot = the thumb's base joint
const WRIST = '150px 470px' // where the hand turns as it pulls away
const TEXT = { x: 236, y: 410, w: 560 } // where a card's story appears (wide screens)
const MAT = { x: 98, y: 201, w: 1244, h: 668 }
const easeOut = (t) => 1 - (1 - t) * (1 - t)
const easeIn = (t) => t * t

// one card's timeline, u = 0..1 across its slice of the scroll
//   0 → .40  hand carries the card in on a curve, turning a few degrees, held up a little (bigger shadow)
//  .40 → .62 presses it down, the card settles with a small bounce
//  .50 → .66 the thumb lifts up and back off the card
//  .64 → 1   the hand pulls away on a curve, turning at the wrist; the card stays
function Card({ c, p, span }) {
  const u = useTransform(p, span, [0, 1], { clamp: true })
  const shown = useTransform(u, (v) => (v > 0.001 ? 1 : 0))
  const handShown = useTransform(u, (v) => (v > 0.001 && v < 0.985 ? 1 : 0)) // the hand is gone once it has left
  // the card and hand travel together (an "orbit" layer per piece, all with the same transform, so the card can sit
  // between the hand and the thumb). x eases out and y eases in, which bends the path into a curve.
  const ox = useTransform(u, [0, 0.4], [c.from[0], 0], { clamp: true, ease: easeOut })
  const oyBase = useTransform(u, [0, 0.4], [c.from[1], 0], { clamp: true, ease: easeIn })
  const press = useTransform(u, [0.4, 0.48, 0.56], [0, 7, 0])
  const oy = useTransform([oyBase, press], ([a, b]) => a + b)
  const turn = useTransform(u, [0, 0.4], [c.turn ?? 9, 0], { clamp: true, ease: easeOut })
  const gripAt = `${c.x + c.grip[0]}px ${c.y + c.grip[1]}px`
  const orbit = { x: ox, y: oy, rotate: turn, transformOrigin: gripAt }
  // the card itself: held up, then lands with a small bounce. Light comes from the hand's side, so the shadow falls away from it.
  const lift = useTransform(u, [0, 0.4, 0.5, 0.56, 0.62], [1.05, 1.05, 0.985, 1.01, 1])
  const shadow = useTransform(u, [0.36, 0.5], [1, 0])
  const shadowCss = useTransform(shadow, (k) => `drop-shadow(${-3 - 14 * k}px ${-4 - 18 * k}px ${5 + 22 * k}px rgba(16, 24, 48, ${0.22 + 0.12 * k}))`)
  // the hand leaving
  const hx = useTransform(u, [0.64, 1], [0, c.exit[0]], { clamp: true, ease: easeIn })
  const hy = useTransform(u, [0.64, 1], [0, c.exit[1]], { clamp: true, ease: (t) => t * t * (3 - 2 * t) })
  const wrist = useTransform(u, [0.64, 1], [0, c.exitTurn ?? 8], { clamp: true })
  // the thumb lifting up and back: tilts away from the card and grows a little (coming toward the camera)
  const tRot = useTransform(u, [0.4, 0.48, 0.5, 0.66], [0, -2, -2, 16], { clamp: true })
  const tScale = useTransform(u, [0.4, 0.48, 0.5, 0.66], [1, 0.98, 0.98, 1.09], { clamp: true })
  const tLift = useTransform(u, [0.5, 0.66], [0, -7], { clamp: true })

  const handBox = { left: c.x + c.grip[0], top: c.y + c.grip[1], width: HAND.w, height: HAND.h }
  const rig = (children) => (
    <motion.div className="tb-orbit" style={{ ...orbit, opacity: handShown }}>
      <motion.div className="tb-rig" style={{ ...handBox, x: hx, y: hy, rotate: -HAND.rot, transformOrigin: '0 0' }}>
        <motion.div className="tb-rig-inner" style={{ rotate: wrist, transformOrigin: WRIST }}>{children}</motion.div>
      </motion.div>
    </motion.div>
  )
  return (
    <>
      {rig(<img className="tb-hand" src={asset('brand/about/table/hand-long.webp')} alt="" draggable={false} />)}
      <motion.div className="tb-orbit" style={{ ...orbit, opacity: shown }}>
        <div className="tb-story" style={{ left: c.x, top: c.y, width: c.w, height: c.h, transform: `rotate(${-c.rot}deg)`, transformOrigin: '0 0' }}>
          <motion.div className="tb-story-card" style={{ background: c.fill, scale: lift, filter: shadowCss }} />
        </div>
      </motion.div>
      {rig(
        <motion.img className="tb-thumb" src={asset('brand/about/table/thumb.webp')} alt="" draggable={false}
          style={{ left: THUMB.x, top: THUMB.y, width: THUMB.w, height: THUMB.h, rotate: tRot, scale: tScale, y: tLift, transformOrigin: THUMB.pivot }} />,
      )}
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
