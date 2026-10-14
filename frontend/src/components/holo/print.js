// Deterministic "print" for the card tile: a fingerprint-like whorl generated
// from the holder's address. Unique per person, derived from public data, and
// nothing biometric — the point of UWI is that your real features stay home.

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hueFor(seed = '') {
  return hash(seed.toLowerCase() || 'uwi') % 360
}

const cache = new Map()

export function printFor(seed = '') {
  const key = seed.toLowerCase() || 'uwi'
  if (cache.has(key)) return cache.get(key)
  const rand = rng(hash(key))
  const cx = 50 + (rand() - 0.5) * 16
  const cy = 54 + (rand() - 0.5) * 14
  const twist = rand() * 40 - 20
  const stretch = 1.15 + rand() * 0.3

  let paths = ''
  for (let i = 1; i <= 17; i++) {
    const r = i * 3.6
    // Each ridge is an open arc with a gap, wobbling slightly.
    const gapAt = rand() * Math.PI * 2
    const gap = 0.35 + rand() * 0.5
    const steps = 60
    let d = ''
    for (let s = 0; s <= steps; s++) {
      const t = gapAt + gap / 2 + (s / steps) * (Math.PI * 2 - gap)
      const wobble = 1 + Math.sin(t * (3 + (i % 3)) + i) * 0.035
      const x = cx + Math.cos(t) * r * wobble
      const y = cy + Math.sin(t) * r * wobble * stretch
      d += `${s ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    paths += `<path d='${d}'/>`
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 116'><rect width='100' height='116' fill='#e9e9ee'/><g fill='none' stroke='#1d1d26' stroke-width='1.55' stroke-linecap='round' transform='rotate(${twist.toFixed(1)} 50 58)'>${paths}</g></svg>`
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  cache.set(key, url)
  return url
}
