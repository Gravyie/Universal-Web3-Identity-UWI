import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, NOVA } from './chapters'
import { xp } from './store'
import { score } from './score'

const LAST = CHAPTERS.length - 1
const STEP = 1 / LAST
const PX_PER_CHAPTER = 420 // wheel distance that scrubs one chapter
const SNAP_AFTER_MS = 140

/**
 * Scroll scrubs the story continuously: wheel and touch move a target
 * progress, the scene eases toward it every frame, and when input stops the
 * target settles on the nearest chapter. Nothing ever locks, so a long
 * continuous scroll flows straight through several chapters.
 */
export function useChapters() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState('chapters')
  const [playing, setPlaying] = useState(false)
  const target = useRef(0)
  const idx = useRef(0)
  const modeRef = useRef('chapters')
  const lastDir = useRef(1)
  const snapTimer = useRef(0)
  const overflow = useRef(0)
  if (import.meta.env.DEV) window.__xpTarget = target

  const snap = useCallback(() => {
    target.current = Math.round(target.current / STEP + 0.36 * lastDir.current) * STEP
    target.current = Math.min(1, Math.max(0, target.current))
  }, [])

  const goTo = useCallback((i) => {
    target.current = Math.max(0, Math.min(LAST, i)) * STEP
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

  // Frame loop: ease progress toward target; derive chapter, sound and nova.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const prev = xp.progress
      const k = xp.reduced ? 1 : 1 - Math.exp(-dt * 5.5)
      xp.progress = prev + (target.current - prev) * k
      if (Math.abs(target.current - xp.progress) < 1e-4) xp.progress = target.current
      if (prev < NOVA && xp.progress >= NOVA) score.nova(0.05)
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
    let touchY = null

    const scrub = (dy) => {
      setPlaying(false)
      lastDir.current = Math.sign(dy) || lastDir.current
      // pushing past the last chapter releases into the page
      if (target.current >= 1 && dy > 0) {
        overflow.current += dy
        if (overflow.current > 140) {
          overflow.current = 0
          enterPage()
        }
        return
      }
      overflow.current = 0
      target.current = Math.min(1, Math.max(0, target.current + (dy / PX_PER_CHAPTER) * STEP))
      clearTimeout(snapTimer.current)
      snapTimer.current = setTimeout(snap, SNAP_AFTER_MS)
    }

    const onWheel = (e) => {
      if (modeRef.current === 'page') {
        if (window.scrollY <= 0 && e.deltaY < -4) {
          e.preventDefault()
          enterChapters()
        }
        return
      }
      e.preventDefault()
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
      scrub(dy)
    }
    const onTouchStart = (e) => (touchY = e.touches[0].clientY)
    const onTouchMove = (e) => {
      if (touchY == null) return
      const y = e.touches[0].clientY
      if (modeRef.current === 'page') {
        if (window.scrollY <= 0 && y - touchY > 40) enterChapters()
        return
      }
      e.preventDefault()
      scrub((touchY - y) * 2.2)
      touchY = y
    }
    const onTouchEnd = () => (touchY = null)
    const onKey = (e) => {
      if (modeRef.current === 'page' || e.target.closest?.('input, textarea, [role=dialog]')) return
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0
      if (!dir) return
      e.preventDefault()
      setPlaying(false)
      const cur = Math.round(target.current / STEP)
      if (dir > 0 && cur === LAST) enterPage()
      else goTo(cur + dir)
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
      clearTimeout(snapTimer.current)
      document.documentElement.style.overflow = ''
      xp.inPage = false
    }
  }, [snap, goTo, enterPage, enterChapters])

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
    if (idx.current === LAST) goTo(0)
    else goTo(idx.current + 1)
    setPlaying(true)
  }, [playing, goTo])

  return { index, mode, playing, goTo, play, enterPage, enterChapters, setPlaying }
}
