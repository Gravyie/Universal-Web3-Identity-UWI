// A small generative score in Web Audio: no files to download. A detuned
// drone through a breathing low-pass, a bed of filtered wind, a whoosh on
// every act change and a low hit at the finale. Off until the viewer asks.

let ctx = null
let master = null
let filter = null
let started = false

function noiseBuffer(seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 380
  filter.Q.value = 6
  filter.connect(master)

  // drone: A1 with a fifth and an octave, slightly detuned so it shimmers
  ;[
    [55, 'sawtooth', 0.22],
    [55.35, 'sawtooth', 0.22],
    [82.4, 'triangle', 0.14],
    [110, 'sine', 0.18],
  ].forEach(([f, type, g]) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = f
    const gain = ctx.createGain()
    gain.gain.value = g
    o.connect(gain).connect(filter)
    o.start()
  })

  // a slow LFO makes the filter breathe
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.06
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 160
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()

  // wind bed
  const wind = ctx.createBufferSource()
  wind.buffer = noiseBuffer(4)
  wind.loop = true
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 700
  band.Q.value = 0.7
  const windGain = ctx.createGain()
  windGain.gain.value = 0.035
  wind.connect(band).connect(windGain).connect(master)
  wind.start()
}

export const score = {
  get on() {
    return started
  },
  async start() {
    if (!ctx) build()
    await ctx.resume()
    started = true
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5)
  },
  stop() {
    if (!ctx) return
    started = false
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
  },
  /** 0..1: opens the filter as the story builds. */
  setIntensity(v) {
    if (!started) return
    filter.frequency.setTargetAtTime(320 + v * 1400, ctx.currentTime, 0.8)
  },
  whoosh() {
    if (!started) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(1.6)
    const hp = ctx.createBiquadFilter()
    hp.type = 'bandpass'
    hp.Q.value = 1.2
    hp.frequency.setValueAtTime(300, ctx.currentTime)
    hp.frequency.exponentialRampToValueAtTime(4200, ctx.currentTime + 1.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5)
    src.connect(hp).connect(g).connect(master)
    src.start()
  },
  hit() {
    if (!started) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(90, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 1.4)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2)
    o.connect(g).connect(master)
    o.start()
    o.stop(ctx.currentTime + 2.4)
  },
}
