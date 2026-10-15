import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, NOVA } from './chapters'
import { xp } from './store'
import { score } from './score'

// fast start, long soft landing: responds instantly, settles smoothly
const easeInOutSine = (t) => 1 - Math.pow(1 - t, 3)
const LAST = CHAPTERS.length - 1

/**
 * Chapter navigation. In "chapters" mode the page is locked and every wheel
 * gesture, swipe or arrow key moves exactly one chapter. Moving past the last
 * chapter hands control to normal scrolling ("page" mode); scrolling back up
 * at the very top returns to the experience.
 */
export function useChapters() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState('chapters')
  const [playing, setPlaying] = useState(false)
  const [moving, setMoving] = useState(false)
  const idx = useRef(0)
  const raf = useRef(0)
  const animating = useRef(false)
  const gestureLock = useRef(false)
  const unlockTimer = useRef(0)
  const modeRef = useRef('chapters')

  const goTo = useCallback((target) => {
    const i = Math.max(0, Math.min(LAST, target))
    const from = idx.current
    if (i === from) return
    const forward = i > from
    const dur = (xp.reduced ? 0.01 : (CHAPTERS[forward ? i : from].duration ?? 0.95) * (Math.abs(i - from) > 1 ? 1.2 : 1)) * 1000
    const p0 = xp.progress
    const p1 = CHAPTERS[i].p
    cancelAnimationFrame(raf.current)
    animating.current = true
    setMoving(true)
    const start = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - start) / dur)
      xp.progress = p0 + (p1 - p0) * easeInOutSine(k)
      if (k < 1) raf.current = requestAnimationFrame(tick)
      else {
        animating.current = false
        setMoving(false)
      }
    }
    raf.current = requestAnimationFrame(tick)
    idx.current = i
    setIndex(i)
    score.setScene(CHAPTERS[i].sound)
    if (forward && p0 < NOVA && p1 > NOVA) score.nova(((NOVA - p0) / (p1 - p0)) * (dur / 1000))
    else score.whoosh()
  }, [])

  const enterPage = useCallback(() => {
    modeRef.current = 'page'
    xp.inPage = true
    setMode('page')
    setPlaying(false)
    document.documentElement.style.overflow = ''
    requestAnimationFrame(() => window.scrollTo({ top: window.innerHeight, behavior: xp.reduced ? 'auto' : 'smooth' }))
  }, [])

  const enterChapters = useCallback(() => {
    modeRef.current = 'chapters'
    xp.inPage = false
    setMode('chapters')
    window.scrollTo({ top: 0 })
    document.documentElement.style.overflow = 'hidden'
  }, [])

  const step = useCallback(
    (dir) => {
      // never block: a new gesture retargets from wherever the camera is
      if (dir > 0 && idx.current === LAST && !animating.current) enterPage()
      else if (dir > 0 && idx.current === LAST) return
      else goTo(idx.current + dir)
    },
    [goTo, enterPage],
  )

  // Input
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    let touchY = null

    const onWheel = (e) => {
      if (modeRef.current === 'page') {
        if (window.scrollY <= 0 && e.deltaY < -4) {
          e.preventDefault()
          enterChapters()
          gestureLock.current = true
        }
        return
      }
      e.preventDefault()
      // One gesture, one step: stay locked until the wheel has been quiet for
      // a moment, which swallows trackpad momentum.
      clearTimeout(unlockTimer.current)
      unlockTimer.current = setTimeout(() => (gestureLock.current = false), 90)
      if (gestureLock.current || Math.abs(e.deltaY) < 8) return
      gestureLock.current = true
      setPlaying(false)
      step(e.deltaY > 0 ? 1 : -1)
    }
    const onTouchStart = (e) => (touchY = e.touches[0].clientY)
    const onTouchMove = (e) => {
      if (modeRef.current === 'chapters') e.preventDefault()
    }
    const onTouchEnd = (e) => {
      if (touchY == null) return
      const dy = touchY - e.changedTouches[0].clientY
      touchY = null
      if (Math.abs(dy) < 45) return
      if (modeRef.current === 'page') {
        if (window.scrollY <= 0 && dy < 0) enterChapters()
        return
      }
      setPlaying(false)
      step(dy > 0 ? 1 : -1)
    }
    const onKey = (e) => {
      if (modeRef.current === 'page' || e.target.closest?.('input, textarea, [role=dialog]')) return
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        setPlaying(false)
        step(1)
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        setPlaying(false)
        step(-1)
      }
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
      cancelAnimationFrame(raf.current)
      document.documentElement.style.overflow = ''
      xp.inPage = false
    }
  }, [step, enterChapters])

  // Autoplay: hold each chapter long enough to read, then move on.
  useEffect(() => {
    if (!playing || moving || mode !== 'chapters') return
    if (index === LAST) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => goTo(idx.current + 1), CHAPTERS[index].hold * 1000)
    return () => clearTimeout(t)
  }, [playing, moving, index, mode, goTo])

  const play = useCallback(() => {
    if (playing) return setPlaying(false)
    if (idx.current === LAST) {
      goTo(0)
    }
    setPlaying(true)
  }, [playing, goTo])

  return { index, mode, playing, moving, goTo, step, play, enterPage, enterChapters, setPlaying }
}
