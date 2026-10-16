import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitText from './components/SplitText'
import ShinyText from './components/ShinyText'
import DotGrid from './components/DotGrid'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const projects = [
  { name: 'Project One', desc: 'Short description of what you built and why it mattered.' },
  { name: 'Project Two', desc: 'Another piece of work, with the stack and your role.' },
  { name: 'Project Three', desc: 'A third highlight. Swap these for your real projects.' },
]

export default function App() {
  const main = useRef(null)

  useEffect(() => {
    // Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)
    const tick = t => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      gsap.utils.toArray('.card').forEach(el =>
        gsap.from(el, {
          y: 80, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      )
    }, main)

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <main ref={main}>
      <section className="hero">
        <div className="bg">
          <DotGrid />
        </div>
        <div className="hero-text">
          <SplitText text="Your Name" tag="h1" className="title" />
          <ShinyText text="Developer · Designer · Portfolio 2026" className="sub" />
        </div>
      </section>

      <section className="work">
        <h2>Selected work</h2>
        {projects.map(p => (
          <article className="card" key={p.name}>
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
          </article>
        ))}
      </section>

      <footer>
        <p>your@email.com</p>
      </footer>
    </main>
  )
}
