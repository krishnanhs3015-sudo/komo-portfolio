import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { blip } from '../home/sound'
import { asset } from '../asset'

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const EMAIL = 'kmorebiisavere@gmail.com'
const NAV = [
  ['HOME', [['ABOUT', '#/about'], ['WORKS', '#/projects'], ['JOURNEY', '#/journey']], '#/'],
  ['PROJECTS', [['BEHANCE', '#'], ['UPWORK', '#']], '#/projects'],
  ['SOCIAL MEDIA', [['INSTAGRAM', '#'], ['LINKEDIN', '#']], null],
]

// the five characters, placed from the Figma frame (x, y, w, h in a 1440-wide frame; the letters start at y = 530)
const ART_TOP = 530
const ART_H = 494
const CHARS = [
  ['fire', 28, 613, 216, 421, 'Komo with a flaming head'],
  ['star', 295.7, 721.5, 293.1, 273.2, 'Komo as a star'],
  ['chill', 623, 560, 210, 343, 'Komo sitting back'],
  ['run', 869, 681, 229, 354, 'Komo running'],
  ['coffee', 1154, 560, 278, 410, 'Komo covered in coffee'],
]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// text that types itself once `on`, with Komo's blips; the full text is kept (hidden) so nothing jumps
function useTyped(text, on, delay) {
  const [n, setN] = useState(() => (calm() ? text.length : 0))
  useEffect(() => {
    if (!on || calm()) { if (calm()) setN(text.length); return }
    let i = 0
    let iv
    const t = setTimeout(() => {
      iv = setInterval(() => {
        i += 1
        setN(i)
        blip(text[i - 1])
        if (i >= text.length) clearInterval(iv)
      }, 38)
    }, delay)
    return () => { clearTimeout(t); clearInterval(iv) }
  }, [on, text, delay])
  return [text.slice(0, n), n >= text.length]
}

function Typed({ text, on, delay, swap, hover, as: Tag = 'span', className, ...rest }) {
  const [typed, done] = useTyped(text, on, delay)
  const shown = hover && done ? swap : typed
  return (
    <Tag className={className} {...rest} aria-label={text}>
      <span className="ty-ghost" aria-hidden="true">{text}</span>
      <span key={hover && done ? 'swap' : 'typed'} className={'ty-live' + (hover && done ? ' ty-swap' : '')} aria-hidden="true">{shown}</span>
    </Tag>
  )
}

// a character that hops up when the footer arrives, jumps when you hover it, and turns toward the cursor
function Char({ c, i, on, px }) {
  const [name, x, y, w, , alt] = c
  const cx = (x + w / 2) / 1440
  const tx = useTransform(px, (v) => clamp((v - cx) * 2.2, -1, 1) * 9)
  const rot = useTransform(px, (v) => clamp((v - cx) * 2.2, -1, 1) * 4)
  const rest = 3800 + ((i * 1900) % 3300) // each character blinks on its own rhythm
  return (
    <motion.div className={'af-char' + (on ? ' af-blinking' : '')}
      style={{ left: `${(x / 1440) * 100}%`, top: `${((y - ART_TOP) / ART_H) * 100}%`, width: `${(w / 1440) * 100}%`, x: tx, rotate: rot, '--bd': `${rest}ms`, '--bl': `${1500 + i * 700}ms` }}
      initial={calm() ? false : { y: '115%' }} animate={{ y: on ? '0%' : '115%' }}
      transition={{ type: 'spring', stiffness: 200, damping: 11, delay: on ? 0.1 + i * 0.12 : 0 }}
      whileHover={{ y: '-7%', transition: { type: 'spring', stiffness: 420, damping: 12 } }}>
      <img src={asset(`brand/about/ch-${name}.webp`)} alt={alt} draggable={false} />
      <img className="af-blink" src={asset(`brand/about/ch-${name}-blink.webp`)} alt="" draggable={false} />
    </motion.div>
  )
}

export default function Footer({ on }) {
  const [hc, setHc] = useState(false)
  const [hm, setHm] = useState(false)
  const raw = useMotionValue(0.5)
  const px = useSpring(raw, { stiffness: 90, damping: 18 })
  // no hover on touch screens: let the two messages show up on their own, one after the other
  useEffect(() => {
    if (!on || !window.matchMedia('(hover: none)').matches || calm()) return
    let k = 0
    const iv = setInterval(() => {
      k = (k + 1) % 4
      setHc(k === 1)
      setHm(k === 3)
    }, 2600)
    return () => clearInterval(iv)
  }, [on])
  useEffect(() => {
    const move = (e) => raw.set(e.clientX / window.innerWidth)
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [raw])

  return (
    <section className="ab-slide ab-footer" aria-label="Contact">
      <div className="af-top">
        <div className="af-contact">
          <Typed className="af-small" text="Have an awesome project?" on={on} delay={200} />
          <Typed as="a" href="#/contact" className="af-big af-cm" text="CONTACT ME" on={on} delay={1100} swap="Wanna talk to me?" hover={hc}
            onPointerEnter={() => setHc(true)} onPointerLeave={() => setHc(false)} />
          <Typed className="af-small af-brief" text="Or send your brief here" on={on} delay={1900} />
          <Typed as="a" className="af-big af-mail" href={`mailto:${EMAIL}`} text={EMAIL} on={on} delay={2900} swap="Ooooo, exciting! What project can we do together?" hover={hm}
            onPointerEnter={() => setHm(true)} onPointerLeave={() => setHm(false)} onFocus={() => setHm(true)} onBlur={() => setHm(false)} />
        </div>
        <nav className="af-nav" aria-label="Site">
          {NAV.map(([head, links, href]) => (
            <div key={head}>
              {href ? <a className="af-head" href={href}>{head}</a> : <p className="af-head">{head}</p>}
              {links.map(([name, to]) => <a key={name} className="af-link" href={to}>{name}</a>)}
            </div>
          ))}
        </nav>
      </div>
      <div className="af-art">
        <img className="af-letters" src={asset('brand/about/footer-letters.webp')} alt="" draggable={false} />
        {CHARS.map((c, i) => <Char key={c[0]} c={c} i={i} on={on} px={px} />)}
      </div>
    </section>
  )
}
