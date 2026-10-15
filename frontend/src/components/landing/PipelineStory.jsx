import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { AppWindow, Cube, DeviceMobile, ShieldCheck } from '@phosphor-icons/react'
import { SystemPipeline } from '../Diagrams'

const STEPS = [
  {
    icon: DeviceMobile,
    title: 'Your phone reads your passport',
    body: 'Self taps the NFC chip and builds a zero-knowledge proof on the device. The document never leaves your hand.',
    packet: 'passport chip',
    data: { value: 18, unit: 'passport fields', note: 'read, but kept on your phone' },
  },
  {
    icon: ShieldCheck,
    title: 'The attestor checks the proof',
    body: 'UWI verifies the proof with Self and confirms this human has never registered. It sees a proof, not a person.',
    packet: 'zero-knowledge proof',
    data: { value: 2, unit: 'facts', note: 'over 18, and never registered' },
  },
  {
    icon: Cube,
    title: 'Hedera records one credential',
    body: 'A soulbound token bound to a nullifier hash. One per human, forever, and the relayer pays the gas.',
    packet: 'nullifier hash',
    data: { value: 32, unit: 'bytes', note: 'a hash nobody can reverse' },
  },
  {
    icon: AppWindow,
    title: 'Every app gets a yes or no',
    body: 'A contract call, a REST request or a Gate. The only thing that crosses this line is a single boolean.',
    packet: 'true',
    data: { value: 1, unit: 'bit', note: 'yes, a unique human' },
  },
]

/**
 * "How it works" as a pinned scroll sequence: one tall section, a sticky
 * stage, and a packet that travels the pipeline while the copy changes.
 * Below md it degrades to the static four-card pipeline.
 */
export function PipelineStory() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28 })
  const [active, setActive] = useState(0)
  // Four discrete updates over the whole scroll; the continuous motion stays in motion values.
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length * 0.999))))
  const packetTop = useTransform(progress, [0.04, 0.96], ['0%', '100%'])
  const fill = useTransform(progress, [0.04, 0.96], [0, 1])

  const step = STEPS[active]

  return (
    <>
      <div className="md:hidden">
        <SystemPipeline />
      </div>

      <div ref={ref} className="relative hidden h-[300vh] md:block">
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="grid w-full grid-cols-[1.1fr_1fr] items-center gap-16">
            <div>
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1 w-10 rounded-full transition-colors duration-500 ${i <= active ? 'bg-accent' : 'bg-line-strong'}`} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8"
                  aria-live="polite"
                >
                  <step.icon weight="duotone" className="size-8 text-accent" />
                  <h3 className="mt-5 text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-ink">{step.title}</h3>
                  <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-2">{step.body}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 inline-flex items-end gap-5 rounded-[20px] border border-line bg-surface px-6 py-5">
                <div>
                  <p className="text-xs text-muted">Crossing this hop</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <NumberFlow value={step.data.value} className="text-5xl font-semibold tracking-[-0.05em] text-ink tabular-nums" />
                    <span className="text-lg font-medium text-ink-2">{step.data.unit}</span>
                  </p>
                </div>
                <p className="max-w-[11rem] pb-2 text-sm text-muted">{step.data.note}</p>
              </div>
            </div>

            <div className="relative mx-auto h-[min(68dvh,560px)] w-full max-w-sm">
              {/* track */}
              <div className="absolute top-0 bottom-0 left-7 w-px bg-line-strong" />
              <motion.div style={{ scaleY: fill }} className="absolute top-0 bottom-0 left-7 w-px origin-top bg-accent" />

              {STEPS.map((s, i) => {
                const lit = i <= active
                return (
                  <div key={s.title} className="absolute left-0 flex -translate-y-1/2 items-center gap-4" style={{ top: `${(i / (STEPS.length - 1)) * 100}%` }}>
                    <motion.span
                      animate={{ scale: i === active ? 1.08 : 1 }}
                      className={`grid size-14 place-items-center rounded-full border transition-colors duration-500 ${lit ? 'border-accent bg-accent text-on-accent shadow-[0_0_40px_-6px_var(--accent)]' : 'border-line-strong bg-surface text-muted'}`}
                    >
                      <s.icon weight={lit ? 'fill' : 'regular'} className="size-6" />
                    </motion.span>
                    <span className={`text-sm font-medium transition-colors duration-500 ${lit ? 'text-ink' : 'text-muted'}`}>{s.title.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                )
              })}

              {/* the packet */}
              <motion.div style={{ top: packetTop }} className="absolute left-7 z-10 -translate-y-1/2 translate-x-10">
                <div className="ml-28 flex items-center gap-2 rounded-full border border-line-strong bg-bg-elev/90 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-ink shadow-card backdrop-blur">
                  <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                  <AnimatePresence mode="wait">
                    <motion.span key={step.packet} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                      {step.packet}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
