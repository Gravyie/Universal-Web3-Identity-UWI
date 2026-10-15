import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, NOVA, P } from './chapters'
import { NOVA_END } from './store'

const CARD_FORMED = 2.4 // seconds into the supernova when the card is complete
import { xp } from './store'
import { score } from './score'
import { createWheelIntent } from './wheelIntent'

const LAST = CHAPTERS.length - 1
const STEP = 1 / LAST
const LEAN = 0.16 // how far (in chapters) the scene leans toward a scroll that hasn't committed yet
const OMEGA = 6.2 // spring stiffness: a chapter move settles in about 0.8s

/**
 * Scroll and swipe move one chapter at a time, and every move is a
 * critically damped spring, so the camera glides in and settles with no
 * jolt. While you scroll, the scene leans toward where you're going before
 * the move commits, so input always feels connected.
 *
 * Trackpads keep firing decaying "inertia" events for a second or more
 * after a flick. Those are ignored, so one flick is one chapter. Scrolling
 * that is still deliberate (steady or accelerating) carries straight on to
 * the next chapter once the current move lands, so a long scroll flows
 * through the story without lifting your fingers.
 */
export function useChapters() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState('chapters')
  const [playing, setPlaying] = useState(false)
  const target = useRef(0)
  const lean = useRef(0)
  const vel = useRef(0)
  const idx = useRef(0)
  const modeRef = useRef('chapters')
  if (import.meta.env.DEV) window.__xpTarget = target

  const goTo = useCallback((i) => {
    target.current = Math.max(0, Math.min(LAST, i)) * STEP
  }, [])

  // From the wheel, the page just takes over and the same scroll carries on
  // natively; from a button, key or swipe, it glides down to the page.
  const enterPage = useCallback((glide = true) => {
    modeRef.current = 'page'
    xp.inPage = true
    setMode('page')
    setPlaying(false)
    document.documentElement.style.overflow = ''
    if (glide) requestAnimationFrame(() => window.scrollTo({ top: window.innerHeight, behavior: xp.reduced ? 'auto' : 'smooth' }))
  }, [])

  const enterChapters = useCallback(() => {
    modeRef.current = 'chapters'
    xp.inPage = false
    setMode('chapters')
    window.scrollTo({ top: 0 })
    document.documentElement.style.overflow = 'hidden'
  }, [])

  // Frame loop: spring progress toward target + lean; derive chapter, sound and nova.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const prev = xp.progress
      let goal = Math.min(1, Math.max(0, target.current + lean.current * STEP))
      // Going back one step through the supernova is its exact mirror: the camera holds on
      // the remnant while the explosion rewinds at its own pace, then travels back as the
      // hole un-implodes. (A long jump back doesn't wait; it rewinds fast instead.)
      const stepBack = target.current < NOVA && target.current >= P.collapse - 0.01
      if (stepBack && xp.novaT > 0.45 && xp.progress >= NOVA) goal = Math.max(goal, xp.progress)
      if (xp.reduced) {
        xp.progress = target.current
        vel.current = 0
      } else {
        // critically damped spring, sub-stepped for stability at low frame rates
        for (let s = 0, h = dt / 4; s < 4; s++) {
          vel.current += ((goal - xp.progress) * OMEGA * OMEGA - vel.current * 2 * OMEGA) * h
          xp.progress += vel.current * h
        }
        if (Math.abs(goal - xp.progress) < 1e-5 && Math.abs(vel.current) < 1e-4) xp.progress = goal
      }
      if (prev < NOVA && xp.progress >= NOVA) {
        score.nova(0.05)
      }
      // the supernova's clock: forward past it (faster when far ahead), rewinding before it
      // It stops at NOVA_END (everything has formed by then), rewinds at its own pace when
      // stepping back (fast after a long jump), and snaps to zero once far out of shot.
      if (target.current < NOVA) {
        if (xp.progress < NOVA - STEP * 1.2) xp.novaT = 0
        // Stepping back: the quiet tail (after the card has formed) rewinds quickly; from there the
        // explosion plays backwards at exactly its forward pace, so both directions take the same time.
        else xp.novaT = Math.max(0, xp.novaT - dt * (stepBack ? (xp.novaT > CARD_FORMED ? 5 : 1) : 4))
      } else if (xp.progress >= NOVA) xp.novaT = Math.min(NOVA_END, xp.novaT + dt * (xp.progress > NOVA + STEP * 0.75 ? 3 : 1))
      const i = Math.round(xp.progress / STEP)
      if (i !== idx.current) {
        idx.current = i
        setIndex(i)
        score.setScene(CHAPTERS[i].sound)
        score.whoosh()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Input
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    const wheel = createWheelIntent()
    let locked = false // touch: a move is in flight
    let leanTimer = 0

    const settled = () => Math.abs(xp.progress - target.current) < STEP * 0.3

    const step = (dir, glide = true) => {
      setPlaying(false)
      const cur = Math.round(target.current / STEP)
      lean.current = 0
      wheel.lock(dir)
      locked = true
      if (dir > 0 && cur === LAST) return enterPage(glide)
      goTo(cur + dir)
    }

    const input = (dy, now) => {
      const r = wheel.feed(dy, now, settled())
      if (r.step) return step(r.step, false)
      lean.current = r.lean * LEAN
      clearTimeout(leanTimer)
      leanTimer = setTimeout(() => {
        lean.current = 0
        wheel.reset()
      }, 220)
    }

    const onWheel = (e) => {
      const now = performance.now()
      if (modeRef.current === 'page') {
        // The page scrolls natively. Scrolling up past its top lands back on the
        // last chapter, and that scroll ends there: going further back takes a
        // new scroll, just like reaching the top of any page.
        if (window.scrollY <= 0 && e.deltaY < 0) {
          e.preventDefault()
          enterChapters()
          wheel.spend(-1)
        }
        return
      }
      e.preventDefault()
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY
      input(dy, now)
    }

    let touchY = null
    let touchStart = 0
    let touchT = 0
    const onTouchStart = (e) => {
      touchY = touchStart = e.touches[0].clientY
      touchT = performance.now()
      locked = locked && !settled()
    }
    const onTouchMove = (e) => {
      if (touchY == null) return
      const y = e.touches[0].clientY
      if (modeRef.current === 'page') {
        if (window.scrollY <= 0 && y - touchStart > 60) enterChapters()
        return
      }
      e.preventDefault()
      touchY = y
      if (locked) {
        if (settled()) {
          // a long drag carries on to the next chapter once the move lands
          locked = false
          touchStart = y
        } else return
      }
      const pulled = touchStart - y
      if (Math.abs(pulled) > 110) {
        step(Math.sign(pulled))
        touchStart = y
      } else lean.current = (pulled / 110) * LEAN
    }
    const onTouchEnd = () => {
      if (touchY == null) return
      const pulled = touchStart - touchY
      const speed = Math.abs(pulled) / Math.max(1, performance.now() - touchT)
      if (!locked && modeRef.current === 'chapters' && (Math.abs(pulled) > 45 || (speed > 0.35 && Math.abs(pulled) > 12))) step(Math.sign(pulled))
      lean.current = 0
      touchY = null
    }
    const onKey = (e) => {
      if (modeRef.current === 'page' || e.target.closest?.('input, textarea, [role=dialog]')) return
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0
      if (!dir) return
      e.preventDefault()
      step(dir)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      clearTimeout(leanTimer)
      document.documentElement.style.overflow = ''
      xp.inPage = false
    }
  }, [goTo, enterPage, enterChapters])

  // Autoplay: hold each chapter long enough to read, then glide on.
  useEffect(() => {
    if (!playing || mode !== 'chapters') return
    if (index === LAST) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => goTo(index + 1), (CHAPTERS[index].hold + 0.6) * 1000)
    return () => clearTimeout(t)
  }, [playing, index, mode, goTo])

  const play = useCallback(() => {
    if (playing) return setPlaying(false)
    const cur = Math.round(target.current / STEP) // where the story is heading, not where it is mid-move
    if (cur === LAST) goTo(0)
    else goTo(cur + 1)
    setPlaying(true)
  }, [playing, goTo])

  return { index, mode, playing, goTo, play, enterPage, enterChapters, setPlaying }
}
