import { motion } from 'framer-motion'

// A simple placeholder waving arm (sleeve + hand) in Komo's colours, drawn in a 300x560 box.
// The whole arm swings from the shoulder (bottom of the box); the hand flutters at the wrist.
// Swap this file's drawing for your own artwork later: the motion values stay the same.
const LINE = '#2b4a8a'
const SKIN = '#f3d6c4'
const SLEEVE = '#5c85c6'
const W = 5

export const ARM_W = 300
export const ARM_H = 560
const WRIST = { x: 150, y: 318 }

export default function Arm({ left, top, y, swing, flutter }) {
  return (
    <motion.div className="arm" aria-hidden="true"
      style={{ left, top, width: ARM_W, height: ARM_H, y, rotate: swing, transformOrigin: '150px 560px' }}>
      <svg className="arm-sleeve" viewBox={`0 0 ${ARM_W} ${ARM_H}`} width={ARM_W} height={ARM_H}>
        <path d="M96 570 L100 336 Q150 312 200 336 L204 570 Z" fill={SLEEVE} stroke={LINE} strokeWidth={W} strokeLinejoin="round" />
        <path d="M118 420 Q150 436 182 420" fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" opacity=".45" />
      </svg>
      <motion.svg className="arm-hand" viewBox="0 0 300 340" width="300" height="340"
        style={{ rotate: flutter, transformOrigin: `${WRIST.x}px ${WRIST.y}px` }}>
        {/* cuff */}
        <rect x="94" y="296" width="112" height="40" rx="14" fill="#f4ede0" stroke={LINE} strokeWidth={W} />
        {/* fingers, fanned out behind the palm */}
        <g fill={SKIN} stroke={LINE} strokeWidth={W} strokeLinejoin="round">
          <rect x="92" y="96" width="30" height="120" rx="15" transform="rotate(-16 107 216)" />
          <rect x="123" y="66" width="30" height="140" rx="15" transform="rotate(-5 138 206)" />
          <rect x="155" y="64" width="30" height="140" rx="15" transform="rotate(5 170 204)" />
          <rect x="186" y="92" width="30" height="120" rx="15" transform="rotate(17 201 212)" />
          {/* thumb */}
          <rect x="50" y="196" width="32" height="92" rx="16" transform="rotate(-52 66 280)" />
          {/* palm */}
          <ellipse cx="150" cy="234" rx="66" ry="64" />
        </g>
        {/* little highlights so it reads as a hand, not a glove */}
        <g fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" opacity=".4">
          <path d="M138 190 Q140 210 138 228" />
          <path d="M168 190 Q170 210 168 228" />
        </g>
      </motion.svg>
    </motion.div>
  )
}
