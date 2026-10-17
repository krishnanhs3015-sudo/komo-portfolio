import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { asset } from '../asset'
import './desk-drop.css'

// The five desk layers fall together and settle into one picture, then idle (flames flicker, monitor blinks).
// All layers share one 2000x2000 canvas, so each is stacked at the same size and offset.
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// bottom to top. rot = tilt while falling, hop = height of the first bounce (canvas px), delay in seconds
const LAYERS = [
  { id: 'monitor', rot: -5, hop: 130, delay: 0.1 },
  { id: 'desk', rot: 2, hop: 70, delay: 0 },
  { id: 'lamp', rot: 9, hop: 190, delay: 0.14 },
  { id: 'book-labels', rot: -14, hop: 240, delay: 0.2 },
  { id: 'fire-character', rot: 3, hop: 100, delay: 0.06 },
]
const FALL = 1.9 // seconds from release to fully settled; first touch-down is at 55% of that
const TIMES = [0, 0.55, 0.72, 0.85, 0.93, 1]
const EASE = ['easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'] // gravity down, slowing up, repeat

// size = side of the square window in px. Falls when `start` is true (or, if left out, when scrolled into view).
// drop = how far above its spot the pieces start, in the same units as size. free = let pieces fall over the page.
export function DeskScene({ size, style, start, drop = 700, free = false }) {
  const [run, setRun] = useState(0)
  const [idle, setIdle] = useState(false)
  const box = useRef(null)
  const seen = useInView(box, { once: true, amount: 0.35 })
  const go = start === undefined ? seen : start
  const still = calm()
  const replay = () => { setIdle(false); setRun((r) => r + 1) }
  const yStart = -drop * (1410 / size) // canvas px

  return (
    <div ref={box} className="dd-window" style={{ width: size, height: size, cursor: 'pointer', overflow: free ? 'visible' : 'hidden', ...style, zIndex: idle || !free ? style?.zIndex : 20 }} onClick={replay}>
      {(go || still) && (
        <div className="dd-stage" key={run} style={{ transform: `scale(${size / 1410}) translate(-230px, -540px)` }}>
          {LAYERS.map((l) => {
            const src = asset(`brand/layers/${l.id}.webp`)
            const fall = still ? {} : {
              initial: { y: yStart, rotate: l.rot },
              animate: {
                y: [yStart, 0, -l.hop, 0, -l.hop * 0.3, 0],
                rotate: [l.rot, 0, -l.rot * 0.15, 0, 0, 0],
                scaleY: [1, 0.9, 1.02, 0.97, 1, 1], // squash on each landing
              },
              transition: { duration: FALL, delay: l.delay, times: TIMES, ease: EASE },
              onAnimationComplete: l.id === 'book-labels' ? () => setIdle(true) : undefined, // last to settle
            }
            const live = idle && !still
            const cls = 'dd-layer'
            if (l.id === 'fire-character') {
              // flames flicker, body stays put: split the layer at the neck (overlapping a little to hide the seam)
              return (
                <motion.div key={l.id} className={cls} {...fall}>
                  <img className="dd-img" src={src} alt="" draggable={false} style={{ clipPath: 'inset(1458px 0 0 0)' }} />
                  <img className={'dd-img' + (live ? ' dd-flame' : '')} src={src} alt="Komo with a head on fire, working at a desk" draggable={false} style={{ clipPath: 'inset(0 0 530px 0)' }} />
                </motion.div>
              )
            }
            if (l.id === 'monitor') {
              return (
                <motion.div key={l.id} className={cls} {...fall}>
                  <img className="dd-img" src={src} alt="" draggable={false} />
                  <i className={'dd-lid' + (live ? ' dd-blink' : '')} style={{ left: 872, top: 586, width: 92, height: 124 }} />
                  <i className={'dd-lid' + (live ? ' dd-blink dd-blink-b' : '')} style={{ left: 970, top: 590, width: 92, height: 124 }} />
                </motion.div>
              )
            }
            return (
              <motion.div key={l.id} className={cls} {...fall}>
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
