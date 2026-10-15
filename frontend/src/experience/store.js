import { motionValue } from 'motion/react'
import { NOVA } from './chapters'

// Render-free state shared by the controller, the WebGL scene and DOM layers.
export const xp = {
  progress: 0, // 0..1 across all chapters, eased by the controller
  pointer: { x: 0, y: 0 },
  reduced: false,
  mobile: false,
  inPage: false, // true once the viewer has scrolled past the experience into the page
  revealed: false, // the preloader has lifted and the hero is on screen
  novaStart: 0, // when (s) the story crossed into the supernova
  card: { x: 0, y: 0.1, z: 0, halfW: 1.7, halfH: 1.07 }, // the credential's live centre and half size, in world units
}

// The same progress as a motion value, for DOM layers.
export const xpProgress = motionValue(0)

if (import.meta.env.DEV && typeof window !== 'undefined') window.__xp = xp

/**
 * Seconds since the supernova went off. The explosion runs on its own clock
 * once triggered, so it plays out in full however fast the scroll moves.
 * 0 before it, a large number when there is nothing to play (reduced motion).
 */
export function novaTime() {
  if (xp.progress < NOVA) return 0
  if (xp.reduced || !xp.novaStart) return 99
  return performance.now() / 1000 - xp.novaStart
}
