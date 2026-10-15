import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { SealCheck, User, Wallet, WarningOctagon } from '@phosphor-icons/react'

const MODES = [
  { id: 'without', icon: WarningOctagon, title: 'Without UWI', body: 'One person, nine wallets, nine claims.' },
  { id: 'with', icon: SealCheck, title: 'With UWI', body: 'One person, one credential, one claim.' },
]

const W = 640
const H = 340
const PERSON = { x: 90, y: H / 2 }

/**
 * Two big buttons at the top switch the story. Without UWI every wallet is a
 * live claim; with UWI eight of them fall away and one is sealed to a credential.
 */
export function SybilCompare() {
  const [mode, setMode] = useState('without')
  const withUwi = mode === 'with'
  const wallets = Array.from({ length: 9 }, (_, i) => {
    const a = ((-56 + i * 14) * Math.PI) / 180
    return { x: PERSON.x + Math.cos(a) * 420, y: PERSON.y + Math.sin(a) * 160 }
  })
  const KEEP = 4

  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Compare">
        {MODES.map(({ id, icon: Icon, title, body }) => {
          const active = mode === id
          const danger = id === 'without'
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(id)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-[20px] border p-3.5 text-left sm:gap-4 sm:p-5 transition-[border-color,box-shadow,transform] duration-300 active:scale-[0.99] ${
                active
                  ? danger
                    ? 'border-danger/50 shadow-[0_0_0_4px_color-mix(in_oklab,var(--danger)_14%,transparent)]'
                    : 'border-accent/60 shadow-[0_0_0_4px_var(--accent-soft)]'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sybil-active"
                  className={`absolute inset-0 -z-0 ${danger ? 'bg-danger/[0.06]' : 'bg-accent-soft'}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}
              <span
                className={`relative grid size-9 shrink-0 sm:size-11 place-items-center rounded-full transition-colors ${
                  active ? (danger ? 'bg-danger text-white' : 'bg-accent text-on-accent') : 'bg-surface-2 text-ink-2'
                }`}
              >
                <Icon weight="fill" className="size-5" />
              </span>
              <span className="relative">
                <span className="block font-semibold tracking-[-0.02em] text-ink">{title}</span>
                <span className="hidden text-sm text-ink-2 sm:block">{body}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid items-center gap-6 overflow-hidden rounded-[20px] border border-line bg-surface p-4 sm:p-8 lg:grid-cols-[1fr_220px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[380px] overflow-visible" role="img" aria-label={withUwi ? 'One person, one verified wallet' : 'One person controlling nine wallets'}>
          {wallets.map((w, i) => {
            const kept = i === KEEP
            const live = !withUwi || kept
            const tone = withUwi ? 'var(--accent)' : 'var(--danger)'
            return (
              <g key={i}>
                <motion.path
                  d={`M${PERSON.x} ${PERSON.y} C ${PERSON.x + 160} ${PERSON.y}, ${w.x - 160} ${w.y}, ${w.x - 22} ${w.y}`}
                  fill="none"
                  stroke={live ? tone : 'var(--line-strong)'}
                  strokeWidth={live ? 1.6 : 1}
                  strokeDasharray={live ? '0' : '3 6'}
                  initial={false}
                  animate={{ opacity: live ? 1 : 0.35, pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {live && (
                  <circle r="3" fill={tone} opacity="0.9">
                    <animateMotion
                      dur="1.8s"
                      begin={`${i * 0.15}s`}
                      repeatCount="indefinite"
                      path={`M${PERSON.x} ${PERSON.y} C ${PERSON.x + 160} ${PERSON.y}, ${w.x - 160} ${w.y}, ${w.x - 22} ${w.y}`}
                    />
                  </circle>
                )}
                <motion.g
                  initial={false}
                  animate={withUwi && !kept ? { y: 60, opacity: 0.18, rotate: (i - KEEP) * 6 } : { y: 0, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 16, delay: withUwi ? Math.abs(i - KEEP) * 0.03 : 0 }}
                  style={{ transformOrigin: `${w.x}px ${w.y}px` }}
                >
                  <rect
                    x={w.x - 22}
                    y={w.y - 15}
                    width="44"
                    height="30"
                    rx="9"
                    fill="var(--surface)"
                    stroke={live ? tone : 'var(--line-strong)'}
                    strokeWidth="1.4"
                  />
                  <foreignObject x={w.x - 9} y={w.y - 9} width="18" height="18">
                    {kept && withUwi ? (
                      <SealCheck weight="fill" className="size-[18px] text-accent" />
                    ) : (
                      <Wallet weight="duotone" className={`size-[18px] ${live ? (withUwi ? 'text-accent' : 'text-danger') : 'text-muted'}`} />
                    )}
                  </foreignObject>
                </motion.g>
              </g>
            )
          })}
          <circle cx={PERSON.x} cy={PERSON.y} r="34" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <foreignObject x={PERSON.x - 15} y={PERSON.y - 15} width="30" height="30">
            <User weight="duotone" className="size-[30px] text-ink-2" />
          </foreignObject>
        </svg>

        <div className="flex items-baseline gap-3 border-t border-line pt-5 lg:block lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <NumberFlow value={withUwi ? 1 : 9} className="text-6xl font-semibold tracking-[-0.06em] text-ink tabular-nums" />
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-ink-2 lg:mt-2"
            >
              {withUwi ? 'claim. The other wallets carry no credential, so they get nothing.' : 'claims from a single person running a script.'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
