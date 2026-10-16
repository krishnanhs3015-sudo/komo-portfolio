import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { NAMES, SPOTS, SWATCH } from './data'
import useIsMobile from '../useIsMobile'

// full-screen gallery for one category: polaroid cards scatter out of the middle, then you pick one
const GW = 1440
const GH = 1080

export default function Gallery({ cat, onClose }) {
  const mobile = useIsMobile()
  const [fit, setFit] = useState(1)
  const closeRef = useRef(null)

  useEffect(() => {
    const update = () => setFit(Math.min(window.innerWidth / GW, window.innerHeight / GH))
    update()
    window.addEventListener('resize', update)
    const key = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    closeRef.current?.focus()
    return () => { window.removeEventListener('resize', update); window.removeEventListener('keydown', key) }
  }, [onClose])

  if (mobile) {
    return (
      <motion.div className="m-gallery" role="dialog" aria-modal="true" aria-label={cat.gallery + ' projects'}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="mg-top">
          <div><p className="mono mg-eyebrow">LATEST</p><h2 className="display mg-heading">{cat.gallery}</h2></div>
          <button ref={closeRef} className="mg-close mono" onClick={onClose}>CLOSE
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M0 0L14 14M14 0L0 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p className="hand mg-sub">Pick one to see the full story</p>
        <div className="mg-grid">
          {NAMES.map((name, i) => (
            <motion.a key={i} className="mg-card" href={`#/project/${cat.id}-${i + 1}`}
              initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 + i * 0.06 }}>
              <span className="mg-img" style={{ background: SWATCH[i] }}><b className="display">{String(i + 1).padStart(2, '0')}</b></span>
              <span className="hand mg-title">{name}</span>
              <span className="mono mg-meta">{cat.title} · 2025</span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="gallery" role="dialog" aria-modal="true" aria-label={cat.gallery + ' projects'}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="gallery-stage" style={{ width: GW, height: GH, transform: `translate(-50%, -50%) scale(${fit})` }}>
        <p className="mono g-eyebrow">LATEST</p>
        <h2 className="display g-heading">{cat.gallery}</h2>
        <p className="hand g-sub">Pick one to see the full story</p>
        <button ref={closeRef} className="g-close mono" onClick={onClose}>
          CLOSE
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M0 0L14 14M14 0L0 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        </button>

        {SPOTS.map(([x, y, rot], i) => (
          <motion.a key={i} className="polaroid" href={`#/project/${cat.id}-${i + 1}`}
            initial={{ opacity: 0, x: 555 - x, y: 330 - y, rotate: 0, scale: 0.6 }} animate={{ opacity: 1, x: 0, y: 0, rotate: rot, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.1 + i * 0.07 }}
            whileHover={{ scale: 1.06, rotate: 0, zIndex: 10 }} style={{ left: x, top: y, zIndex: i + 1 }}>
            <span className="p-img" style={{ background: SWATCH[i] }}><b className="display">{String(i + 1).padStart(2, '0')}</b></span>
            <span className="hand p-title">{NAMES[i]}</span>
            <span className="mono p-meta">{cat.title} · 2025</span>
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}
