/*
 * Holo foil engine. Adapted from Arlan Marat's "Holo" (https://www.arlan.me/vault/holo,
 * MIT): the foil-layer recipes and the layer stack come from there; the physics
 * and frame mapping are reimplemented here.
 *
 * Everything is driven through CSS custom properties on the card element,
 * written straight from a rAF loop, so React never re-renders while it moves.
 */

const SUNPILLARS = [
  'hsl(2, 100%, 73%)',
  'hsl(53, 100%, 69%)',
  'hsl(93, 100%, 69%)',
  'hsl(176, 100%, 76%)',
  'hsl(228, 100%, 74%)',
  'hsl(283, 100%, 73%)',
]

function rainbow(angle, space, hues = SUNPILLARS) {
  const stops = hues
    .map((c, i) => `${c} calc(${space} * ${i + 1})`)
    .concat(`${hues[0]} calc(${space} * ${hues.length + 1})`)
    .join(', ')
  return `repeating-linear-gradient(${angle}, ${stops})`
}

const STARS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23fff'%3E%3Ccircle cx='68' cy='78' r='.6' opacity='.6'/%3E%3Ccircle cx='26' cy='26' r='.5'/%3E%3Ccircle cx='11' cy='33' r='.5' opacity='.6'/%3E%3Ccircle cx='66' cy='30' r='.8' opacity='.8'/%3E%3Ccircle cx='50' cy='37' r='.7' opacity='.8'/%3E%3Ccircle cx='89' cy='24' r='.3'/%3E%3Ccircle cx='15' cy='46' r='.8' opacity='.6'/%3E%3Ccircle cx='93' cy='57' r='.6' opacity='.9'/%3E%3Ccircle cx='51' cy='87' r='1.6' opacity='.95'/%3E%3Ccircle cx='5' cy='68' r='1.6' opacity='.95'/%3E%3Ccircle cx='28' cy='15' r='1.4' opacity='.95'/%3E%3Ccircle cx='59' cy='44' r='1.3' opacity='.95'/%3E%3C/svg%3E")`

/** Card finishes. Users pick one in settings; it's stored per device. */
export const FOILS = {
  holo: {
    label: 'Holo',
    layers: [
      { img: rainbow('10deg', '8%'), size: '380% 380%', rate: 1, blend: 'overlay', filter: 'brightness(1.08) contrast(2.3) saturate(1.5)', base: 0.26, gain: 0.6 },
      { img: rainbow('104deg', '13%'), size: '300% 300%', rate: -0.7, blend: 'color-dodge', filter: 'brightness(.82) contrast(2) saturate(1.7)', base: 0.14, gain: 0.34 },
      { img: 'repeating-linear-gradient(96deg, rgba(255,255,255,.5) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,.16) 3px, rgba(255,255,255,0) 5px)', size: 'auto', rate: 1.8, blend: 'overlay', filter: 'contrast(1.3)', base: 0.1, gain: 0.26 },
    ],
    bloom: 0.55,
    glare: 0.55,
  },
  prism: {
    label: 'Prism',
    layers: [
      {
        img:
          'repeating-linear-gradient(45deg, hsl(0,0%,10%) 0%, hsl(0,0%,22%) 1.4%, hsl(0,0%,42%) 2.6%, hsl(0,0%,50%) 3.4%, hsl(0,0%,32%) 4.6%, hsl(0,0%,8%) 6%), repeating-linear-gradient(-45deg, hsl(0,0%,10%) 0%, hsl(0,0%,24%) 1.6%, hsl(0,0%,46%) 3%, hsl(0,0%,52%) 3.8%, hsl(0,0%,28%) 5.2%, hsl(0,0%,8%) 6.6%)',
        size: '210% 210%, 190% 190%',
        rate: 1.5,
        bgBlend: 'exclusion',
        blend: 'color-dodge',
        filter: 'brightness(.62) contrast(2.2) saturate(1.6)',
        base: 0.3,
        gain: 0.5,
      },
      { img: rainbow('55deg', '16%'), size: '400% 100%', rate: -2.5, blend: 'color-dodge', filter: 'brightness(.6) contrast(2.4) saturate(1.7)', base: 0.2, gain: 0.4 },
    ],
    bloom: 0.55,
    glare: 0.52,
  },
  cosmos: {
    label: 'Cosmos',
    layers: [
      { img: `${STARS}, ${rainbow('82deg', '8%')}`, size: '38% 38%, 420% 900%', rate: 0.35, bgBlend: 'color-burn', blend: 'color-dodge', filter: 'brightness(1) contrast(1.6) saturate(.9)', base: 0.28, gain: 0.45 },
      { img: STARS, size: '22% 22%', rate: 1.6, blend: 'overlay', filter: 'brightness(1.3) contrast(1.7)', base: 0.2, gain: 0.4 },
      { img: STARS, size: '13% 13%', rate: 2.6, blend: 'overlay', filter: 'brightness(1.1) contrast(1.5)', base: 0.12, gain: 0.3 },
    ],
    bloom: 0.55,
    glare: 0.46,
  },
  refractor: {
    label: 'Refractor',
    layers: [
      {
        img: rainbow('125deg', '7%', ['hsl(176,100%,76%)', 'hsl(196,100%,78%)', 'hsl(214,100%,76%)', 'hsl(228,100%,74%)', 'hsl(200,100%,80%)', 'hsl(168,100%,78%)']),
        size: '200% 700%',
        rate: 1.2,
        blend: 'color-dodge',
        filter: 'brightness(.7) contrast(1.8) saturate(1.9)',
        base: 0.22,
        gain: 0.4,
      },
      { img: 'repeating-linear-gradient(100deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 1.2%, rgba(0,0,0,.25) 2.2%, rgba(255,255,255,0) 3.4%)', size: '300% 100%', rate: -0.8, blend: 'hard-light', filter: 'brightness(1.05) contrast(1.4)', base: 0.18, gain: 0.36 },
    ],
    bloom: 0.55,
    glare: 0.64,
  },
}

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Critically-damped-ish spring toward a 2D target. */
export class Follow {
  constructor(stiffness, damping = 0.74) {
    this.k = stiffness
    this.d = damping
    this.value = { x: 0, y: 0 }
    this.velocity = { x: 0, y: 0 }
    this.target = { x: 0, y: 0 }
  }
  step() {
    for (const a of ['x', 'y']) {
      this.velocity[a] = (this.velocity[a] + (this.target[a] - this.value[a]) * this.k) * this.d
      this.value[a] += this.velocity[a]
    }
  }
  get speed() {
    return Math.hypot(this.velocity.x, this.velocity.y)
  }
  get settled() {
    return this.speed < 1e-4 && Math.abs(this.target.x - this.value.x) + Math.abs(this.target.y - this.value.y) < 1e-3
  }
}

/** A flick on release: the card overshoots in the direction it was moving, then decays. */
export class Kick {
  constructor() {
    this.v = { x: 0, y: 0 }
  }
  fire(velocity) {
    this.v = { x: velocity.x * 5, y: velocity.y * 5 }
  }
  step() {
    const out = { ...this.v }
    this.v.x *= 0.86
    this.v.y *= 0.86
    if (!this.active) this.v = { x: 0, y: 0 }
    return out
  }
  get active() {
    return Math.hypot(this.v.x, this.v.y) > 1e-3
  }
}

/** Device tilt relative to how the phone was held when the card appeared. */
export class Orientation {
  read(e) {
    if (e.beta == null || e.gamma == null) return null
    this.base ??= { beta: e.beta, gamma: e.gamma }
    return {
      x: clamp((e.gamma - this.base.gamma) / 22, -1, 1),
      y: clamp((e.beta - this.base.beta) / 22, -1, 1),
    }
  }
}

export function fromPointer(rect, clientX, clientY) {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
    y: clamp(((clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
  }
}

export function applyFoil(card, foil) {
  for (let i = 0; i < 3; i++) {
    const n = i + 1
    const L = foil.layers[i]
    const s = card.style
    s.setProperty(`--l${n}-img`, L ? L.img : 'none')
    s.setProperty(`--l${n}-size`, L?.size ?? 'auto')
    s.setProperty(`--l${n}-blend`, L?.blend ?? 'normal')
    s.setProperty(`--l${n}-bgblend`, L?.bgBlend ?? 'normal')
    s.setProperty(`--l${n}-filter`, L?.filter ?? 'none')
    if (!L) s.setProperty(`--l${n}-o`, '0')
  }
  card.style.setProperty('--glare-o', String(foil.glare))
}

/**
 * Maps the card's tilt (x, y in -1…1) and the lagging foil sheet onto every
 * variable the CSS reads. `sheet` trails `tilt`, which is what makes the
 * rainbow appear to slide across the surface rather than stick to it.
 */
export function applyFrame(card, tilt, sheet, foil, { speed = 0, velocity = { x: 0, y: 0 }, time = 0 } = {}) {
  const s = card.style
  const { x, y } = tilt
  const mag = clamp(Math.hypot(x, y))
  const set = (k, v) => s.setProperty(k, v)

  set('--rx', `${(-y * 11).toFixed(2)}deg`)
  set('--ry', `${(x * 15).toFixed(2)}deg`)

  foil.layers.forEach((L, i) => {
    const n = i + 1
    set(`--l${n}-x`, `${(50 + sheet.x * L.rate * 38).toFixed(2)}%`)
    set(`--l${n}-y`, `${(50 + sheet.y * L.rate * 38).toFixed(2)}%`)
    set(`--l${n}-o`, clamp(L.base + L.gain * mag, 0, 1).toFixed(3))
  })

  set('--gx', `${(50 + x * 48).toFixed(2)}%`)
  set('--gy', `${(50 + y * 48).toFixed(2)}%`)
  set('--edge-t', clamp(-y).toFixed(3))
  set('--edge-b', clamp(y).toFixed(3))
  set('--edge-l', clamp(-x).toFixed(3))
  set('--edge-r', clamp(x).toFixed(3))
  set('--spot', (mag * foil.bloom).toFixed(3))
  set('--smear', clamp(speed * 30).toFixed(3))
  set('--smear-angle', `${((Math.atan2(velocity.y, velocity.x) * 180) / Math.PI + 90).toFixed(1)}deg`)

  // The security pattern rises on the side you tilt toward.
  const angle = `${((Math.atan2(-x, y) * 180) / Math.PI).toFixed(1)}deg`
  set('--reveal', clamp(mag * 1.35).toFixed(3))
  set('--reveal-x', `${(50 + x * 55).toFixed(1)}%`)
  set('--reveal-y', `${(50 + y * 55).toFixed(1)}%`)
  set('--reveal-angle', angle)

  set('--emboss-x', `${(x * 1.6).toFixed(2)}px`)
  set('--emboss-y', `${(y * 1.6).toFixed(2)}px`)

  // The print on the tile flips to its negative as the light sweeps across.
  set('--tile-invert', smoothstep(0.3, 0.95, mag).toFixed(3))
  set('--tile-x', `${(50 + x * 10).toFixed(1)}%`)
  set('--tile-sweep-angle', angle)
  set('--breath', (0.5 + 0.5 * Math.sin(time * 1.3)).toFixed(3))
}
