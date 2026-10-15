// Quality tiers for the landing's WebGL scene.
//
// The tier is chosen once, at startup, from what the device reports. Anything
// that would reallocate the canvas or a render target (resolution, post-
// processing, shader variants) is fixed for the session: changing those
// mid-story is what shows up as black flashes on phones. At runtime a monitor
// can only step down, and only through changes that cost nothing to apply:
// the frame-rate cap and how many particles are drawn.

export const TIERS = {
  // desktop and laptops: everything on
  high: { dpr: 1.5, post: true, fps: 0, blackHoleSteps: 170, swarm: 1800, sparkles: 420 },
  // capable phones and tablets: no post-processing, but 60fps and a finer scene
  // (kept at the same 1x resolution as the profile that proved flicker-free on phones)
  medium: { dpr: 1, post: false, fps: 60, blackHoleSteps: 96, swarm: 1100, sparkles: 260 },
  // everything else: the stable profile
  low: { dpr: 1, post: false, fps: 30, blackHoleSteps: 76, swarm: 700, sparkles: 160 },
}

/**
 * Picks a tier from the device. Desktop-width screens get `high` (they also
 * keep their adaptive resolution). Phones get `medium` only when they report
 * plenty of cores and memory; reduced motion always gets `low`.
 */
export function detectTier({ mobile, reduced }) {
  if (!mobile) return 'high'
  if (reduced) return 'low'
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4 // Chrome only; others report nothing
  const score = (cores >= 8 ? 2 : cores >= 6 ? 1 : 0) + (memory >= 8 ? 2 : memory >= 6 ? 1 : 0)
  return score >= 3 ? 'medium' : 'low'
}

/**
 * Watches frame times and steps down with hysteresis: frames must run slow
 * for two consecutive windows before anything changes, and nothing ever
 * steps back up within a session. Returns the next action, if any.
 */
export function createFrameGuard({ budgetMs, windowMs = 2000 }) {
  let sum = 0
  let n = 0
  let start = 0
  let slowWindows = 0
  return (now, dtMs) => {
    if (!start) start = now
    sum += dtMs
    n++
    if (now - start < windowMs) return null
    const avg = sum / n
    sum = 0
    n = 0
    start = now
    slowWindows = avg > budgetMs * 1.35 ? slowWindows + 1 : 0
    if (slowWindows >= 2) {
      slowWindows = 0
      return 'step-down'
    }
    return null
  }
}
