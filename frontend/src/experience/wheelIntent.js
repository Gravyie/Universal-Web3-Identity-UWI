// Turns a raw wheel stream into chapter steps. Trackpads keep firing decaying
// "inertia" events for a second or more after a flick; those never trigger a
// step. Deliberate scrolling (after a pause, steady, or accelerating) does,
// so one flick is one chapter and a long scroll walks through chapter by chapter.

export const THRESHOLD = 90 // px of deliberate scroll that commits a step

export function createWheelIntent() {
  let acc = 0
  let lastT = -1e9
  let locked = false
  let lockDir = 0
  const recent = []
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length

  const isIntent = (mag, gap) => {
    if (gap > 160) return true
    if (recent.length < 8 || mag < 6) return false
    // inertia decays; intent holds steady or grows
    return avg([...recent.slice(-3), mag]) >= avg(recent.slice(-7, -3))
  }

  return {
    /**
     * Feed one wheel delta. `settled` says whether the last step has mostly landed.
     * Returns { step: -1 | 0 | 1, lean: -1..1 } where lean previews an uncommitted scroll.
     */
    feed(dy, now, settled) {
      const gap = now - lastT
      lastT = now
      const mag = Math.abs(dy)
      const intent = isIntent(mag, gap)
      recent.push(mag)
      if (recent.length > 8) recent.shift()
      const dir = Math.sign(dy)
      if (locked) {
        // reversing is always honoured; otherwise wait for the move to land
        if (!(intent && dir && (dir !== lockDir || settled))) return { step: 0, lean: 0 }
        locked = false
        acc = 0
      }
      acc = acc * Math.exp(-Math.min(gap, 400) / 220) + dy
      if (Math.abs(acc) >= THRESHOLD) {
        const s = Math.sign(acc)
        locked = true
        lockDir = s
        acc = 0
        return { step: s, lean: 0 }
      }
      return { step: 0, lean: acc / THRESHOLD }
    },
    /** A step that came from somewhere else (keys, touch) also locks. */
    lock(dir) {
      locked = true
      lockDir = dir
      acc = 0
    },
    reset() {
      acc = 0
    },
  }
}
