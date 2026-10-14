import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AppWindow, Cube, DeviceMobile, ShieldCheck, User } from '@phosphor-icons/react'
import { easeOutExpo } from '../lib/motion'

/* ── Sybil: one person, many wallets ─────────────────────────────────── */

export function SybilDiagram() {
  const [withUwi, setWithUwi] = useState(false)
  const wallets = Array.from({ length: 9 }, (_, i) => {
    const a = ((-64 + i * 16) * Math.PI) / 180
    return { x: 120 + Math.cos(a) * 190, y: 150 + Math.sin(a) * 120 }
  })

  return (
    <div>
      <div className="inline-flex rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Compare">
        {[
          [false, 'Without UWI'],
          [true, 'With UWI'],
        ].map(([v, label]) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={withUwi === v}
            onClick={() => setWithUwi(v)}
            className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${withUwi === v ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            {withUwi === v && <motion.span layoutId="sybil-toggle" className="absolute inset-0 rounded-full bg-surface shadow-sm" />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
        <svg viewBox="0 0 340 300" className="w-full max-w-[520px]" role="img" aria-label={withUwi ? 'One person with one verified wallet' : 'One person controlling nine wallets'}>
          {wallets.map((w, i) => {
            const live = !withUwi || i === 4
            return (
              <g key={i}>
                <motion.line
                  x1="44"
                  y1="150"
                  x2={w.x}
                  y2={w.y}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className={live ? (withUwi ? 'text-accent' : 'text-danger') : 'text-line-strong'}
                  strokeDasharray={live ? undefined : '3 5'}
                  animate={{ opacity: live ? 1 : 0.6 }}
                  initial={false}
                />
                <motion.rect
                  x={w.x - 13}
                  y={w.y - 10}
                  width="26"
                  height="20"
                  rx="6"
                  strokeWidth="1.2"
                  initial={false}
                  animate={{ scale: live ? 1 : 0.8, opacity: live ? 1 : 0.45 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.02 }}
                  className={live ? (withUwi ? 'fill-accent-soft stroke-accent' : 'fill-danger/10 stroke-danger') : 'fill-surface-2 stroke-line-strong'}
                  style={{ transformOrigin: `${w.x}px ${w.y}px` }}
                />
              </g>
            )
          })}
          <circle cx="44" cy="150" r="22" className="fill-surface stroke-line-strong" strokeWidth="1.2" />
          <foreignObject x="30" y="136" width="28" height="28">
            <User className="size-7 text-ink-2" weight="duotone" />
          </foreignObject>
        </svg>

        <motion.div key={String(withUwi)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOutExpo }}>
          <div className="text-5xl font-semibold tracking-[-0.05em] text-ink tabular-nums">{withUwi ? '1' : '9'}</div>
          <p className="mt-2 text-ink-2">{withUwi ? 'claim, vote or reward. The other eight wallets have no credential, so they get nothing.' : 'airdrop claims, votes and rewards, all from one person running a script.'}</p>
        </motion.div>
      </div>
    </div>
  )
}

/* ── System: what crosses each boundary ──────────────────────────────── */

const NODES = [
  { icon: DeviceMobile, title: 'Your phone', body: 'Self reads your passport chip and builds a zero-knowledge proof locally.' },
  { icon: ShieldCheck, title: 'UWI attestor', body: 'Checks the proof against Self, then checks this human is new.' },
  { icon: Cube, title: 'Registry on Hedera', body: 'Holds one soulbound credential per human. Gas paid by the relayer.' },
  { icon: AppWindow, title: 'Any app', body: 'Asks one question through a contract call, the REST API or a Gate.' },
]
const EDGES = ['proof only', 'nullifier hash', 'yes or no']

export function SystemPipeline() {
  const reduce = useReducedMotion()
  return (
    <ol className="relative grid gap-3 md:grid-cols-4 md:gap-0">
      {NODES.map((n, i) => (
        <li key={n.title} className="relative md:pr-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: easeOutExpo }}
            className="relative z-10 h-full rounded-[20px] border border-line bg-surface p-5"
          >
            <n.icon className="size-5 text-accent" weight="duotone" />
            <h3 className="mt-4 font-medium text-ink">{n.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{n.body}</p>
          </motion.div>

          {i < EDGES.length && (
            <>
              {/* Desktop connector with a packet travelling along it */}
              <div className="absolute top-1/2 right-0 hidden h-px w-8 bg-line-strong md:block">
                {!reduce && (
                  <motion.span
                    className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-accent"
                    animate={{ x: [0, 26], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
              <div className="absolute top-full right-0 left-0 hidden justify-end pt-3 md:flex md:pr-0">
                <span className="translate-x-1/2 rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-muted">
                  {EDGES[i]}
                </span>
              </div>
              {/* Mobile: vertical label between cards */}
              <div className="flex items-center gap-2 py-1 pl-6 md:hidden">
                <span className="h-5 w-px bg-line-strong" />
                <span className="font-mono text-[11px] text-muted">{EDGES[i]}</span>
              </div>
            </>
          )}
        </li>
      ))}
    </ol>
  )
}
