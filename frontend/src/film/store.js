import { motionValue } from 'motion/react'

// Mutable, render-free state shared between the DOM and the WebGL scene.
// Scroll writes `target`; the camera rig damps `progress` toward it every frame.
// Nothing here triggers React renders, so the film runs at full frame rate.
export const film = {
  target: 0,
  progress: 0,
  pointer: { x: 0, y: 0 },
  reduced: false,
  mobile: false,
}

// The same damped progress as a motion value, for DOM layers (captions, HUD).
// Written once per frame by the camera rig.
export const filmProgress = motionValue(0)

if (import.meta.env.DEV && typeof window !== 'undefined') window.__film = film
