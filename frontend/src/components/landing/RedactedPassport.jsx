import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { CheckCircle } from '@phosphor-icons/react'
import { printFor } from '../holo/print'

const FIELDS = [
  ['Surname', 'LOVELACE'],
  ['Given names', 'ADA AUGUSTA'],
  ['Nationality', 'BRITISH CITIZEN'],
  ['Date of birth', '10 DEC 1815'],
  ['Document no.', '524 718 903'],
  ['Date of expiry', '27 NOV 2032'],
]

/**
 * A passport data page that redacts itself on view, leaving only the two
 * facts UWI ever learns. An illustration of the privacy model, not real data.
 */
export function RedactedPassport() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const seen = useInView(ref, { once: true, margin: '-120px' })
  const on = seen || reduce

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px] [perspective:1400px]">
      <motion.div
        initial={{ rotateX: 18, rotateY: -14, y: 30, opacity: 0 }}
        animate={on ? { rotateX: 8, rotateY: -8, y: 0, opacity: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[20px] border border-line-strong bg-[linear-gradient(160deg,#f3f1ea,#e4e8ee)] p-6 text-zinc-800 shadow-[0_40px_80px_-30px_rgb(10_20_40/0.45)] sm:p-7"
      >
        {/* guilloche-ish wash */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 80% 20%, #6b7a99 0 1px, transparent 1px 9px)' }}
        />
        <div className="relative flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
          <span>Passport</span>
          <span>P &lt; GBR</span>
        </div>
        <div className="relative mt-5 grid grid-cols-[96px_1fr] gap-5">
          <div className="relative aspect-[0.8] overflow-hidden rounded-[10px] bg-zinc-300">
            <div className="absolute inset-0 opacity-70 grayscale" style={{ backgroundImage: printFor('ada'), backgroundSize: '130%', backgroundPosition: 'center' }} />
            <Bar on={on} delay={0.2} full />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {FIELDS.map(([k, v], i) => (
              <div key={k} className="min-w-0">
                <dt className="font-mono text-[9px] tracking-[0.12em] text-zinc-500 uppercase">{k}</dt>
                <dd className="relative mt-0.5 truncate text-[13px] font-semibold">
                  {v}
                  <Bar on={on} delay={0.35 + i * 0.12} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mt-6 font-mono text-[11px] leading-snug tracking-[0.14em] text-zinc-500">
          <div className="relative truncate">
            P&lt;GBRLOVELACE&lt;&lt;ADA&lt;AUGUSTA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            <Bar on={on} delay={1.1} />
          </div>
          <div className="relative truncate">
            5247189034GBR1512104F3211277&lt;&lt;&lt;&lt;&lt;
            <Bar on={on} delay={1.2} />
          </div>
        </div>

        {/* what survives */}
        <div className="relative mt-6 flex flex-wrap gap-2">
          {['Over 18', 'Unique human'].map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={on ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ delay: 1.55 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-600/70 px-3 py-1 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle weight="fill" className="size-4" /> {t}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function Bar({ on, delay, full }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      animate={on ? { scaleX: 1 } : {}}
      transition={{ delay, duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
      className={`absolute origin-left rounded-[3px] bg-zinc-900 ${full ? 'inset-0' : 'inset-x-0 top-[2px] bottom-[2px]'}`}
    />
  )
}
