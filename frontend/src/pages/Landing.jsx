import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Accordion from '@radix-ui/react-accordion'
import { motion, useReducedMotion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { ArrowRight, ArrowUp, ArrowUpRight, Code, DeviceMobile, Door, Fingerprint, GasPump, Plus, ShieldCheck, Wallet } from '@phosphor-icons/react'
import { xp } from '../experience/store'
import { useChapters } from '../experience/useChapters'
import { Overlay } from '../experience/Overlay'
import { Preloader } from '../experience/Preloader'
import { score } from '../experience/score'
import { HoloCard } from '../components/holo/HoloCard'
import { HERO_CARD } from '../experience/heroCard'
import { LogoMark, Wordmark } from '../components/Logo'
import { useLiveStats } from '../hooks/useLiveStats'
import { Web3 } from '../web3/Web3'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { GATES_ADDRESS, REGISTRY_ADDRESS, explorer } from '../config/addresses'

// Start fetching the 3D scene as soon as this module loads, in parallel with first paint.
const stageImport = import('../experience/scene/Stage')
const Stage = lazy(() => stageImport)
const LiveTerminal = lazy(() => import('../components/landing/LiveTerminal').then((m) => ({ default: m.LiveTerminal })))
const ease = [0.16, 1, 0.3, 1]
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease },
}
const glass = 'rounded-[24px] border border-white/10 bg-white/[0.045] backdrop-blur-2xl shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'

/**
 * The landing page: a nine-chapter 3D experience, then the rest of the site
 * scrolling over the same world. The scene keeps rendering behind the page,
 * dimmed, so the static sections live in the same place as the story.
 */
export default function Landing() {
  const reduce = useReducedMotion()
  const mobile = useMediaQuery('(max-width: 767px)')
  xp.reduced = Boolean(reduce)
  xp.mobile = mobile
  const chapters = useChapters()
  const [revealed, setRevealed] = useState(xp.revealed)
  const reveal = () => {
    xp.revealed = true
    setRevealed(true)
  }

  useEffect(() => {
    const onMove = (e) => {
      xp.pointer = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      // the score belongs to the story: leaving the landing silences it
      score.stop()
    }
  }, [])

  useEffect(() => score.duck(chapters.mode === 'page'), [chapters.mode])

  // The page scrolls natively over the story. As it does, the story's text
  // fades and the scene dims; once it is fully covered the scene stops drawing.
  const root = useRef(null)
  const [faded, setFaded] = useState(false)
  const [covered, setCovered] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const h = window.innerHeight
      xp.storyFade = Math.min(1, y / (h * 0.5))
      root.current?.style.setProperty('--story-fade', String(xp.storyFade))
      root.current?.style.setProperty('--story-dim', String(Math.min(1, y / h)))
      setFaded(y > h * 0.25)
      setCovered(y > h * 1.05)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={root} data-theme="dark" className="relative min-h-dvh overflow-x-clip bg-[#020306] text-white">
      <Suspense fallback={<div className="fixed inset-0 bg-[#020306]" />}>
        <Stage paused={chapters.mode === 'page' && covered} />
      </Suspense>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 bg-[#05040c]"
        style={{ opacity: 'calc(var(--story-dim, 0) * 0.6)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {!revealed && <Preloader onDone={reveal} />}
      <Overlay chapters={chapters} revealed={revealed} faded={faded} />

      {/* The experience occupies the first screen; the page follows it. */}
      <div className="h-dvh" aria-hidden="true" />
      <Page onTop={chapters.enterChapters} />
    </div>
  )
}

/* ── The page under the experience ──────────────────────────────────────── */

function Page({ onTop }) {
  return (
    <main className="relative z-20">
      <Products />
      <Stats />
      <Flow />
      <Developers />
      <Faq />
      <Footer onTop={onTop} />
    </main>
  )
}

function SectionTitle({ kicker, title, children, className = '' }) {
  return (
    <motion.div {...reveal} className={className}>
      {kicker && <p className="text-sm font-medium text-[#ffcf9e]">{kicker}</p>}
      <h2 className="mt-3 text-[clamp(2.2rem,4.6vw,4rem)] leading-[1] font-semibold tracking-[-0.05em] text-balance">{title}</h2>
      {children && <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">{children}</p>}
    </motion.div>
  )
}

function GateMeter() {
  const [n, setN] = useState(1172)
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= 5000 ? 1172 : v + Math.ceil(Math.random() * 9))), 900)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="mt-8 rounded-[18px] border border-white/10 bg-black/30 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/80">Season 2 allowlist</span>
        <span className="text-xs text-emerald-300">Open</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <NumberFlow value={n} className="text-3xl font-semibold tracking-[-0.04em] tabular-nums" />
        <span className="text-sm text-white/50">of 5,000 humans</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7fe3ff] to-[#ffcf9e]" animate={{ width: `${(n / 5000) * 100}%` }} transition={{ duration: 0.8, ease }} />
      </div>
    </div>
  )
}

function Products() {
  return (
    <section id="explore" className="mx-auto max-w-7xl scroll-mt-10 px-5 pt-24 pb-24 sm:px-8 md:pt-36">
      <SectionTitle kicker="What you get" title={<>Three ways in. <span className="text-white/45">All live on Hedera.</span></>} />
      <div className="mt-14 grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.25fr_1fr] lg:grid-rows-[auto_auto]">
        <motion.div {...reveal} className={`${glass} relative flex flex-col overflow-hidden p-7 sm:p-10 lg:row-span-2`}>
          <div aria-hidden="true" className="absolute -top-32 -right-32 size-96 rounded-full bg-[#7fe3ff]/15 blur-3xl" />
          <p className="text-sm text-white/55">The credential</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Prove it once.</h3>
          <p className="mt-3 max-w-md text-white/65">Scan your passport with Self. Get a soulbound card that holds a username and a hash, never your details.</p>
          <div className="relative mx-auto flex w-full max-w-md flex-1 items-center py-10">
            <HoloCard {...HERO_CARD} label="Example UWI credential. Move your pointer over it." className="w-full" />
          </div>
          <Link to="/app/verify" className="group inline-flex h-11 self-start items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black">
            Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className={`${glass} p-7 sm:p-8`}>
          <Door className="size-6 text-[#ffcf9e]" weight="duotone" />
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">Lists only humans can join.</h3>
          <p className="mt-2 text-white/65">Allowlists, waitlists and votes. One entry per person, from any wallet. Free to join.</p>
          <GateMeter />
          <Link to="/app/gates" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-[#ffcf9e]">
            Create a gate <ArrowRight className="size-4" />
          </Link>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.16 }} className={`${glass} p-7 sm:p-8`}>
          <Code className="size-6 text-[#7fe3ff]" weight="duotone" />
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">One call to check.</h3>
          <p className="mt-2 text-white/65">From a contract, a backend or a browser. No keys, no personal data.</p>
          <pre className="mt-6 overflow-x-auto rounded-[14px] border border-white/10 bg-black/40 px-4 py-3 font-mono text-[13px] text-white/80">
            <span className="text-[#7fe3ff]">require</span>(uwi.isVerifiedHumanStrict(msg.sender));
          </pre>
          <Link to="/app/developers" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-[#7fe3ff]">
            Read the docs <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Stats() {
  const { humans, gates } = useLiveStats()
  const items = [
    ['Verified humans', humans !== undefined ? Number(humans) : null],
    ['Gates created', gates !== undefined ? Number(gates) : null],
    ['Documents stored', 0],
    ['Gas paid by people', 0],
  ]
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8">
      <motion.dl {...reveal} className={`${glass} grid grid-cols-2 divide-white/10 md:grid-cols-4 md:divide-x`}>
        {items.map(([k, v]) => (
          <div key={k} className="px-6 py-8 sm:px-8">
            <dt className="text-sm text-white/55">{k}</dt>
            <dd className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {v === null ? <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-white/10 align-middle" /> : <NumberFlow value={v} />}
            </dd>
          </div>
        ))}
      </motion.dl>
    </section>
  )
}

const FLOW = [
  { icon: Wallet, title: 'Connect', body: 'Any wallet. You only ever sign messages.' },
  { icon: Fingerprint, title: 'Choose a name', body: 'Unique across UWI, printed on your card.' },
  { icon: DeviceMobile, title: 'Scan with Self', body: 'Your passport chip is read on your phone and turned into a proof.' },
  { icon: ShieldCheck, title: 'You are counted', body: 'A soulbound credential on Hedera. The relayer pays the gas.' },
]

function Flow() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-36">
      <SectionTitle kicker="Two minutes" title="From wallet to verified human." />
      <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
        <div aria-hidden="true" className="absolute top-6 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent md:block" />
        {FLOW.map((f, i) => (
          <motion.li key={f.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="relative flex gap-5 md:block md:text-center">
            <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-white/15 bg-[#0b0a14] md:mx-auto">
              <f.icon className="size-5 text-[#ffcf9e]" weight="duotone" />
            </span>
            <div className="md:mt-6">
              <h3 className="text-lg font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-1.5 text-white/60 md:mx-auto md:max-w-[15rem]">{f.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <motion.div {...reveal} className="mt-14 flex justify-center">
        <Link to="/app/verify" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black">
          Start now <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  )
}

function Developers() {
  const points = [
    [GasPump, 'Gasless for everyone. Users sign, the relayer submits, the contract checks the signature.'],
    [ShieldCheck, 'Strict checks accept only real Self proofs. Demo credentials never pass.'],
  ]
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-28 sm:px-8 md:pb-36 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <SectionTitle kicker="For builders" title={<>The answer, <span className="text-white/45">live.</span></>}>
          This terminal is querying the real API on Hedera testnet right now.
        </SectionTitle>
        <ul className="mt-8 grid gap-4">
          {points.map(([Icon, t]) => (
            <li key={t} className="flex gap-3 text-white/70">
              <Icon className="mt-0.5 size-5 shrink-0 text-[#7fe3ff]" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <motion.div {...reveal} className="min-w-0">
        <Web3 fallback={<div className="h-80 rounded-[20px] bg-white/[0.03]" />}>
          <LiveTerminal />
        </Web3>
      </motion.div>
    </section>
  )
}

const FAQ = [
  ['Does UWI see my passport?', "No. Self reads the chip on your phone and produces a zero-knowledge proof. UWI only learns that you're over 18 and haven't registered before."],
  ['What if I lose my wallet?', 'Verify again with Self from a new wallet. Your passport produces the same nullifier, so your credential, username and gate memberships move to the new wallet.'],
  ['Do I need crypto to use it?', 'You need a wallet, but not funds. Every action is a signed message, and the UWI relayer pays the network fees.'],
  ['What is a demo credential?', 'On testnet you can try everything without a passport. Demo credentials are marked on-chain and rejected by strict checks.'],
]

function Faq() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-28 sm:px-8 md:pb-36 lg:grid-cols-[0.8fr_1.2fr]">
      <SectionTitle title="Questions" />
      <motion.div {...reveal} className={`${glass} px-6 sm:px-8`}>
        <Accordion.Root type="single" collapsible className="divide-y divide-white/10">
          {FAQ.map(([q, a]) => (
            <Accordion.Item key={q} value={q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium">
                  {q}
                  <Plus className="size-4 shrink-0 text-white/50 transition-transform duration-300 group-data-[state=open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_250ms_cubic-bezier(0.16,1,0.3,1)]">
                <p className="max-w-xl pb-6 text-white/65">{a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </motion.div>
    </section>
  )
}

function Footer({ onTop }) {
  const cols = [
    ['Product', [['Get verified', '/app/verify'], ['Dashboard', '/app'], ['Gates', '/app/gates']]],
    ['Developers', [['Docs and API', '/app/developers'], ['Registry contract', explorer.contract(REGISTRY_ADDRESS)], ['Gates contract', explorer.contract(GATES_ADDRESS)]]],
    ['Project', [['GitHub', 'https://github.com/Gravyie/Universal-Web3-Identity-UWI'], ['Self Protocol', 'https://self.xyz'], ['Holo card by Arlan Marat', 'https://www.arlan.me/vault/holo']]],
  ]
  return (
    <footer className="border-t border-white/10 bg-[#05040c]/70 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.98] font-semibold tracking-[-0.055em]">
            One human. <span className="text-white/40">Every app.</span>
          </h2>
          <button type="button" onClick={onTop} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-white/80 hover:bg-white/10">
            <ArrowUp className="size-4" /> Back to the story
          </button>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <div className="flex items-center gap-2">
              <LogoMark className="size-5" />
              <Wordmark />
            </div>
            <p className="mt-3 text-sm text-white/50">Proof of personhood for Web3. Running on Hedera testnet, so credentials here are for testing.</p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-medium">{title}</h3>
              <ul className="mt-3 grid gap-2 text-sm">
                {links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="text-white/55 hover:text-white">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/55 hover:text-white">
                        {label} <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
