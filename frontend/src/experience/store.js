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
  bhScale: 0, // the black hole's current size, for lensing what passes behind it
  novaT: 0, // the supernova's own clock, in seconds; runs forward past it and rewinds before it
  storyFade: 0, // 0..1 as the page scrolls up over the story
  card: { x: 0, y: 0.1, z: 0, halfW: 1.7, halfH: 1.07 }, // the credential's live centre and half size, in world units
}

// The same progress as a motion value, for DOM layers.
export const xpProgress = motionValue(0)

if (import.meta.env.DEV && typeof window !== 'undefined') window.__xp = xp

/**
 * The supernova's clock, in seconds. It runs on its own once the story
 * passes the explosion, so the explosion always plays out in full however
 * fast the scroll moves; scrolling back rewinds it, so it plays in reverse;
 * and jumping far ahead fast-forwards it, so later chapters arrive complete.
 */
export const NOVA_END = 3.6 // seconds: the explosion, the card and the nebula have all formed

export function novaTime() {
  if (xp.reduced) return xp.progress >= NOVA ? 99 : 0
  return xp.novaT
}
