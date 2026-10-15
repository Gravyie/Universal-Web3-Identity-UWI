import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
import { ArrowRight, Door, EyeSlash, Gift, HandWaving, Lightning, SealCheck, Sparkle } from '@phosphor-icons/react'
import '@fontsource-variable/bricolage-grotesque'
import { LabSwitcher } from './LabSwitcher'

const FONT = "'Bricolage Grotesque Variable', sans-serif"
const PLUM = '#2e2352'

const CARDS = [
  {
    id: 'id',
    bg: 'linear-gradient(145deg,#c9b8ff,#9fd0ff)',
    icon: SealCheck,
    title: '@ada_lovelace',
    sub: 'Verified human',
    meta: 'No. 000042',
  },
  {
    id: 'gate',
    bg: 'linear-gradient(145deg,#ffd0e6,#ffb59c)',
    icon: Door,
    title: 'Season 2 drop',
    sub: "You're on the list",
    meta: 'Spot 1,285 of 5,000',
  },
  {
    id: 'private',
    bg: 'linear-gradient(145deg,#bff5dc,#d9f5a6)',
    icon: EyeSlash,
    title: 'Nothing shared',
    sub: 'Passport stays on your phone',
    meta: '0 bytes stored',
  },
]

/** A sticker you can grab. Fling it far enough and it goes to the back. */
function Sticker({ card, index, onFling }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-18, 18])
  const top = index === 0
  const Icon = card.icon
  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x: top ? x : 0, rotate: top ? rotate : 0, zIndex: 10 - index }}
      initial={false}
      animate={{ scale: 1 - index * 0.05, y: index * 22, rotate: top ? undefined : (index % 2 ? 5 : -4), opacity: 1 }}
      exit={{ x: 0, scale: 0.85, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      drag={top ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.6}
      whileTap={top ? { scale: 1.03 } : undefined}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 600) onFling()
      }}
    >
      <div
        className="flex size-full flex-col justify-between rounded-[32px] border-[6px] border-white p-7 shadow-[0_30px_60px_-20px_rgb(46_35_82/0.45),inset_0_-10px_24px_rgb(46_35_82/0.12),inset_0_8px_20px_rgb(255_255_255/0.6)]"
        style={{ background: card.bg }}
      >
        <div className="flex items-center justify-between">
          <span className="grid size-14 place-items-center rounded-[20px] bg-white/70 shadow-[inset_0_-4px_8px_rgb(46_35_82/0.12)]">
            <Icon weight="fill" className="size-7" style={{ color: PLUM }} />
          </span>
          <span className="rounded-full bg-white/60 px-3 py-1 text-sm font-semibold" style={{ color: PLUM }}>
            UWI
          </span>
        </div>
        <div style={{ color: PLUM }}>
          <div className="text-[34px] leading-none font-extrabold tracking-[-0.03em]">{card.title}</div>
          <div className="mt-2 text-lg font-semibold opacity-80">{card.sub}</div>
          <div className="mt-4 text-sm font-medium opacity-60">{card.meta}</div>
        </div>
      </div>
    </motion.div>
  )
}

function Blob({ className, color, delay = 0 }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute rounded-[42%] ${className}`}
      style={{ background: `radial-gradient(circle at 30% 25%, #ffffffcc, ${color} 45%, ${color})`, boxShadow: '0 24px 40px -18px rgb(46 35 82 / 0.35), inset 0 -8px 18px rgb(46 35 82 / 0.15)' }}
      animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

export default function Tactile() {
  const [order, setOrder] = useState(CARDS.map((c) => c.id))
  const fling = () => setOrder((o) => [...o.slice(1), o[0]])
  const stack = order.map((id) => CARDS.find((c) => c.id === id))

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ fontFamily: FONT, color: PLUM, background: 'linear-gradient(160deg,#f1ecff 0%,#eaf6ff 45%,#ecfff4 100%)' }}>
      <Blob className="top-[14%] left-[46%] size-16" color="#ffc4dd" />
      <Blob className="top-[70%] left-[6%] size-24" color="#b9f0d6" delay={1} />
      <Blob className="top-[8%] right-[6%] size-20" color="#c9b8ff" delay={2} />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-2 rounded-full bg-white/70 py-2 pr-4 pl-2 text-lg font-extrabold shadow-sm backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full" style={{ background: PLUM }}>
            <Sparkle weight="fill" className="size-4 text-white" />
          </span>
          uwi
        </span>
        <nav className="hidden gap-1 rounded-full bg-white/70 p-1 text-[15px] font-semibold shadow-sm backdrop-blur md:flex">
          {['How it works', 'Gates', 'Developers'].map((l) => (
            <span key={l} className="rounded-full px-4 py-2 hover:bg-white">
              {l}
            </span>
          ))}
        </nav>
        <Link to="/app" className="rounded-full bg-white/70 px-5 py-2.5 text-[15px] font-bold shadow-sm backdrop-blur hover:bg-white">
          Open app
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-5 pt-14 pb-32 md:grid-cols-[1.1fr_1fr] md:pt-24">
        <div>
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[15px] font-bold shadow-[0_6px_0_rgb(46_35_82/0.12)]"
          >
            <HandWaving weight="fill" className="size-5 text-[#ff8a3d]" /> Hey there
          </motion.span>
          <h1 className="mt-6 text-[clamp(3rem,6.6vw,5.6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            You're a{' '}
            <span className="relative inline-block">
              real
              <svg aria-hidden="true" viewBox="0 0 200 24" className="absolute -bottom-3 left-0 w-full" preserveAspectRatio="none">
                <motion.path
                  d="M4 16 C 40 4, 70 22, 100 12 S 160 4, 196 14"
                  fill="none"
                  stroke="#ff7ab6"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.7, duration: 0.8, ease: 'easeInOut' }}
                />
              </svg>
            </span>{' '}
            human. Prove it once.
          </h1>
          <p className="mt-7 max-w-md text-xl leading-snug font-medium opacity-75">
            Scan your passport in the Self app, get a sticker-card every app recognises. Nobody ever sees your details.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <motion.div whileHover={{ y: -2 }} whileTap={{ y: 4 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
              <Link
                to="/start"
                className="inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#1b1433,0_18px_30px_-10px_rgb(46_35_82/0.5)] active:shadow-[0_2px_0_#1b1433]"
                style={{ background: PLUM }}
              >
                Get my card <ArrowRight weight="bold" className="size-5" />
              </Link>
            </motion.div>
            <span className="text-[15px] font-semibold opacity-60">Free, takes 2 minutes</span>
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.25] w-full max-w-[440px]">
          <AnimatePresence initial={false}>
            {stack.map((c, i) => (
              <Sticker key={c.id} card={c} index={i} onFling={fling} />
            ))}
          </AnimatePresence>
          <p className="absolute -bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold whitespace-nowrap opacity-80 backdrop-blur">
            Drag the top card to flip through
          </p>
        </div>
      </main>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-4 px-5 pb-32 sm:grid-cols-3">
        {[
          [Gift, 'Free forever', 'You sign, we pay the fees.', '#ffd9ea'],
          [EyeSlash, 'Private by design', 'Only "over 18" and "unique" leave your phone.', '#d9f5e8'],
          [Lightning, 'Works everywhere', 'Airdrops, votes, games, communities.', '#e3dcff'],
        ].map(([Icon, t, b, c], i) => (
          <motion.div
            key={t}
            whileHover={{ rotate: i % 2 ? 2 : -2, y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="rounded-[28px] border-4 border-white p-6 shadow-[0_20px_40px_-24px_rgb(46_35_82/0.4)]"
            style={{ background: c }}
          >
            <Icon weight="fill" className="size-8" />
            <h3 className="mt-6 text-2xl font-extrabold tracking-[-0.02em]">{t}</h3>
            <p className="mt-1 font-medium opacity-70">{b}</p>
          </motion.div>
        ))}
      </section>

      <LabSwitcher tone="soft" />
    </div>
  )
}
