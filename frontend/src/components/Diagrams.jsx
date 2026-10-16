import { motion, useReducedMotion } from 'motion/react'
import { AppWindow, Cube, DeviceMobile, ShieldCheck } from '@phosphor-icons/react'
import { easeOutExpo } from '../lib/motion'

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
    <ol className="relative grid gap-3 lg:grid-cols-4 lg:gap-0">
      {NODES.map((n, i) => (
        <li key={n.title} className="relative min-w-0 lg:pr-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: easeOutExpo }}
            className="relative z-10 rounded-[20px] border border-line bg-surface p-5 lg:h-full"
          >
            <n.icon className="size-5 text-accent" weight="duotone" />
            <h3 className="mt-4 font-medium text-ink">{n.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{n.body}</p>
          </motion.div>

          {i < EDGES.length && (
            <>
              {/* Desktop connector with a packet travelling along it */}
              <div className="absolute top-1/2 right-0 hidden h-px w-8 bg-line-strong lg:block">
                {!reduce && (
                  <motion.span
                    className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-accent"
                    animate={{ x: [0, 26], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
              <div className="absolute top-full right-0 left-0 hidden justify-end pt-3 lg:flex lg:pr-0">
                <span className="translate-x-1/2 rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-muted">
                  {EDGES[i]}
                </span>
              </div>
              {/* Mobile: vertical label between cards */}
              <div className="flex items-center gap-2 py-1 pl-6 lg:hidden">
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
