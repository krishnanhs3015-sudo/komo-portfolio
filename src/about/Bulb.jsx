import { useEffect, useRef } from 'react'
import { motion, useTransform } from 'framer-motion'

// Hanging bulb + the darkness it cuts through, drawn in the 1440x1024 About stage.
// light (0..1) = how bright the bulb is; fade (0..1) = scroll fade for the darkness and beam;
// swing = degrees the bulb and its beam hang off vertical.
// The darkness is one huge navy rect with the lit area masked out, so it covers the whole screen.
const X = 720 // bulb centre
const Y = 6 // top of the socket
const PIVOT = -500 // where the cord swings from, above the screen
const BIG = { x: -4000, y: -4000, width: 9440, height: 9024 }
const CONE = `${X - 46},${Y + 160} ${X + 46},${Y + 160} ${X + 350},1012 ${X - 350},1012`
const GLASS = 'M -28 57 C -28 85, -59 105, -59 142 A 59 59 0 0 0 59 142 C 59 105, 28 85, 28 57 Z'

// SVG transform attribute driven by a motion value (style transforms on SVG fight the pivot)
function useSwing(swing) {
  const refs = useRef([])
  useEffect(() => {
    const set = (a) => refs.current.forEach((el) => el?.setAttribute('transform', `rotate(${a} ${X} ${PIVOT})`))
    set(swing.get())
    return swing.on('change', set)
  }, [swing])
  return (i) => (el) => { refs.current[i] = el }
}

export default function Bulb({ light, fade, swing }) {
  const dark = useTransform(fade, (f) => f * 0.8)
  const beam = useTransform([light, fade], ([l, f]) => l * f * 0.14)
  const hang = useSwing(swing)

  return (
    <svg className="ab-light" width="1440" height="1024" viewBox="0 0 1440 1024" aria-hidden="true">
      <defs>
        <radialGradient id="ab-halo-m">
          <stop offset="0.5" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <radialGradient id="ab-glow">
          <stop offset="0" stopColor="#ffe3a3" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe3a3" stopOpacity="0" />
        </radialGradient>
        <filter id="ab-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        <mask id="ab-lit" maskUnits="userSpaceOnUse" {...BIG}>
          <rect {...BIG} fill="#fff" />
          <motion.g style={{ opacity: light }}>
            <g ref={hang(0)}>
              <circle cx={X} cy={Y + 150} r="470" fill="url(#ab-halo-m)" />
              <polygon points={CONE} fill="#000" filter="url(#ab-soft)" />
            </g>
            <ellipse cx={X} cy="1012" rx="360" ry="46" fill="#000" filter="url(#ab-soft)" />
          </motion.g>
        </mask>
      </defs>

      {/* the dark room, with the lit area cut out */}
      <motion.rect {...BIG} fill="#0b1226" mask="url(#ab-lit)" style={{ opacity: dark }} />

      <g ref={hang(1)}>
        {/* the visible beam */}
        <motion.polygon points={CONE} fill="#fff4e2" style={{ opacity: beam }} />

        {/* cord, socket, glass */}
        <g transform={`translate(${X} ${Y})`}>
          <motion.circle cy="142" r="150" fill="url(#ab-glow)" style={{ opacity: light }} />
          <rect x="-5" y="-4000" width="10" height="4002" fill="#1c2748" />
          <rect x="-29" y="0" width="58" height="28" fill="#1c2748" />
          <rect x="-44" y="25" width="88" height="34" fill="#1c2748" />
          <path d={GLASS} fill="#3a4466" />
          <motion.path d={GLASS} fill="#fff4e2" style={{ opacity: light }} />
        </g>
      </g>
    </svg>
  )
}

// the pool of light on the floor, drawn behind the desk so it reads as floor, not as a tint on Komo
export function Pool({ light, fade }) {
  const pool = useTransform([light, fade], ([l, f]) => l * f * 0.22)
  return (
    <svg className="ab-light" width="1440" height="1024" viewBox="0 0 1440 1024" aria-hidden="true">
      <motion.ellipse cx={X} cy="1004" rx="350" ry="38" fill="#fff4e2" style={{ opacity: pool }} />
    </svg>
  )
}
