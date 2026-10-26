import { useMemo } from 'react'
import { motion, useTransform } from 'framer-motion'
import { asset } from '../asset'

// Story cards placed on the table by one hand, scrubbed by scroll. All numbers are in the 1440x1024 Figma frame.
// The hand never leaves between cards: it puts a card down, lifts its thumb, dips to the table's edge to pick up
// the next card, and carries it to its spot. Card spots are scattered at random over the mat on every visit.
// The hand is two images: the hand without its thumb sits under the card, the thumb sits on top of it.

// Add, remove or reorder cards here. w/h = size, fill = placeholder colour (a picture goes here later), text = optional story
// shown beside the card until the next card lands.
export const STORIES = [
  { w: 353, h: 353, fill: '#d9d9d9', text: 'Hi I’m Krishnan! A designer specialising in the realms of creating experiences in UIUX, branding and graphics. Striving to change how adaptable is catered to people.' },
  { w: 300, h: 480, fill: '#a9cf50' },
  { w: 290, h: 290, fill: '#e36547' },
  { w: 380, h: 260, fill: '#8fb0dd' },
  { w: 260, h: 370, fill: '#fff4e2' },
]

const HAND = { w: 299, h: 985 } // hand-long.webp: the drawing plus a straight wrist, so the cut edge stays off screen
const HAND_TILT = 13.5 // the hand sits this many degrees more tilted than the card it holds (from Figma)
const GRIP_Y = 132 // the hand origin sits this far above the card's bottom edge, in the card's own frame (from Figma)
const THUMB = { x: 35.7, y: -29.5, w: 127, h: 242, pivot: '63px 222px' } // in the hand's frame; pivot = the thumb's base joint
const TEXT = { x: 236, y: 410, w: 520 } // where the first card's story appears (wide screens)
const MAT = { x: 98, y: 201, w: 1244, h: 668 }
const SHADOW = 'rgba(28, 39, 72, .38)'

const easeOut = (t) => 1 - (1 - t) * (1 - t)
const easeIn = (t) => t * t
const smooth = (t) => t * t * (3 - 2 * t)
const mix = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))
const seg = (u, a, b) => clamp01((u - a) / (b - a))

// small seeded random, so one visit's layout stays put while you scroll
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// scatter the cards over the mat: try many random spots and keep the one that overlaps the others least
// (some overlap is fine, it reads as a collage). The first card stays on the right so its story fits on the left.
function scatter(seed) {
  const r = rng(seed)
  const pad = 30
  const placed = []
  return STORIES.map((c, i) => {
    let best = null
    for (let k = 0; k < 90; k++) {
      const minX = i === 0 ? 760 : MAT.x + pad
      const x = mix(minX, MAT.x + MAT.w - pad - c.w, r())
      const y = mix(MAT.y + pad, MAT.y + MAT.h - pad - c.h, r())
      const box = { x, y, w: c.w, h: c.h }
      let overlap = 0
      placed.forEach((b) => {
        const ox = Math.max(0, Math.min(box.x + box.w, b.x + b.w) - Math.max(box.x, b.x))
        const oy = Math.max(0, Math.min(box.y + box.h, b.y + b.h) - Math.max(box.y, b.y))
        overlap += ox * oy
      })
      const score = overlap / (c.w * c.h) + r() * 0.05
      if (!best || score < best.score) best = { ...box, score }
    }
    placed.push(best)
    return { x: best.x, y: best.y, rot: mix(-9, 9, r()), from: mix(-140, 140, r()) }
  })
}

// CSS rotate: where a point (gx, gy) in an element's own frame lands after rotating by a degrees around its corner
const turn = (gx, gy, a) => {
  const t = (a * Math.PI) / 180
  return [gx * Math.cos(t) - gy * Math.sin(t), gx * Math.sin(t) + gy * Math.cos(t)]
}

// the card's pose: in its spot, or lifted and carried from below the table's edge
function cardPose(c, spot, carry) {
  const lift = 1 - carry // 1 = still at the pick-up point
  const x = spot.x + spot.from * easeOut(lift)
  const y = spot.y + (1100 - spot.y) * easeIn(lift) // starts off the bottom of the table
  const a = -spot.rot - 8 * easeOut(lift) // turns a few degrees as it travels
  return { x, y, a }
}
// where the hand is when it holds a card in that pose
function handOn(c, pose) {
  const [dx, dy] = turn(Math.min(137, 0.39 * c.w), c.h - GRIP_Y, pose.a)
  return { x: pose.x + dx, y: pose.y + dy, a: pose.a - HAND_TILT }
}

// the whole sequence at scroll progress v: every card's pose, the hand's pose, and which card the hand is on
function frameAt(v, spans, spots) {
  const n = STORIES.length
  let i = spans.findIndex(([, e]) => v < e)
  if (i < 0) i = n - 1
  const u = seg(v, spans[i][0], spans[i][1])
  const cards = STORIES.map((c, j) => {
    const carry = j < i ? 1 : j > i ? 0 : smooth(seg(u, 0, 0.42))
    const pose = cardPose(c, spots[j], carry)
    // land: a small squash and bounce, the flat shadow shrinks as it touches down
    const land = j < i ? 1 : j > i ? 0 : seg(u, 0.38, 0.6)
    const scale = j === i ? (u < 0.42 ? 1.05 : u < 0.5 ? mix(1.05, 0.985, seg(u, 0.42, 0.5)) : u < 0.56 ? mix(0.985, 1.01, seg(u, 0.5, 0.56)) : mix(1.01, 1, seg(u, 0.56, 0.62))) : 1
    return { ...pose, scale, shadow: mix(16, 6, smooth(land)), shown: j < i || (j === i && v >= spans[i][0]) }
  })
  // the hand: rides with card i, lets go, then glides down to where card i+1 waits (or off the table after the last card)
  const held = handOn(STORIES[i], cards[i])
  let hand = held
  const leave = seg(u, 0.66, 1)
  if (leave > 0) {
    const next = i + 1 < n ? handOn(STORIES[i + 1], cardPose(STORIES[i + 1], spots[i + 1], 0)) : { x: held.x + 160, y: 1500, a: held.a + 10 }
    const t = smooth(leave)
    // a curve: across first, then down
    hand = { x: mix(held.x, next.x, easeOut(t)), y: mix(held.y, next.y, easeIn(t)) - 60 * Math.sin(Math.PI * t), a: mix(held.a, next.a, t) }
  }
  const thumb = u < 0.42 ? 0 : u < 0.5 ? -2 * seg(u, 0.42, 0.5) : u < 0.66 ? mix(-2, 16, seg(u, 0.5, 0.66)) : mix(16, 0, seg(u, 0.88, 1))
  const thumbScale = u < 0.5 ? 1 : u < 0.66 ? mix(0.98, 1.09, seg(u, 0.5, 0.66)) : mix(1.09, 1, seg(u, 0.88, 1))
  const thumbLift = u < 0.5 ? 0 : u < 0.66 ? -7 * seg(u, 0.5, 0.66) : -7 * (1 - seg(u, 0.88, 1))
  const handOff = v >= spans[n - 1][1] - 0.0005 || v < spans[0][0]
  // the hand slides under the card it holds; after letting go it moves on to the next card's layer
  const z = (u < 0.97 ? i : Math.min(i + 1, n - 1)) * 3
  return { cards, hand, thumb, thumbScale, thumbLift, handOff, z }
}

function CardView({ c, j, f }) {
  const x = useTransform(f, (s) => s.cards[j].x)
  const y = useTransform(f, (s) => s.cards[j].y)
  const rotate = useTransform(f, (s) => s.cards[j].a)
  const scale = useTransform(f, (s) => s.cards[j].scale)
  const opacity = useTransform(f, (s) => (s.cards[j].shown ? 1 : 0))
  const boxShadow = useTransform(f, (s) => `${s.cards[j].shadow}px ${s.cards[j].shadow * 1.15}px 0 ${SHADOW}`)
  return (
    <motion.div className="tb-story" style={{ width: c.w, height: c.h, x, y, rotate, opacity, zIndex: j * 3 + 1, transformOrigin: '0 0' }}>
      <motion.div className="tb-story-card" style={{ background: c.fill, scale, boxShadow }} />
    </motion.div>
  )
}

function Hand({ f }) {
  const x = useTransform(f, (s) => s.hand.x)
  const y = useTransform(f, (s) => s.hand.y)
  const rotate = useTransform(f, (s) => s.hand.a)
  const opacity = useTransform(f, (s) => (s.handOff ? 0 : 1))
  const zBase = useTransform(f, (s) => s.z)
  const zThumb = useTransform(f, (s) => s.z + 2)
  const tRot = useTransform(f, (s) => s.thumb)
  const tScale = useTransform(f, (s) => s.thumbScale)
  const tLift = useTransform(f, (s) => s.thumbLift)
  const rig = { width: HAND.w, height: HAND.h, x, y, rotate, opacity, transformOrigin: '0 0' }
  return (
    <>
      <motion.div className="tb-rig" style={{ ...rig, zIndex: zBase }}>
        <img className="tb-hand" src={asset('brand/about/table/hand-long.webp')} alt="" draggable={false} />
      </motion.div>
      <motion.div className="tb-rig" style={{ ...rig, zIndex: zThumb }}>
        <motion.img className="tb-thumb" src={asset('brand/about/table/thumb.webp')} alt="" draggable={false}
          style={{ left: THUMB.x, top: THUMB.y, width: THUMB.w, height: THUMB.h, rotate: tRot, scale: tScale, y: tLift, transformOrigin: THUMB.pivot }} />
      </motion.div>
    </>
  )
}

// the first card's story shows once it is down and fades as the next card comes in
function Story({ p, spans, portrait }) {
  const [s, e] = spans[0]
  const L = e - s
  const next = spans[1]
  const keys = next ? [s + 0.66 * L, s + 0.82 * L, next[0] + 0.25 * (next[1] - next[0]), next[0] + 0.4 * (next[1] - next[0])] : [s + 0.66 * L, s + 0.82 * L]
  const opacity = useTransform(p, keys, next ? [0, 1, 1, 0] : [0, 1])
  const y = useTransform(opacity, [0, 1], [12, 0])
  return (
    <motion.p className="tb-text hand" style={portrait ? { left: 24, top: 548, width: 372, fontSize: 19, opacity, y } : { left: TEXT.x, top: TEXT.y, width: TEXT.w, opacity, y }}>
      {STORIES[0].text}
    </motion.p>
  )
}

// spans: [start, end] scroll progress for each card
export default function Cards({ p, spans, portrait }) {
  const spots = useMemo(() => scatter(Math.floor(Math.random() * 1e9)), []) // a new layout on every visit
  const f = useTransform(p, (v) => frameAt(v, spans, spots))
  // on phones the wide mat is shrunk to fit the portrait mat (16, 190, 388 x 440 in the 420-wide layout)
  const k = 388 / MAT.w
  const group = portrait
    ? { transform: `translate(${16 - MAT.x * k}px, ${190 + (440 - MAT.h * k) / 2 - MAT.y * k}px) scale(${k})`, transformOrigin: '0 0' }
    : {}
  return (
    <>
      <div className="tb-cards" style={group}>
        {STORIES.map((c, j) => <CardView key={j} c={c} j={j} f={f} />)}
        <Hand f={f} />
      </div>
      {STORIES[0].text && <Story p={p} spans={spans} portrait={portrait} />}
    </>
  )
}
