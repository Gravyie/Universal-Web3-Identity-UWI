// The landing experience is nine chapters. Each swipe moves one chapter; the
// 3D scene reads a continuous progress value (0..1) that the controller eases
// between chapter positions, so every transition is a camera move.

export const CHAPTERS = [
  { id: 'hero', name: 'Intro', sound: 'intro', hold: 2.4 },
  { id: 'many', name: 'The problem', sound: 'swarm', hold: 1.7 },
  { id: 'farmed', name: 'Farmed', sound: 'swarm', hold: 1.7 },
  { id: 'void', name: 'The proof', sound: 'void', hold: 1.8 },
  { id: 'collapse', name: 'Collapse', sound: 'void', hold: 1.6 },
  { id: 'dawn', name: 'Private', sound: 'dawn', hold: 2, duration: 1.6 },
  { id: 'card', name: 'Credential', sound: 'dawn', hold: 2, duration: 1.1 },
  { id: 'everywhere', name: 'Everywhere', sound: 'bloom', hold: 2.2 },
  { id: 'cta', name: 'Begin', sound: 'bloom', hold: 0 },
].map((c, i, all) => ({ ...c, p: i / (all.length - 1) }))

export const PORTALS = ['Airdrops', 'DAO votes', 'Games', 'Communities', 'Quests', 'Waitlists']

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const seg = (p, a, b) => clamp01((p - a) / (b - a))
export const smooth = (t) => t * t * (3 - 2 * t)
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Chapter positions as named constants, so scene timings read clearly. */
export const P = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.p]))
// The supernova happens mid-way through the collapse -> dawn transition.
export const NOVA = P.collapse + (P.dawn - P.collapse) * 0.42
