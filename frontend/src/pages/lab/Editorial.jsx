import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import '@fontsource-variable/archivo/wdth.css'
import { useStats } from '../../hooks/useCredential'
import { LabSwitcher } from './LabSwitcher'

const INK = '#0d0d0d'
const PAPER = '#f3f3f0'
const SIGNAL = '#ff4d00'

/**
 * Kinetic headline: every glyph's width axis responds to pointer distance,
 * so the line breathes as you move across it. Written straight to the DOM.
 */
function KineticLine({ text, className = '', base = 78 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    const spans = [...el.querySelectorAll('span')]
    let raf = 0
    let mx = -9999
    let my = -9999
    const frame = () => {
      raf = 0
      for (const s of spans) {
        const r = s.getBoundingClientRect()
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2))
        const k = Math.max(0, 1 - d / 420)
        const wdth = base + k * (125 - base)
        const wght = 640 + k * 260
        s.style.fontVariationSettings = `'wdth' ${wdth.toFixed(1)}, 'wght' ${wght.toFixed(0)}`
      }
    }
    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [base, reduce])

  return (
    <div ref={ref} className={className} aria-label={text} role="text">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: '40%' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.03, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block transition-[font-variation-settings] duration-300 ease-out"
          style={{ fontVariationSettings: `'wdth' ${base}, 'wght' 640` }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </div>
  )
}

/** Lines of the credential spec type themselves in, one after another. */
function TypedSpec({ rows }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= rows.length) return
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 900 : 260)
    return () => clearTimeout(t)
  }, [shown, rows.length])
  return (
    <dl className="font-mono text-[12px] leading-none">
      {rows.map(([k, v], i) => (
        <div key={k} className="grid grid-cols-[1fr_auto] gap-4 border-t py-3" style={{ borderColor: INK }}>
          <dt className="tracking-[0.08em] uppercase opacity-55">{k}</dt>
          <dd className="text-right tracking-[0.04em] uppercase">
            {i < shown ? v : <span className="inline-block h-3 w-16" style={{ background: i === shown ? SIGNAL : 'transparent' }} />}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function Editorial() {
  const { humans, gates } = useStats()
  const mrz = 'P<UWI<ADA<LOVELACE<<<<<<<<<<<<<<<<<<<<<<<<0000042<HBR<SBT<<<<<<<<<<<ZK<SELF<<<<<<<<<<'

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ background: PAPER, color: INK, fontFamily: "'Archivo Variable', sans-serif" }}>
      {/* structural 12-column grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto grid max-w-[1440px] grid-cols-4 px-5 md:grid-cols-12">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`border-l ${i >= 4 ? 'hidden md:block' : ''}`} style={{ borderColor: 'rgb(13 13 13 / 0.08)' }} />
        ))}
      </div>

      <header className="relative mx-auto flex max-w-[1440px] items-stretch justify-between border-b px-5" style={{ borderColor: INK }}>
        <span className="py-4 text-xl font-extrabold tracking-[-0.03em]" style={{ fontVariationSettings: "'wdth' 110" }}>
          UWI/
        </span>
        <nav className="hidden items-center gap-10 font-mono text-[12px] tracking-[0.1em] uppercase md:flex">
          <span>Index</span>
          <span>Gates</span>
          <span>Docs</span>
        </nav>
        <Link to="/app" className="-mr-5 flex items-center gap-3 px-6 font-mono text-[12px] tracking-[0.1em] text-[#f3f3f0] uppercase" style={{ background: INK }}>
          Launch <span aria-hidden="true">→</span>
        </Link>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-5">
        <section className="grid grid-cols-4 gap-x-5 pt-10 md:grid-cols-12 md:pt-14">
          <div className="col-span-4 md:col-span-12">
            <KineticLine text="ONE HUMAN." className="text-[clamp(2.6rem,13.2vw,15.5rem)] leading-[0.82] tracking-[-0.03em] whitespace-nowrap" />
            <KineticLine text="EVERY APP." className="text-[clamp(2.6rem,13.2vw,15.5rem)] leading-[0.82] tracking-[-0.03em] whitespace-nowrap" base={70} />
          </div>

          <div className="col-span-4 mt-12 md:col-span-5 md:mt-16">
            <p className="max-w-md text-[19px] leading-[1.35] font-medium" style={{ fontVariationSettings: "'wdth' 92" }}>
              Prove you're a unique person once, with a zero-knowledge passport check. Carry a soulbound credential any app can read. Show
              nothing else.
            </p>
            <Link
              to="/start"
              className="group mt-8 inline-flex items-center gap-6 px-6 py-4 font-mono text-[13px] tracking-[0.12em] text-[#f3f3f0] uppercase transition-colors"
              style={{ background: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = SIGNAL)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              Get verified <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="col-span-4 mt-12 md:col-span-4 md:col-start-9 md:mt-16">
            <div className="flex items-center justify-between font-mono text-[12px] tracking-[0.08em] uppercase">
              <span>Credential spec</span>
              <span className="inline-block size-3" style={{ background: SIGNAL }} />
            </div>
            <div className="mt-3 border-b" style={{ borderColor: INK }}>
              <TypedSpec
                rows={[
                  ['Holder', '@ada_lovelace'],
                  ['Type', 'Soulbound token'],
                  ['Proof', 'ZK passport (Self)'],
                  ['Network', 'Hedera 296'],
                  ['Personal data stored', '0 bytes'],
                ]}
              />
            </div>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-2 border-t md:mt-24 md:grid-cols-4" style={{ borderColor: INK }}>
          {[
            [humans !== undefined ? String(humans) : '...', 'Humans verified'],
            [gates !== undefined ? String(gates) : '...', 'Gates open'],
            ['0', 'Documents stored'],
            ['0', 'HBAR gas paid by you'],
          ].map(([n, l], i) => (
            <div key={l} className={`py-6 pr-5 ${i > 0 ? 'md:border-l md:pl-5' : ''} ${i % 2 ? 'border-l pl-5 md:border-l' : ''}`} style={{ borderColor: INK }}>
              <div className="text-[clamp(3rem,7vw,6.5rem)] leading-none font-extrabold tracking-[-0.04em]" style={{ fontVariationSettings: "'wdth' 62" }}>
                {n}
              </div>
              <div className="mt-2 font-mono text-[11px] tracking-[0.1em] uppercase opacity-60">{l}</div>
            </div>
          ))}
        </section>
      </main>

      {/* MRZ band */}
      <div className="relative mt-4 overflow-hidden border-y py-3 font-mono text-[clamp(14px,1.6vw,22px)] tracking-[0.3em] whitespace-nowrap" style={{ borderColor: INK, background: INK, color: PAPER }}>
        <motion.div className="inline-block" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
          {mrz}
          {mrz}
        </motion.div>
      </div>
      <div className="h-24" />
      <LabSwitcher tone="paper" />
    </div>
  )
}
