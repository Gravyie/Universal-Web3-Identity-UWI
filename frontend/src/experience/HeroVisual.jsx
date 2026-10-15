import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { HoloCard } from '../components/holo/HoloCard'
import { useLiveStats } from '../hooks/useLiveStats'
import { HERO_CARD } from './heroCard'

const ease = [0.16, 1, 0.3, 1]

// Calls an app makes against the registry. Every one resolves the same way.
const CALLS = [
  ['isVerifiedHuman', '0x7a3F…4F61', 'true', 11],
  ['humanOf', '@you', '0x7a3F…4F61', 9],
  ['isVerifiedHumanStrict', '0x7a3F…4F61', 'true', 14],
  ['joinGate', 'season-2', 'joined · 1 of 1', 12],
]

/** A single contract call, typed out and answered, under the card. */
function LiveCall() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % CALLS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const [fn, arg, out, ms] = CALLS[i]
  return (
    <div className="flex h-6 items-center justify-center font-mono text-[12px] text-white/45 sm:text-[13px]">
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45, ease }} className="whitespace-nowrap">
          <span className="text-white/75">uwi.{fn}</span>({arg})
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.3 }}>
            {' → '}
            <span className="text-[#7fe3ff]">{out}</span>
            <span className="ml-2 text-white/30">{ms}ms</span>
          </motion.span>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

/**
 * The hero's subject: one verified credential rising out of the swarm of
 * wallets, lit from behind, tilting under the pointer.
 */
export function HeroCard() {
  return (
    <div className="relative w-[min(78vw,440px)] lg:w-[min(32vw,480px)]">
      {/* backlight: the only lit thing in a cold swarm */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5, ease }}
        className="absolute -inset-[30%] rounded-full bg-[radial-gradient(closest-side,rgb(127_227_255/0.28),rgb(155_123_255/0.16)_50%,transparent)] blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 120, scale: 0.55, rotateX: 55, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.8, delay: 0.35, ease }}
        className="[perspective:1400px]"
      >
        <motion.div animate={{ y: [0, -12, 0], rotate: [-3, -1.5, -3] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="relative">
          <HoloCard {...HERO_CARD} label="Your UWI credential. Move your pointer over it." />
          {/* a verification sweep once the card lands, then every few seconds */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
            <motion.div
              initial={{ y: '-120%' }}
              animate={{ y: ['-120%', '220%'] }}
              transition={{ duration: 1.4, delay: 2, repeat: Infinity, repeatDelay: 5.2, ease: [0.65, 0, 0.35, 1] }}
              className="h-1/2 w-full bg-gradient-to-b from-transparent via-white/45 to-transparent mix-blend-overlay"
            />
          </div>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 0.8 }} className="mt-7">
        <LiveCall />
      </motion.div>
    </div>
  )
}

/** Live numbers from the registry. */
export function HeroProof({ className = '' }) {
  const { humans, gates } = useLiveStats()
  const items = [
    [humans, 'verified humans'],
    [gates, 'sybil-proof gates'],
    [0, 'gas paid by people', '$'],
  ]
  return (
    <ul className={`flex items-end gap-7 ${className}`}>
      {items.map(([v, label, prefix]) => (
        <li key={label}>
          <p className="text-2xl font-semibold tracking-[-0.04em] text-white tabular-nums sm:text-[28px]">
            {v === undefined ? <span className="inline-block h-7 w-8 animate-pulse rounded-md bg-white/10 align-middle" /> : <NumberFlow value={Number(v)} prefix={prefix} />}
          </p>
          <p className="mt-1 text-xs text-white/45">{label}</p>
        </li>
      ))}
    </ul>
  )
}
