import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Home from './home/Home'
import ContactFlow from './contact/ContactFlow'
import Projects from './projects/Projects'
import Brand from './brand/Brand'
import About from './about/About'
import Loader from './loader/Loader'
import { preloadFor } from './loader/assets'
import DeskDrop from './test/DeskDrop'
import ProjectDetail from './projects/ProjectDetail'
import './fonts.css'
import './index.css'
import './home/home.css'

const read = () => window.location.hash.replace(/^#\/?/, '') || 'home'

// phones held upright: a small one-time tip on the pages drawn for a wide screen
function RotateHint({ route }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const wide = ['home', 'brand', 'about'].includes(route)
    const upright = window.innerWidth < 600 && window.innerHeight > window.innerWidth
    let seen = false
    try { seen = sessionStorage.getItem('komo-rotate') === '1' } catch { /* private mode */ }
    if (!wide || !upright || seen) { setOpen(false); return }
    const show = setTimeout(() => setOpen(true), 1200)
    const hide = setTimeout(() => setOpen(false), 7500)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [route])
  const close = () => { setOpen(false); try { sessionStorage.setItem('komo-rotate', '1') } catch { /* ignore */ } }
  if (!open) return null
  return (
    <button className="rotate-hint hand" onClick={close} aria-label="Dismiss tip">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Turn your phone sideways for the full picture
    </button>
  )
}

function Soon({ name }) {
  return (
    <div className="soon">
      <h1 className="hand" style={{ textTransform: 'capitalize' }}>{name}</h1>
      <p className="hand" style={{ fontSize: 26, margin: 0 }}>This page is coming soon.</p>
      <a className="mono" href="#/">BACK HOME</a>
    </div>
  )
}

// tiny hash router: #/ (home), #/contact, anything else shows a "coming soon" page
export default function App() {
  const [route, setRoute] = useState(read())
  const [veil, setVeil] = useState(0)
  // first visit of a session: the loading screen plays and the page is only shown as it lifts away
  const [loader, setLoader] = useState(() => {
    let seen = false
    try { seen = window.sessionStorage.getItem('komo-loaded') === '1' } catch { /* storage unavailable */ }
    return !seen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [pageReady, setPageReady] = useState(!loader)
  const onReveal = useCallback(() => { setTimeout(() => setPageReady(true), 450) }, [])
  const onLoaded = useCallback(() => {
    try { window.sessionStorage.setItem('komo-loaded', '1') } catch { /* storage unavailable */ }
    setLoader(false)
  }, [])
  const onVeil = useCallback((v) => setVeil(v), [])
  const onNavigate = useCallback((href) => {
    window.location.hash = href
    setTimeout(() => setVeil(0), 200) // reveal the new page out of the dark
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [route]) // every page starts at the top
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const page = route === 'contact' ? <ContactFlow />
    : route === 'home' ? <Home onVeil={onVeil} onNavigate={onNavigate} />
    : route === 'projects' ? <Projects />
    : route === 'brand' ? <Brand />
    : route === 'about' ? <About />
    : route === 'test' ? <DeskDrop />
    : route.startsWith('project/') ? <ProjectDetail id={route.slice(8)} />
    : <Soon name={route} />
  return (
    <>
      {pageReady && page}
      {pageReady && <RotateHint route={route} />}
      {loader && <Loader preload={preloadFor(route)} onReveal={onReveal} onDone={onLoaded} />}
      <motion.div className="veil" initial={false} animate={{ opacity: veil }} transition={{ duration: veil ? 0.55 : 0.6, ease: 'easeInOut' }} style={{ pointerEvents: veil ? 'auto' : 'none' }} />
    </>
  )
}
