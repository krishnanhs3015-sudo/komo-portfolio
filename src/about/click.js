// A tiny switch click + filament tick, made with Web Audio (no sound file).
// Browsers only allow sound after the visitor has clicked something on the site,
// so landing on #/about directly stays silent; arriving from the home page plays it.
let ctx

export function click(level = 1) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state !== 'running') { ctx.resume(); return }
    const t = ctx.currentTime
    const out = ctx.createGain()
    out.gain.value = 0.12 * level
    out.connect(ctx.destination)

    // the snap: a short burst of filtered noise
    const len = Math.floor(ctx.sampleRate * 0.03)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12))
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2600
    band.Q.value = 1.2
    noise.connect(band).connect(out)
    noise.start(t)

    // the body: a low thunk
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.setValueAtTime(140, t)
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06)
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.08)
  } catch { /* no audio, no problem */ }
}
