import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { asset } from '../asset'
import './desk-drop.css'

// The five desk layers fall together and settle into one picture, then idle (flames flicker, monitor blinks).
// All layers share one 2000x2000 canvas, so each is stacked at the same size and offset.
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// bottom to top. rot = tilt while falling; k/c = spring stiffness/damping
const LAYERS = [
  { id: 'monitor', rot: -5, k: 95, c: 9, delay: 0.1 },
  { id: 'desk', rot: 2, k: 150, c: 13, delay: 0 },
  { id: 'lamp', rot: 9, k: 110, c: 8, delay: 0.14 },
  { id: 'book-labels', rot: -14, k: 120, c: 7, delay: 0.22 },
  { id: 'fire-character', rot: 3, k: 130, c: 10, delay: 0.06 },
]

// size = side of the square window in px. Starts when scrolled into view; click to replay.
export function DeskScene({ size, style }) {
  const [run, setRun] = useState(0)
  const [idle, setIdle] = useState(false)
  const box = useRef(null)
  const seen = useInView(box, { once: true, amount: 0.35 })
  const still = calm()
  const replay = () => { setIdle(false); setRun((r) => r + 1) }

  return (
    <div ref={box} className="dd-window" style={{ width: size, height: size, cursor: 'pointer', ...style }} onClick={replay}>
      {(seen || still) && (
        <div className="dd-stage" key={run} style={{ transform: `scale(${size / 1410}) translate(-230px, -540px)` }}>
          {LAYERS.map((l) => {
            const src = asset(`brand/layers/${l.id}.webp`)
            const fall = {
              initial: still ? false : { y: -1900, rotate: l.rot },
              animate: { y: 0, rotate: 0 },
              transition: { type: 'spring', stiffness: l.k, damping: l.c, delay: l.delay },
              onAnimationComplete: l.id === 'fire-character' ? () => setIdle(true) : undefined, // last to settle
            }
            const live = idle && !still
            if (l.id === 'fire-character') {
              // flames flicker, body stays put: split the layer at the neck (overlapping a little to hide the seam)
              return (
                <motion.div key={l.id} className="dd-layer" {...fall}>
                  <img className="dd-img" src={src} alt="" draggable={false} style={{ clipPath: 'inset(1458px 0 0 0)' }} />
                  <img className={'dd-img' + (live ? ' dd-flame' : '')} src={src} alt="Komo with a head on fire, working at a desk" draggable={false} style={{ clipPath: 'inset(0 0 530px 0)' }} />
                </motion.div>
              )
            }
            if (l.id === 'monitor') {
              return (
                <motion.div key={l.id} className="dd-layer" {...fall}>
                  <img className="dd-img" src={src} alt="" draggable={false} />
                  <i className={'dd-lid' + (live ? ' dd-blink' : '')} style={{ left: 872, top: 586, width: 92, height: 124 }} />
                  <i className={'dd-lid' + (live ? ' dd-blink dd-blink-b' : '')} style={{ left: 970, top: 590, width: 92, height: 124 }} />
                </motion.div>
              )
            }
            return (
              <motion.div key={l.id} className="dd-layer" {...fall}>
                <img className="dd-img" src={src} alt="" draggable={false} />
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// hidden test page (#/test)
export default function DeskDrop() {
  const [size, setSize] = useState(600)
  useEffect(() => {
    const on = () => setSize(Math.min(window.innerWidth * 0.88, window.innerHeight * 0.82))
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return (
    <main className="dd">
      <DeskScene size={size} />
      <p className="dd-hint hand">click to replay</p>
    </main>
  )
}
