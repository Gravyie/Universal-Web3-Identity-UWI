import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LogoMark } from '../components/Logo'

const ease = [0.76, 0, 0.24, 1]

/**
 * Covers the page while the 3D scene loads and compiles, counting up as it
 * goes, then lifts away. It waits for the scene's first frame (the
 * `uwi:ready` event) and gives up after a few seconds so it can never trap
 * anyone.
 */
export function Preloader({ onDone }) {
  const [shown, setShown] = useState(true)
  const [n, setN] = useState(0)
  const ready = useRef(false)

  useEffect(() => {
    const onReady = () => (ready.current = true)
    window.addEventListener('uwi:ready', onReady)
    const giveUp = setTimeout(onReady, 6000)
    const start = performance.now()
    let raf = 0
    let value = 0
    const tick = (now) => {
      // ease toward 90 while loading; run to 100 once the scene is up
      const goal = ready.current ? 100 : Math.min(90, ((now - start) / 2600) * 90)
      value += (goal - value) * (ready.current ? 0.14 : 0.08)
      if (ready.current && value > 99.5) value = 100
      setN(Math.round(value))
      if (value >= 100) {
        setTimeout(() => setShown(false), 250)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(giveUp)
      window.removeEventListener('uwi:ready', onReady)
    }
  }, [])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {shown && (
        <motion.div
          key="preloader"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 1.1, ease }}
          style={{ clipPath: 'inset(0 0 0% 0)' }}
          className="fixed inset-0 z-[70] grid place-items-center bg-[#020306] text-white"
          role="status"
          aria-label={`Loading, ${n}%`}
        >
          <div className="flex flex-col items-center gap-6">
            <LogoMark className="size-7 animate-[spin_6s_linear_infinite] text-white/80" />
            <div className="h-px w-40 overflow-hidden bg-white/10">
              <div className="h-full bg-gradient-to-r from-[#7fe3ff] via-[#b9a6ff] to-[#ff9ad5]" style={{ width: `${n}%` }} />
            </div>
          </div>
          <p className="absolute bottom-8 left-8 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">Universal Web3 Identity</p>
          <p className="absolute right-8 bottom-6 font-mono text-[clamp(3rem,8vw,6rem)] leading-none font-light tracking-[-0.04em] text-white/90 tabular-nums">
            {String(n).padStart(3, '0')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
