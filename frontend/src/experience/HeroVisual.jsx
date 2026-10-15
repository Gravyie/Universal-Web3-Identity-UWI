import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { CheckCircle, Coins, GameController, Gavel, ListChecks, Sparkle, UsersThree } from '@phosphor-icons/react'
import { HoloCard } from '../components/holo/HoloCard'
import { useLiveStats } from '../hooks/useLiveStats'

const ease = [0.16, 1, 0.3, 1]

// Apps asking the one question UWI answers. Each check resolves against the same card.
const CHECKS = [
  { app: 'Season 2 airdrop', icon: Coins, ask: 'Unique human?', ms: 11 },
  { app: 'Treasury vote', icon: Gavel, ask: 'One person, one vote?', ms: 9 },
  { app: 'Arena ranked', icon: GameController, ask: 'Not a bot?', ms: 14 },
  { app: 'Mint waitlist', icon: ListChecks, ask: 'First entry?', ms: 8 },
  { app: 'Builder guild', icon: UsersThree, ask: 'Verified member?', ms: 12 },
  { app: 'Quest board', icon: Sparkle, ask: 'Real player?', ms: 10 },
]
// Where toasts sit around the card (percent of the visual's box).
// Above the card on the left and below it on the right, clear of the card's details.
const SLOTS = [
  { left: '-4%', top: '0%' },
  { right: '-6%', bottom: '0%' },
]

function Check({ c }) {
  const Icon = c.icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0d14]/70 py-2.5 pr-4 pl-2.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl">
      <span className="grid size-9 place-items-center rounded-xl bg-white/[0.07] text-white/85">
        <Icon className="size-[18px]" weight="duotone" />
      </span>
      <div className="leading-tight">
        <p className="text-[13px] font-medium text-white">{c.app}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/55">
          {c.ask}
          <CheckCircle weight="fill" className="ml-1 size-3.5 text-[#7fe3ff]" />
          <span className="text-[#7fe3ff]">Yes</span>
          <span className="ml-1 tabular-nums text-white/35">{c.ms} ms</span>
        </p>
      </div>
    </div>
  )
}

/** The hero's right side: the credential itself, being checked by app after app. */
export function HeroVisual() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setN((v) => v + 1), 2400)
    return () => clearInterval(t)
  }, [])
  const shown = [0, 1].map((k) => ({ slot: (n + k) % 2, c: CHECKS[(n + k) % CHECKS.length], key: n + k }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 1.4, delay: 0.35, ease }}
      className="relative mx-auto w-full max-w-[520px] [perspective:1200px]"
    >
      {/* a soft pool of light under the card */}
      <div aria-hidden="true" className="absolute inset-x-[8%] top-[18%] bottom-[8%] rounded-full bg-[radial-gradient(closest-side,rgb(127_227_255/0.22),rgb(155_123_255/0.12)_55%,transparent)] blur-2xl" />
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative px-[9%] py-[16%]">
        <HoloCard
          username="you"
          address="0x7a3F1c9E0b5D2A8e4C6f1B3d9E7a2C5b8D0e4F61"
          tokenId={1}
          issuedAt={Date.now()}
          proof="self"
          label="Example UWI credential. Move your pointer over it."
        />
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
        <AnimatePresence>
          {shown.map(({ slot, c, key }) => (
            <motion.div
              key={key}
              className="absolute"
              style={SLOTS[slot]}
              initial={{ opacity: 0, y: 14, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, scale: 0.97, filter: 'blur(6px)', transition: { duration: 0.4 } }}
              transition={{ duration: 0.7, ease }}
            >
              <Check c={c} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/** Live numbers from the registry, under the hero CTAs. */
export function HeroProof() {
  const { humans, gates } = useLiveStats()
  const ready = humans !== undefined
  return (
    <motion.ul
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.75, ease }}
      className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/55"
    >
      <li className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative size-2 rounded-full bg-emerald-400" />
        </span>
        Live on Hedera
      </li>
      <li className="flex items-baseline gap-1.5">
        <span className="font-medium text-white tabular-nums">{ready ? <NumberFlow value={Number(humans)} /> : '—'}</span>
        <span>verified humans</span>
      </li>
      <li className="flex items-baseline gap-1.5">
        <span className="font-medium text-white tabular-nums">{ready ? <NumberFlow value={Number(gates ?? 0)} /> : '—'}</span>
        <span>gates</span>
      </li>
      <li className="flex items-baseline gap-1.5">
        <span className="font-medium text-white">$0</span>
        <span>gas for people</span>
      </li>
    </motion.ul>
  )
}
