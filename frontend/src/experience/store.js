import { motionValue } from 'motion/react'

// Render-free state shared by the controller, the WebGL scene and DOM layers.
export const xp = {
  progress: 0, // 0..1 across all chapters, eased by the controller
  pointer: { x: 0, y: 0 },
  reduced: false,
  mobile: false,
  inPage: false, // true once the viewer has scrolled past the experience into the page
}

// The same progress as a motion value, for DOM layers.
export const xpProgress = motionValue(0)

if (import.meta.env.DEV && typeof window !== 'undefined') window.__xp = xp
