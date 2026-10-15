import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { LogoMark } from '../components/Logo'
import { loading } from './loading'

const ease = [0.76, 0, 0.24, 1]
const STALL_MS = 12000

/**
 * Covers the landing until the experience can play without a hitch: type
 * loaded, scene code loaded, WebGL up, every shader compiled and the first
 * frames smooth (see loading.js). The number follows those real milestones;
 * it only eases between them so it never jumps. If the 3D scene can't run it
 * lifts straight away onto the static version, and if loading stalls it says
 * so and lets the visitor carry on.
 */
export function Preloader({ onDone }) {
  const state = useSyncExternalStore(loading.subscribe, loading.get)
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(true)
  const [n, setN] = useState(0)
  const [stalled, setStalled] = useState(false)
  const shownValue = useRef(0)

  // ease the readout toward real progress
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const goal = state.progress * 100
      shownValue.current += (goal - shownValue.current) * (reduce ? 1 : 0.12)
      if (goal - shownValue.current < 0.4) shownValue.current = goal
      setN(Math.round(shownValue.current))
      if (state.ready && shownValue.current >= 100) {
        setShown(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, reduce])

  // no new milestone for a while: say so, and let the visitor in anyway
  useEffect(() => {
    setStalled(false)
    if (state.ready) return
    const t = setTimeout(() => setStalled(true), STALL_MS)
    return () => clearTimeout(t)
  }, [state])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {shown && (
        <motion.div
          key="preloader"
          exit={reduce ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: reduce ? 0.3 : 1.1, ease }}
          style={{ clipPath: 'inset(0 0 0% 0)' }}
          className="fixed inset-0 z-[70] grid place-items-center bg-[#020306] text-white"
        >
          <div className="flex flex-col items-center gap-6">
            <LogoMark className="size-7 text-white/80 motion-safe:animate-[spin_6s_linear_infinite]" />
            <div
              className="h-px w-40 overflow-hidden bg-white/10"
              role="progressbar"
              aria-label="Loading the experience"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={n}
            >
              <div className="h-full bg-gradient-to-r from-[#7fe3ff] via-[#b9a6ff] to-[#ff9ad5]" style={{ width: `${n}%` }} />
            </div>
            <p aria-live="polite" className="h-4 font-mono text-[11px] tracking-[0.18em] text-white/45 uppercase">
              {state.label}
            </p>
            {stalled && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="max-w-xs text-sm text-white/60">This is taking longer than usual. Your connection or graphics card may be slow.</p>
                <button
                  type="button"
                  onClick={() => setShown(false)}
                  className="h-10 rounded-full border border-white/20 bg-white/5 px-5 text-sm text-white hover:bg-white/10"
                >
                  Continue anyway
                </button>
              </div>
            )}
          </div>
          <p className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-8 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase max-sm:hidden">
            Universal Web3 Identity
          </p>
          <p
            aria-hidden="true"
            className="absolute right-[max(2rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] font-mono text-[clamp(3rem,8vw,6rem)] leading-none font-light tracking-[-0.04em] text-white/90 tabular-nums"
          >
            {String(n).padStart(3, '0')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
