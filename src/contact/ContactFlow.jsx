import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { asset } from '../asset'
import './contact.css'

// The whole contact experience from the Figma file:
//   checklist (Contact 1-4)  ->  form (Contact 5)  ->  message sent (Contact 6)
const STAGE_W = 1264
const STAGE_H = 880

const OPTIONS = ['Collaboration', 'Project enquire', 'Opportunity']
const FACES = [
  asset('contact/face-0-empty.png'),
  asset('contact/face-1-worried.png'),
  asset('contact/face-2-wide-eyes.png'),
  asset('contact/face-3-hands-over-eyes.png'),
]

// wording for the pill and its hover tag, by what was ticked
function copyFor(sel) {
  const n = sel.filter(Boolean).length
  if (n === 3) return { label: 'LET’S CONNECT', tag: 'We have much to discuss about all of it' }
  if (n === 1) {
    if (sel[0]) return { label: 'LET’S COLLABORATE', tag: 'We have much to discuss about collaboration' }
    if (sel[1]) return { label: 'LET’S TALK PROJECT', tag: 'We have much to discuss about your project' }
    return { label: 'LET’S TALK OPPORTUNITY', tag: 'We have much to discuss about the opportunity' }
  }
  const names = ['collaboration', 'your project', 'the opportunity'].filter((_, i) => sel[i])
  return { label: 'LET’S CONNECT', tag: `We have much to discuss: ${names.join(' + ')}` }
}

function useFit(ref) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / STAGE_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return scale
}

const Tick = () => (
  <svg viewBox="0 0 26 26" className="tick" aria-hidden="true">
    <motion.path d="M6 13 L11 18 L20 7" pathLength={1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} />
  </svg>
)

const Chip = ({ text }) => (
  <span className="chip">
    <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M0 6 L4 10 L12 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    {text}
  </span>
)

export default function ContactFlow() {
  const wrap = useRef(null)
  const scale = useFit(wrap)

  const [step, setStep] = useState('checklist') // checklist | form | sent
  const [sel, setSel] = useState([false, false, false])
  const [hover, setHover] = useState(false)
  const [gif, setGif] = useState(true)
  // the hover tag sticks to the mouse (viewport coordinates, smoothed with a spring)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 420, damping: 32, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 420, damping: 32, mass: 0.4 })
  const follow = (e) => { mx.set(e.clientX + 20); my.set(e.clientY + 24) }
  const enter = (e) => { mx.set(e.clientX + 20); my.set(e.clientY + 24); sx.jump(e.clientX + 20); sy.jump(e.clientY + 24); setHover(true) }
  const [form, setForm] = useState({ name: '', need: '', email: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const count = sel.filter(Boolean).length
  const { label, tag } = copyFor(sel)
  const chosen = OPTIONS.filter((_, i) => sel[i])
  const toggle = (i) => setSel((s) => s.map((v, j) => (j === i ? !v : v)))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function send(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Please add your name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please add a valid email.')
    setSending(true)
    try {
      const endpoint = import.meta.env.VITE_FORM_ENDPOINT
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...form, interests: chosen }),
        })
        if (!res.ok) throw new Error('Request failed')
      }
      setStep('sent')
    } catch {
      setError('Could not send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const all = count === 3

  const checklist = (
    <motion.div key="checklist" className="stage-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* GIF pop-out sits behind the card and slides out once all three are ticked */}
      <motion.div className="popout" animate={{ y: all ? 0 : -200, opacity: all ? 1 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }}>
        {gif ? <img src={asset('contact/discuss.gif')} alt="We have much to discuss" onError={() => setGif(false)} /> : <div className="gif-placeholder">DROP YOUR GIF HERE<br /><small>/public/contact/discuss.gif</small></div>}
        <div className="popout-caption">WE HAVE MUCH TO DISCUSS.</div>
      </motion.div>

      <motion.div className="card" animate={{ rotate: all ? -3 : 0, y: all ? -24 : 0 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}>
        <h2 className="hand title">What I’m looking for</h2>
        {OPTIONS.map((o, i) => (
          <button key={o} role="checkbox" aria-checked={sel[i]} className={'row' + (sel[i] ? ' on' : '')} style={{ top: [207, 282, 348][i] }} onClick={() => toggle(i)}>
            <span className="box">{sel[i] && <Tick />}</span>
            <span className="hand label strike">{o}</span>
          </button>
        ))}

        <div className="face">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img key={count} src={FACES[count]} alt="" draggable={false}
              initial={{ opacity: 0, scale: 0.9, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }} />
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {count > 0 && (
            <motion.div key="pill" className="pill-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <button className={'pill mono' + (hover ? ' hover' : '')} onClick={() => setStep('form')}
                onMouseEnter={enter} onMouseMove={follow} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>{label}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )

  const shell = (kind) => (
    <motion.div key={kind} className="stage-step" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <img className="sticker" src={asset('contact/sticker-panel.png')} alt="" draggable={false} />
      <form className="form-card" onSubmit={send} noValidate>
        <h2 className="hand">{kind === 'form' ? 'Let’s get started' : 'Message sent!'}</h2>
        {kind === 'form' ? (
          <>
            <div className="chips"><span className="hand small">I’m after</span>{chosen.length ? chosen.map((c) => <Chip key={c} text={c} />) : <span className="hand small">anything</span>}</div>
            <div className="line"><span className="hand word">My name is</span><input className="hand" style={{ width: 250 }} value={form.name} onChange={set('name')} placeholder="Your full name" aria-label="Your full name" /><span className="hand word">and I</span></div>
            <div className="line"><span className="hand word">have a</span><input className="hand" style={{ width: 230 }} value={form.need} onChange={set('need')} placeholder="Project, job, idea…" aria-label="What you need help with" /><span className="hand word">that needs help.</span></div>
            <div className="line"><span className="hand word">You can reach me at</span><input className="hand" type="email" style={{ width: 290 }} value={form.email} onChange={set('email')} placeholder="Your email address" aria-label="Your email address" /></div>
            <span className="hand word">to get things started.</span>
            <div className="line">
              <button className="send mono" type="submit" disabled={sending}>{sending ? 'SENDING…' : 'SEND INFO'}
                <svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true"><path d="M0 8 L19 8 M13 1 L19 8 L13 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {error && <span role="alert" className="hand error">{error}</span>}
            </div>
          </>
        ) : (
          <>
            <span className="hand word">Thanks for reaching out.</span>
            <span className="hand word">I’ll reply within a couple of days.</span>
            <div className="chips"><span className="hand small">You chose</span>{chosen.map((c) => <Chip key={c} text={c} />)}</div>
            <div className="line">
              <button type="button" className="send mono" onClick={() => { setSel([false, false, false]); setForm({ name: '', need: '', email: '' }); setStep('checklist') }}>BACK TO START</button>
              <button type="button" className="ghost mono" onClick={() => { setForm({ name: '', need: '', email: '' }); setError(''); setStep('form') }}>SEND ANOTHER</button>
            </div>
          </>
        )}
        <img className="mini" src={FACES[kind === 'form' ? 3 : 2]} alt="" draggable={false} style={{ width: kind === 'form' ? 100 : 150 }} />
      </form>
      <div className="info">
        <span className="hand small">Prefer to write directly?</span>
        <span className="hand email">your@email.com</span>
        <span className="hint">Based in Singapore · open for projects</span>
      </div>
    </motion.div>
  )

  return (
    <div className="contact-page">
      <a className="home-link hand" href="#/">← Home</a>
      <AnimatePresence>
        {hover && step === 'checklist' && count > 0 && (
          <motion.div key="cursor-tag" className="cursor-tag hand" style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.18 }}>
            {tag}
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={wrap} className="contact-wrap" style={{ height: STAGE_H * scale }}>
        <div className="stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <AnimatePresence mode="wait" initial={false}>{step === 'checklist' ? checklist : shell(step)}</AnimatePresence>
        </div>
      </div>
    </div>
  )
}
