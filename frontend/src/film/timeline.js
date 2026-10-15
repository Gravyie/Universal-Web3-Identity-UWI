// The film's script. Every number here is a position on the scroll track,
// 0 at the first frame and 1 at the last. The 3D scene, the HUD, the captions
// and the score all read from this one timeline.

export const RUNTIME_SECONDS = 150 // what the timecode reads at the final frame

export const ACTS = [
  { id: 'open', label: 'Cold open', start: 0, end: 0.08 },
  { id: 'swarm', label: 'Act I. The Swarm', start: 0.08, end: 0.3 },
  { id: 'proof', label: 'Act II. The Proof', start: 0.3, end: 0.5 },
  { id: 'credential', label: 'Act III. The Credential', start: 0.5, end: 0.68 },
  { id: 'everywhere', label: 'Act IV. Everywhere', start: 0.68, end: 0.88 },
  { id: 'finale', label: 'Finale', start: 0.88, end: 1 },
]

/** On-screen text. `kind` picks the treatment: a title card or a subtitle. */
export const CUES = [
  { kind: 'title', at: [0.005, 0.07], eyebrow: 'UWI presents', text: 'A film about being one person.' },
  { kind: 'caption', at: [0.1, 0.17], text: 'Online, anyone can be a thousand people.' },
  { kind: 'caption', at: [0.18, 0.25], text: 'Every airdrop, every vote, every reward. Farmed by scripts.' },
  { kind: 'title', at: [0.255, 0.3], text: 'Wallets are free.', sub: 'People are not.' },
  { kind: 'caption', at: [0.32, 0.39], text: 'So you prove you are one. Once.' },
  { kind: 'caption', at: [0.4, 0.49], text: 'Your passport is read on your phone and turned into a zero-knowledge proof. It never leaves your hand.' },
  { kind: 'title', at: [0.52, 0.6], eyebrow: 'Soulbound', text: 'One human.', sub: 'One credential.' },
  { kind: 'caption', at: [0.61, 0.67], text: 'No name. No birthday. No passport number. Just the proof.' },
  { kind: 'caption', at: [0.7, 0.78], text: 'Airdrops. Votes. Games. Communities. They all ask the same question.' },
  { kind: 'caption', at: [0.79, 0.87], text: 'And get the same answer. Yes, a unique human. Nothing more.' },
]

export const PORTALS = ['Airdrops', 'DAO votes', 'Games', 'Communities', 'Quests', 'Waitlists']

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
/** 0 before a, 1 after b, linear in between. */
export const seg = (p, a, b) => clamp01((p - a) / (b - a))
export const smooth = (t) => t * t * (3 - 2 * t)
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Fades in over `f` at the start of [a,b] and out over `f` at the end. */
export const window01 = (p, a, b, f = 0.015) => Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b))

export const actAt = (p) => {
  const i = ACTS.findIndex((a) => p >= a.start && p < a.end)
  return i === -1 ? ACTS.length - 1 : i
}

export function timecode(p) {
  const total = p * RUNTIME_SECONDS
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  const f = Math.floor((total % 1) * 24)
  const pad = (n) => String(n).padStart(2, '0')
  return `00:${pad(m)}:${pad(s)}:${pad(f)}`
}
