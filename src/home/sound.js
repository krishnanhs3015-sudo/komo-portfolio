// Tiny synthesised "character speaking" blips (Web Audio, no audio files needed).
// Browsers only allow sound after the visitor has clicked/tapped/pressed a key, so call unlock() from a gesture.
let ctx = null
let unlocked = false
let muted = false

try { muted = window.localStorage.getItem('komo-muted') === '1' } catch { /* storage unavailable */ }

export function unlock() {
  if (unlocked) return
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = ctx || new AC()
  if (ctx.state === 'suspended') ctx.resume()
  unlocked = true
}

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  try { window.localStorage.setItem('komo-muted', v ? '1' : '0') } catch { /* storage unavailable */ }
}

// pentatonic notes so the blips sound musical, not random
const SEMITONES = [0, 2, 4, 7, 9]
export function blip(ch) {
  if (!ctx || !unlocked || muted || /\s/.test(ch)) return
  const code = ch.toLowerCase().charCodeAt(0)
  const semi = SEMITONES[code % 5] + 12 * ((code >> 3) % 2)
  const freq = 392 * Math.pow(2, semi / 12) * (0.985 + Math.random() * 0.03)
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const lp = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 0.08)
  lp.type = 'lowpass'
  lp.frequency.value = 2200
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085)
  osc.connect(lp).connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.1)
}

// soft whoosh for the dive into the mouth: filtered noise sweeping upward
export function whoosh() {
  if (!ctx || !unlocked || muted) return
  const dur = 1.2
  const t = ctx.currentTime
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.1
  bp.frequency.setValueAtTime(260, t)
  bp.frequency.exponentialRampToValueAtTime(2800, t + dur * 0.85)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.55)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(gain).connect(ctx.destination)
  src.start(t)
  src.stop(t + dur + 0.05)
}

// a soft "boing" for Komo popping up: a sine that sweeps up and settles
export function pop() {
  if (!ctx || !unlocked || muted) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.12)
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.3)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.35)
}
