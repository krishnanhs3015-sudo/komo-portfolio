import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { blip, isMuted, pop, setMuted, unlock, whoosh } from './sound'
import Arm, { ARM_H } from './Arm'
import { asset } from '../asset'
import './home.css'

// Design space is 1440 x 1024 (same as the Figma Home frame); the stage scales to fit the window.
const W = 1440
const H = 1024
// the 2048px character canvas, placed so it lines up with the reference
const CANVAS = { x: 245.3, y: 95.6, size: 947.6 }
const EYE_CENTER = { x: 720, y: 530 } // between the pupils, in design px
const RANGE = { x: 28, y: 20 }        // how far the pupils may travel, design px

// cx, cy, w = measured from the reference; ar = height / width of the sticker image
const STICKERS = [
  { id: 'eyes', cx: 617, cy: 277, w: 123, ar: 0.706, rot: -15, label: 'Who am I?', go: 'Let me introduce myself!', href: '#/about', side: 'up-right' },
  { id: 'star', cx: 975, cy: 357, w: 91, ar: 0.913, rot: 10, label: 'What is my brand about?', go: 'Here’s what I’m about!', href: '#/brand', side: 'up-left' },
  { id: 'megaphone', cx: 710, cy: 620, w: 95, ar: 0.825, rot: -15, label: 'Contact me!', go: 'Let’s talk!', href: '#/contact', side: 'down-right' },
  { id: 'folder', cx: 482, cy: 678, w: 102, ar: 0.919, rot: -20, label: 'See my projects', go: 'Off to my projects!', href: '#/projects', side: 'down-left' },
  { id: 'emoji', cx: 968, cy: 623, w: 74, ar: 0.998, rot: 35, label: 'Playground', go: 'Time to play!', href: '#/playground', side: 'down-left' },
]

// the mouth cut-out: canvas px (871,1243) 311 x 177 -> design px
const MC = CANVAS.size / 2048
const MOUTH_BOX = { left: CANVAS.x + 871 * MC, top: CANVAS.y + 1243 * MC, width: 311 * MC, height: 177 * MC }

// what he says when the page loads: one bubble per entry, and "\n" breaks a line. Edit the words here.
const INTRO = [
  'Hi, I’m Komo!',
  'This is Krishnan’s\ndesign world.',
  'Poke my stickers\nto explore!',
]
const INTRO_BUBBLE = { id: 'intro', cx: 1180, cy: 312, side: 'up-right', bw: 350, fs: 28 }

const MOUTH_CENTER = { x: CANVAS.x + (871 + 311 / 2) * (CANVAS.size / 2048), y: CANVAS.y + (1243 + 177 / 2) * (CANVAS.size / 2048) }
const STAGE_CENTER = { x: W / 2, y: H / 2 }

const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v))
const rand = (a, b) => a + Math.random() * (b - a)

// types the text out one letter at a time (instantly if the visitor prefers reduced motion)
function Typewriter({ text, reduce, onTick, onDone }) {
  const [n, setN] = useState(reduce ? text.length : 0)
  const cb = useRef({ onTick, onDone })
  useEffect(() => { cb.current = { onTick, onDone } })
  useEffect(() => {
    if (reduce) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      cb.current.onTick?.(text[i - 1])
      if (i >= text.length) { clearInterval(id); cb.current.onDone?.() }
    }, 42)
    return () => clearInterval(id)
  }, [text, reduce])
  return (
    <span className="typed" aria-label={text}>
      <span className="typed-ghost" aria-hidden="true">{text}</span>
      <span className="typed-live" aria-hidden="true">{text.slice(0, n)}{n < text.length && <i className="caret" />}</span>
    </span>
  )
}

// speech bubble artwork: the tail points down-left. Four placements keep the eyes visible:
//  up-right (as drawn) | up-left (mirrored) | down-right (flipped) | down-left (mirrored + flipped)
const TAIL = { x: 0.308, y: 0.982 } // tail tip inside the artwork
const BODY_CY = 0.35                // vertical centre of the text area inside the artwork
function Bubble({ s, reduce, onTick, onDone }) {
  const bw = s.bw ?? Math.min(430, Math.max(250, s.label.length * 15 + 80))
  const bh = bw * (372 / 1000)
  const fx = s.side.endsWith('left')
  const fy = s.side.startsWith('down')
  const tipX = fx ? 1 - TAIL.x : TAIL.x
  const tipY = fy ? 1 - TAIL.y : TAIL.y
  const textY = fy ? 1 - BODY_CY : BODY_CY
  return (
    <motion.div className="bubble" style={{ left: s.cx - bw * tipX + (fx ? 6 : -6), top: s.cy - bh * tipY + (fy ? 8 : -8), width: bw, height: bh, transformOrigin: `${tipX * 100}% ${tipY * 100}%` }}
      initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 420, damping: 20 }}>
      <img src={asset('home/bubble.webp')} alt="" draggable={false} style={{ transform: `scale(${fx ? -1 : 1}, ${fy ? -1 : 1})` }} />
      <span className="bubble-text hand" style={{ top: `${textY * 100}%`, fontSize: s.fs ?? 27 }}><Typewriter text={s.label} reduce={reduce} onTick={onTick} onDone={onDone} /></span>
    </motion.div>
  )
}

export default function Home({ onVeil, onNavigate }) {
  const reduce = useReducedMotion()
  const [fit, setFit] = useState(1)
  const [portrait, setPortrait] = useState(false) // tall, narrow screens (phones)
  const [active, setActive] = useState(null) // sticker whose bubble is open
  // first visit of the session: Komo pops up, blinks and waves before introducing himself
  const enter = useRef(null)
  if (enter.current === null) {
    let seen = false
    try { seen = window.sessionStorage.getItem('komo-entered') === '1' } catch { /* storage unavailable */ }
    enter.current = !reduce && !seen
  }
  const [intro, setIntro] = useState(enter.current ? -2 : -1) // -2 entrance playing, -1 waiting, 0.. which intro line is showing, INTRO.length = finished
  const pointerType = useRef('mouse')
  const eyesRef = useRef(null)
  const lastMove = useRef(0)

  // gaze (-1..1), blink, parallax
  const gx = useMotionValue(0)
  const gy = useMotionValue(0)
  const charX = useMotionValue(0)
  const charY = useMotionValue(0)
  const charR = useMotionValue(0)
  const browY = useMotionValue(0)
  const mouth = useMotionValue(0) // 0 closed .. 1 wide open
  const lipUp = useTransform(mouth, (m) => -m * 13)
  const lipDown = useTransform(mouth, (m) => m * 13)
  const [muted, setMutedState] = useState(isMuted())
  const eyeScale = useMotionValue(1)
  const camScale = useMotionValue(1) // camera dive into the mouth
  const camPan = useMotionValue(0)
  const panX = useTransform(camPan, (p) => (STAGE_CENTER.x - MOUTH_CENTER.x) * p)
  const panY = useTransform(camPan, (p) => (STAGE_CENTER.y - MOUTH_CENTER.y) * p)
  const [leaving, setLeaving] = useState(null)
  const [fading, setFading] = useState(false)
  const leavingRef = useRef(null)
  const skipRef = useRef(false)
  const pupilX = useMotionValue(0)
  const pupilY = useMotionValue(0)
  const enterY = useMotionValue(enter.current ? 1200 : 0) // how far below the screen Komo starts
  const armY = useMotionValue(ARM_H + 40)
  const armSwing = useMotionValue(0)
  const handFlutter = useMotionValue(0)
  const [forceBlink, setForceBlink] = useState(false)

  useEffect(() => {
    // fit the whole stage; on tall/narrow screens fill the width with the character instead (side margins are cropped)
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const p = vw / vh < 0.9
      setPortrait(p)
      // phones: big character standing on the bottom edge (ears may crop a little); otherwise fit the whole stage
      setFit(p ? Math.min(vw / 820, (vh * 0.82) / H) : Math.max(Math.min(vw / W, vh / H), Math.min(vw / 1020, vh / H)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const look = (tx, ty, slow) => {
    const cfg = slow ? { type: 'spring', stiffness: 30, damping: 12 } : { type: 'spring', stiffness: 170, damping: 20 }
    animate(gx, tx, cfg); animate(gy, ty, cfg)
  }

  // gaze -> pupil offset (px) and eyebrow lift
  useEffect(() => {
    const u1 = gx.on('change', (v) => pupilX.set(v * RANGE.x))
    const u2 = gy.on('change', (v) => { pupilY.set(v * RANGE.y); browY.set(v * 3) })
    return () => { u1(); u2() }
  }, [gx, gy, pupilX, pupilY, browY])

  // follow the mouse; head turns a little, eyes follow
  useEffect(() => {
    const move = (e) => {
      pointerType.current = e.pointerType || 'mouse'
      lastMove.current = Date.now()
      const el = eyesRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.459
      if (!hoverTarget.current) look(clamp((e.clientX - cx) / (window.innerWidth * 0.3)), clamp((e.clientY - cy) / (window.innerHeight * 0.3)), false)
      if (!reduce) {
        const nx = clamp((e.clientX / window.innerWidth - 0.5) * 2)
        const ny = clamp((e.clientY / window.innerHeight - 0.5) * 2)
        animate(charX, nx * 8, { type: 'spring', stiffness: 80, damping: 18 })
        animate(charY, ny * 5, { type: 'spring', stiffness: 80, damping: 18 })
        animate(charR, nx * 1.2, { type: 'spring', stiffness: 80, damping: 18 })
      }
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  // idle: look around slowly when the mouse hasn't moved for a while
  const hoverTarget = useRef(null)
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => {
      if (hoverTarget.current || Date.now() - lastMove.current < 2600) return
      look(rand(-0.85, 0.85), rand(-0.55, 0.45), true)
      animate(charX, 0, { type: 'spring', stiffness: 30, damping: 14 }); animate(charY, 0, { type: 'spring', stiffness: 30, damping: 14 }); animate(charR, 0, { type: 'spring', stiffness: 30, damping: 14 })
    }, 2400)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  // each typed letter plays a blip and flaps the mouth (vowels open wider)
  const talk = (ch) => {
    blip(ch)
    if (!reduce) animate(mouth, /[aeiou]/i.test(ch) ? 1 : /\s/.test(ch) ? 0.12 : 0.5, { duration: 0.05 })
  }
  useEffect(() => {
    const go = () => unlock()
    window.addEventListener('pointerdown', go, { once: true })
    window.addEventListener('keydown', go, { once: true })
    return () => { window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go) }
  }, [])
  useEffect(() => { if (!active) animate(mouth, 0, { duration: 0.15 }) }, [active, mouth])
  useEffect(() => {
    const t0 = setTimeout(() => setIntro((i) => (i === -1 ? 0 : i)), 1000)
    return () => clearTimeout(t0)
  }, [])
  useEffect(() => { if (active) setIntro(INTRO.length) }, [active]) // hovering an icon ends the intro

  // the entrance: pop up with a bounce, blink twice, wave, then the intro starts. Any click or key skips it.
  useEffect(() => {
    if (!enter.current) return
    try { window.sessionStorage.setItem('komo-entered', '1') } catch { /* storage unavailable */ }
    let dead = false
    const live = []
    const run = (c) => { live.push(c); return c }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const skip = () => {
      dead = true
      live.forEach((c) => c.stop())
      enterY.set(0); armY.set(ARM_H + 40); armSwing.set(0); handFlutter.set(0); setForceBlink(false)
      setIntro((i) => (i === -2 ? 0 : i))
    }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    ;(async () => {
      await sleep(350); if (dead) return
      pop(); look(0, 0.2, false)
      await run(animate(enterY, 0, { type: 'spring', stiffness: 120, damping: 9, restDelta: 0.5 })); if (dead) return
      await sleep(220); if (dead) return
      setForceBlink(true); await sleep(1050); if (dead) return
      setForceBlink(false)
      await sleep(150); if (dead) return
      await run(animate(armY, 0, { duration: 0.5, ease: [0.2, 0.9, 0.3, 1] })); if (dead) return
      const d = 2.4 // the wave: the arm swings from the shoulder, the hand flutters at the wrist, the body nods along
      run(animate(charR, [0, -1.6, 1.3, -1.1, 0.9, -0.4, 0], { duration: d, ease: 'easeInOut' }))
      run(animate(charY, [0, 8, 0, 7, 0, 5, 0], { duration: d, ease: 'easeInOut' }))
      run(animate(handFlutter, [0, 20, -18, 18, -15, 11, -6, 0], { duration: d, ease: 'easeInOut' }))
      await run(animate(armSwing, [0, -17, 12, -15, 11, -8, 3, 0], { duration: d, ease: 'easeInOut' })); if (dead) return
      await run(animate(armY, ARM_H + 40, { duration: 0.45, ease: 'easeIn' })); if (dead) return
      await sleep(250); if (dead) return
      setIntro((i) => (i === -2 ? 0 : i))
    })()
    return () => { dead = true; live.forEach((c) => c.stop()); window.removeEventListener('pointerdown', skip); window.removeEventListener('keydown', skip) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (intro >= 0 && intro < INTRO.length) look(0.75, -0.5, false) // glance toward the bubble
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro])
  const introDone = () => {
    animate(mouth, 0, { duration: 0.15 })
    const last = intro >= INTRO.length - 1
    setTimeout(() => setIntro((i) => (i === intro ? intro + 1 : i)), last ? 2600 : 1400)
  }
  const toggleSound = () => { unlock(); const next = !muted; setMuted(next); setMutedState(next) }

  const open = (s) => {
    if (leavingRef.current) return
    setActive(s.id)
    hoverTarget.current = s.id
    look(clamp((s.cx - EYE_CENTER.x) / 260), clamp((s.cy - EYE_CENTER.y) / 200), false) // the eyes look at the icon you are on
  }
  const close = (s) => {
    if (leavingRef.current) return
    setActive((a) => (a === s.id ? null : a))
    if (hoverTarget.current === s.id) hoverTarget.current = null
  }
  // click an icon: he announces where you are going, opens wide, the camera dives into his mouth, then the page changes
  const startLeave = (s) => {
    if (leavingRef.current) return
    if (reduce) { onVeil?.(1); setTimeout(() => onNavigate?.(s.href), 250); return }
    leavingRef.current = s
    hoverTarget.current = s.id
    setLeaving(s)
    setIntro(INTRO.length)
    look(0, 0.1, false) // look at the visitor
  }
  const zoomIn = async () => {
    const s = leavingRef.current
    if (!s || skipRef.current) return
    await animate(eyeScale, 1.14, { duration: 0.16 }) // eyes go wide
    if (skipRef.current) return
    whoosh()
    animate(mouth, 1.5, { duration: 0.28 })
    setFading(true)
    const dive = Promise.all([
      animate(camScale, 30, { duration: 1.25, ease: [0.6, 0, 0.9, 0.4] }),
      animate(camPan, 1, { duration: 1.25, ease: [0.5, 0, 0.3, 1] }),
    ])
    setTimeout(() => { if (!skipRef.current) onVeil?.(1) }, 780) // the dark inside of the mouth takes over the screen
    await dive
    if (!skipRef.current) onNavigate?.(s.href)
  }
  // a second click (or key) during the animation skips straight to the page
  useEffect(() => {
    if (!leaving) return
    let armed = false
    const arm = setTimeout(() => { armed = true }, 250)
    const skip = () => {
      if (!armed || skipRef.current) return
      skipRef.current = true
      onVeil?.(1)
      setTimeout(() => onNavigate?.(leavingRef.current.href), 380)
    }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => { clearTimeout(arm); window.removeEventListener('pointerdown', skip); window.removeEventListener('keydown', skip) }
  }, [leaving, onVeil, onNavigate])

  const click = (e, s) => {
    e.preventDefault()
    // on touch, the first tap shows the question, the second tap goes there
    if (pointerType.current === 'touch' && active !== s.id) { open(s); return }
    startLeave(s)
  }

  const stageStyle = useMemo(() => (portrait
    ? { width: W, height: H, top: 'auto', bottom: 0, transform: `translateX(-50%) scale(${fit})`, transformOrigin: 'center bottom' }
    : { width: W, height: H, transform: `translate(-50%, -50%) scale(${fit})` }), [fit, portrait])
  const canvasBox = { left: CANVAS.x, top: CANVAS.y, width: CANVAS.size, height: CANVAS.size }
  const activeSticker = STICKERS.find((s) => s.id === active)
  // on narrow screens the sides of the stage are cropped: pull the intro bubble in so it is never cut off
  const introCx = Math.min(INTRO_BUBBLE.cx, STAGE_CENTER.x + window.innerWidth / (2 * fit) - 24 - 0.692 * INTRO_BUBBLE.bw)

  return (
    <div className={'home' + (fading ? ' leaving' : '')}>
      <div className="home-bg" />
      <p className="mono corner left">Open for any<br />collaborations and offers</p>
      <p className="mono corner right">Portfolio<br />Entry 01</p>
      <button className="sound-toggle" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} title={muted ? 'Sound off' : 'Sound on'}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
          {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <><path d="M16.5 8.5a5 5 0 010 7" /><path d="M19 6a8.5 8.5 0 010 12" /></>}
        </svg>
      </button>
      {portrait && <h1 className="wordmark-top"><img src={asset('home/logo.svg')} alt="KOMO.IS" draggable={false} /></h1>}
      <div className="home-stage" style={stageStyle}>
        {!portrait && (
          <div className="home-head">
            <h1 className="wordmark"><img src={asset('home/logo.svg')} alt="KOMO.IS" draggable={false} /></h1>
          </div>
        )}

        <motion.div className="camera" style={{ x: panX, y: panY, scale: camScale, transformOrigin: `${MOUTH_CENTER.x}px ${MOUTH_CENTER.y}px` }}>
        <motion.div className="enter" style={{ y: enterY }}>
        <motion.div className="char" style={{ x: charX, y: charY, rotate: charR }}>
          <div className="bob">
            <img className="layer" style={canvasBox} src={asset('home/head.webp')} alt="KOMO.IS character" draggable={false} />
            <div className="mouth" style={MOUTH_BOX}>
              <div className="mouth-inner"><motion.i style={{ scaleY: mouth }} /></div>
              <motion.img className="lip lip-top" src={asset('home/mouth.webp')} alt="" draggable={false} style={{ y: lipUp }} />
              <motion.img className="lip lip-bottom" src={asset('home/mouth.webp')} alt="" draggable={false} style={{ y: lipDown }} />
            </div>
            <motion.div className="layer eyes" ref={eyesRef} style={{ ...canvasBox, scale: eyeScale, transformOrigin: '50% 45.9%' }}>
              <div className={'blinker' + (forceBlink ? ' force' : '')}>
              <img className="fill" src={asset('home/whites.webp')} alt="" draggable={false} />
              <div className="pupil-mask">
                <motion.img className="fill" src={asset('home/pupils.webp')} alt="" draggable={false} style={{ x: pupilX, y: pupilY }} />
              </div>
              <img className="fill" src={asset('home/lashes.webp')} alt="" draggable={false} />
              </div>
            </motion.div>
            <motion.img className="layer" style={{ ...canvasBox, y: browY }} src={asset('home/brows.webp')} alt="" draggable={false} />

            {enter.current && <Arm left={portrait ? 880 : 1130} top={500} y={armY} swing={armSwing} flutter={handFlutter} />}

            {STICKERS.map((s, i) => (
              <motion.a key={s.id} className="sticker" href={s.href} aria-label={s.label}
                style={{ left: s.cx - s.w / 2, top: s.cy - (s.w * s.ar) / 2, width: s.w, height: s.w * s.ar, rotate: s.rot, zIndex: active === s.id ? 6 : 3 }}
                whileHover={{ scale: 1.2, rotate: s.rot + 7 }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                onPointerDown={(e) => { pointerType.current = e.pointerType }}
                onMouseEnter={() => open(s)} onMouseLeave={() => close(s)} onFocus={() => open(s)} onBlur={() => close(s)} onClick={(e) => click(e, s)}>
                <img src={asset(`home/${s.id}.webp`)} alt="" draggable={false} style={{ animationDelay: `${i * 1.7}s` }} />
              </motion.a>
            ))}
          </div>
        </motion.div>
        </motion.div>

        <AnimatePresence>
          {!activeSticker && !leaving && intro >= 0 && intro < INTRO.length && (
            <Bubble key={'intro' + intro} s={{ ...INTRO_BUBBLE, cx: introCx, label: INTRO[intro] }} reduce={reduce} onTick={talk} onDone={introDone} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {leaving && <Bubble key={'go' + leaving.id} s={{ ...leaving, label: leaving.go }} reduce={reduce} onTick={talk} onDone={zoomIn} />}
        </AnimatePresence>
        <AnimatePresence>{activeSticker && !leaving && <Bubble key={activeSticker.id} s={activeSticker} reduce={reduce} onTick={talk} onDone={() => animate(mouth, 0, { duration: 0.15 })} />}</AnimatePresence>

        <p className="hand explore">Explore Around</p>
        </motion.div>
      </div>
    </div>
  )
}
