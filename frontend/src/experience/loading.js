// Real readiness for the landing experience. The preloader shows these
// milestones and lifts only when all of them are done (or the 3D scene has
// failed and the static fallback takes over). Weights are rough shares of
// the wait on a typical laptop.
export const STEPS = [
  { id: 'fonts', label: 'Loading type', weight: 0.1 },
  { id: 'scene', label: 'Loading the scene', weight: 0.3 },
  { id: 'gl', label: 'Starting WebGL', weight: 0.1 },
  { id: 'shaders', label: 'Compiling shaders', weight: 0.35 },
  { id: 'frames', label: 'Warming up', weight: 0.15 },
]

const done = new Set()
let failed = null
let snapshot = null
const listeners = new Set()

function compute() {
  const progress = STEPS.reduce((sum, s) => sum + (done.has(s.id) ? s.weight : 0), 0)
  const next = STEPS.find((s) => !done.has(s.id))
  return {
    progress: failed ? 1 : progress,
    label: failed ? 'Starting the simple version' : (next?.label ?? 'Ready'),
    ready: Boolean(failed) || !next,
    failed,
  }
}

function emit() {
  snapshot = compute()
  listeners.forEach((fn) => fn())
}

export const loading = {
  /** A milestone has been reached. */
  mark(id) {
    if (done.has(id)) return
    done.add(id)
    emit()
  },
  has: (id) => done.has(id),
  /** The 3D scene can't run here; the page falls back to its static version. */
  fail(reason) {
    if (failed) return
    failed = reason
    emit()
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  get() {
    return (snapshot ??= compute())
  },
}

/** Whether this browser can create a WebGL context at all. */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

if (typeof document !== 'undefined') {
  // the display type is part of the first frame; wait for it (fonts.ready never rejects)
  ;(document.fonts?.ready ?? Promise.resolve()).then(() => loading.mark('fonts'))
}
