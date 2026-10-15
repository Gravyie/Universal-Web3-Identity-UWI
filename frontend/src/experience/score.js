// Generative score in Web Audio. Each section has its own soundscape on its
// own bus; switching sections crossfades buses through a shared reverb, so
// moods blend instead of cutting. Nothing is downloaded. Off until asked.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12) // MIDI to Hz

let ctx, master, verb, buses, arpTimer
let on = false
let scene = 'intro'

function impulse(seconds, decay) {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function noise(seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function bus(send = 0.5) {
  const g = ctx.createGain()
  g.gain.value = 0
  g.connect(master)
  const s = ctx.createGain()
  s.gain.value = send
  g.connect(s).connect(verb)
  return g
}

function pad(out, notes, { type = 'sawtooth', cutoff = 900, gain = 0.05, detune = 7 } = {}) {
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = cutoff
  lp.Q.value = 0.7
  lp.connect(out)
  notes.forEach((n) => {
    ;[-detune, detune].forEach((dt) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = NOTE(n)
      o.detune.value = dt
      const g = ctx.createGain()
      g.gain.value = gain
      o.connect(g).connect(lp)
      o.start()
    })
  })
  // slow filter breathing
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.05 + Math.random() * 0.05
  const lg = ctx.createGain()
  lg.gain.value = cutoff * 0.45
  lfo.connect(lg).connect(lp.frequency)
  lfo.start()
  return lp
}

function looped(out, { type, freq, q = 1, gain }) {
  const src = ctx.createBufferSource()
  src.buffer = noise(3)
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(out)
  src.start()
  return g
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.connect(ctx.destination)
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(comp)
  verb = ctx.createConvolver()
  verb.buffer = impulse(4, 2.6)
  verb.connect(master)

  buses = {
    intro: bus(0.7),
    swarm: bus(0.3),
    void: bus(0.6),
    dawn: bus(0.75),
    bloom: bus(0.75),
  }

  // Intro: open, airy C major 9.
  pad(buses.intro, [48, 52, 55, 59, 62], { type: 'triangle', cutoff: 1400, gain: 0.05 })
  looped(buses.intro, { type: 'bandpass', freq: 2400, q: 0.4, gain: 0.012 })

  // Swarm: gated low pulse and a dissonant cluster, with ticking hats.
  const gate = ctx.createGain()
  gate.gain.value = 0.5
  gate.connect(buses.swarm)
  const gl = ctx.createOscillator()
  gl.frequency.value = 4
  const gg = ctx.createGain()
  gg.gain.value = 0.5
  gl.connect(gg).connect(gate.gain)
  gl.start()
  pad(gate, [33, 45, 46], { type: 'sawtooth', cutoff: 520, gain: 0.07, detune: 12 })

  // Void: beating sub drone, rumble, and a thin whistle with vibrato.
  pad(buses.void, [26, 26.2, 38], { type: 'sine', cutoff: 300, gain: 0.16, detune: 3 })
  looped(buses.void, { type: 'lowpass', freq: 110, q: 0.5, gain: 0.25 })
  const wh = ctx.createOscillator()
  wh.frequency.value = NOTE(91)
  const vib = ctx.createOscillator()
  vib.frequency.value = 5.5
  const vg = ctx.createGain()
  vg.gain.value = 9
  vib.connect(vg).connect(wh.frequency)
  const whg = ctx.createGain()
  whg.gain.value = 0.006
  wh.connect(whg).connect(buses.void)
  wh.start()
  vib.start()

  // Dawn and bloom: warm D lydian, bloom a little brighter.
  pad(buses.dawn, [50, 54, 57, 61, 64, 68], { type: 'triangle', cutoff: 1600, gain: 0.04 })
  pad(buses.bloom, [50, 57, 61, 64, 68, 73], { type: 'triangle', cutoff: 2600, gain: 0.04 })
  looped(buses.dawn, { type: 'bandpass', freq: 900, q: 0.3, gain: 0.01 })

  // Arpeggiator and hats share one clock.
  let step = 0
  arpTimer = setInterval(() => {
    if (!on) return
    step++
    const tNow = ctx.currentTime + 0.02
    if (scene === 'swarm') hat(tNow, step % 4 === 0 ? 0.05 : 0.025)
    if (scene === 'dawn' && step % 9 === 0) pluck(tNow, pick([62, 64, 66, 69, 71, 74]), 0.05, buses.dawn)
    if (scene === 'bloom' && step % 4 === 0) pluck(tNow, pick([74, 76, 78, 81, 83, 86, 88]), 0.045, buses.bloom)
    if (scene === 'intro' && step % 22 === 0) pluck(tNow, pick([72, 74, 79, 83]), 0.03, buses.intro)
  }, 110)
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function pluck(t, note, gain, out) {
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = NOTE(note)
  const o2 = ctx.createOscillator()
  o2.type = 'triangle'
  o2.frequency.value = NOTE(note + 12)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
  o.connect(g)
  o2.connect(g)
  g.connect(out)
  o.start(t)
  o2.start(t)
  o.stop(t + 1.7)
  o2.stop(t + 1.7)
}

function hat(t, gain) {
  const src = ctx.createBufferSource()
  src.buffer = noise(0.1)
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7000
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  src.connect(f).connect(g).connect(buses.swarm)
  src.start(t)
}

function swell(seconds, from, to, peak) {
  const src = ctx.createBufferSource()
  src.buffer = noise(seconds + 0.5)
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.2
  const t = ctx.currentTime
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + seconds)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + seconds * 0.85)
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.3)
  src.connect(f).connect(g).connect(master)
  src.start()
}

export const score = {
  get on() {
    return on
  },
  async start() {
    if (!ctx) build()
    await ctx.resume()
    on = true
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8)
    this.setScene(scene, true)
  },
  stop() {
    if (!ctx) return
    on = false
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
  },
  /** Crossfade to a section's soundscape. */
  setScene(id, force) {
    if (id === scene && !force) return
    scene = id
    if (!ctx) return
    const t = ctx.currentTime
    Object.entries(buses).forEach(([k, g]) => {
      const target = k === id ? (k === 'void' ? 1 : 0.8) : 0
      g.gain.cancelScheduledValues(t)
      g.gain.setTargetAtTime(target, t, k === id ? 0.9 : 0.6)
    })
  },
  whoosh() {
    if (on) swell(0.9, 300, 3200, 0.06)
  },
  /** Riser into the supernova, then the boom. */
  nova(delay = 1.1) {
    if (!on) return
    swell(delay, 120, 6000, 0.22)
    const t = ctx.currentTime + delay
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(70, t)
    o.frequency.exponentialRampToValueAtTime(28, t + 2.4)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 3.2)
    const crash = ctx.createBufferSource()
    crash.buffer = noise(3)
    const cg = ctx.createGain()
    cg.gain.setValueAtTime(0.25, t)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
    const cs = ctx.createGain()
    cs.gain.value = 1
    crash.connect(cg).connect(cs).connect(verb)
    crash.start(t)
  },
  dispose() {
    clearInterval(arpTimer)
  },
}
