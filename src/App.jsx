import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Home from './home/Home'
import ContactFlow from './contact/ContactFlow'
import Projects from './projects/Projects'
import ProjectDetail from './projects/ProjectDetail'
import './fonts.css'
import './index.css'
import './home/home.css'

const read = () => window.location.hash.replace(/^#\/?/, '') || 'home'

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
    : route.startsWith('project/') ? <ProjectDetail id={route.slice(8)} />
    : <Soon name={route} />
  return (
    <>
      {page}
      <motion.div className="veil" initial={false} animate={{ opacity: veil }} transition={{ duration: veil ? 0.55 : 0.6, ease: 'easeInOut' }} style={{ pointerEvents: veil ? 'auto' : 'none' }} />
    </>
  )
}
