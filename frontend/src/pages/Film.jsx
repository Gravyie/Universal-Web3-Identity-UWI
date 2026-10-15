import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import * as Accordion from '@radix-ui/react-accordion'
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from 'motion/react'
import { ArrowRight, ArrowUpRight, Code, Door, IdentificationCard, Plus } from '@phosphor-icons/react'
import { film, filmProgress } from '../film/store'
import { FilmOverlay } from '../film/FilmOverlay'
import { LiveTerminal } from '../components/landing/LiveTerminal'
import { useStats } from '../hooks/useCredential'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { GATES_ADDRESS, REGISTRY_ADDRESS, explorer } from '../config/chain'
import { easeOutExpo } from '../lib/motion'

const FilmCanvas = lazy(() => import('../film/scene/FilmCanvas'))

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 1, ease: easeOutExpo },
}

/**
 * The landing page is a short film. A tall scroll track is the timeline; the
 * WebGL scene and the overlay read it. After the finale, the rest of the site
 * scrolls up over the frozen frame like a credit roll.
 */
export default function Film() {
  const track = useRef(null)
  const reduce = useReducedMotion()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [rendering, setRendering] = useState(true)
  film.reduced = Boolean(reduce)
  film.mobile = mobile

  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => (film.target = v))

  // Pause the GPU when the credits cover the scene.
  useEffect(() => {
    const el = track.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setRendering(e.isIntersecting)
        // The scene stops ticking off-screen, so sync the clock for the HUD here.
        if (!e.isIntersecting) {
          film.progress = film.target
          filmProgress.set(film.target)
        }
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      film.pointer = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }
    }
    window.addEventListener('pointermove', onMove)
    film.target = 0
    film.progress = 0
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      <div data-theme="dark" data-accent="cobalt" className="relative bg-[#020306] text-white [--bar:7vh] md:[--bar:9vh]">
        <Suspense fallback={<div className="fixed inset-0 bg-[#020306]" />}>
          <FilmCanvas frameloop={rendering ? 'always' : 'never'} />
        </Suspense>
        <FilmOverlay trackRef={track} />
        {/* monochrome film grain over picture and HUD */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[35] opacity-[0.09] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />

        {/* the timeline: scroll distance is screen time */}
        <div ref={track} className="relative h-[900vh] md:h-[1100vh]" aria-label="UWI, a short film. Scroll or press play." role="region" />

        <PostCredits />
      </div>
    </ReactLenis>
  )
}

/* ── After the film ───────────────────────────────────────────────────── */

const POSTERS = [
  {
    icon: IdentificationCard,
    kicker: 'The credential',
    title: 'Prove it once.',
    body: 'Scan your passport with Self. Get a soulbound credential that holds no personal data.',
    to: '/start',
    cta: 'Get verified',
    glow: 'rgb(127 227 255 / 0.35)',
  },
  {
    icon: Door,
    kicker: 'Gates',
    title: 'Lists only humans can join.',
    body: 'Airdrop allowlists, waitlists and votes. One entry per person, gasless to join.',
    to: '/app/gates',
    cta: 'Create a gate',
    glow: 'rgb(255 107 138 / 0.3)',
  },
  {
    icon: Code,
    kicker: 'Developers',
    title: 'One call to check.',
    body: 'isVerifiedHuman() on-chain, or a single GET from any backend. No keys, no PII.',
    to: '/developers',
    cta: 'Read the docs',
    glow: 'rgb(130 153 255 / 0.35)',
  },
]

const FAQ = [
  ['Does UWI see my passport?', "No. Self reads the chip on your phone and produces a zero-knowledge proof. UWI only learns that you're over 18 and haven't registered before."],
  ['What if I lose my wallet?', 'Verify again with Self from a new wallet. Your passport produces the same nullifier, so your credential, username and gate memberships move to the new wallet.'],
  ['Do I need crypto to use it?', 'You need a wallet, but not funds. Every action is a signed message, and the UWI relayer pays the network fees.'],
  ['What is a demo credential?', 'On testnet you can try everything without a passport. Demo credentials are marked on-chain and rejected by strict checks.'],
]

function Poster({ p, i }) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }}>
      <Link
        to={p.to}
        className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] p-7 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-white/25"
      >
        <div
          aria-hidden="true"
          className="absolute -top-1/3 left-1/2 size-[140%] -translate-x-1/2 opacity-60 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${p.glow}, transparent 60%)` }}
        />
        <div className="relative flex items-center justify-between font-mono text-[11px] tracking-[0.3em] text-white/50 uppercase">
          <span>{p.kicker}</span>
          <p.icon className="size-5 text-white/70" weight="duotone" />
        </div>
        <div className="relative">
          <h3 className="text-[clamp(2rem,3vw,2.75rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-white">{p.title}</h3>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">{p.body}</p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white">
            {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function PostCredits() {
  const { humans, gates } = useStats()
  return (
    <div className="relative z-[45] bg-[#020306]">
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 h-40 bg-gradient-to-b from-transparent to-[#020306]" />

      <section className="mx-auto max-w-7xl px-5 pt-32 pb-24 sm:px-8 md:pt-44">
        <motion.p {...reveal} className="font-mono text-[11px] tracking-[0.4em] text-cyan-200/60 uppercase">
          Now showing
        </motion.p>
        <motion.h2 {...reveal} className="mt-5 max-w-3xl text-[clamp(2.4rem,5.5vw,4.75rem)] leading-[0.95] font-semibold tracking-[-0.055em]">
          Three ways in. <span className="text-white/40">All of them live on Hedera today.</span>
        </motion.h2>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {POSTERS.map((p, i) => (
            <Poster key={p.kicker} p={p} i={i} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 md:grid-cols-4">
          {[
            [humans !== undefined ? String(humans) : '...', 'Verified humans'],
            [gates !== undefined ? String(gates) : '...', 'Gates created'],
            ['0', 'Documents stored'],
            ['0', 'HBAR paid by users'],
          ].map(([v, k], i) => (
            <motion.div key={k} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className={`py-10 ${i ? 'md:border-l md:border-white/10 md:pl-8' : ''}`}>
              <div className="text-5xl font-semibold tracking-[-0.05em] tabular-nums">{v}</div>
              <div className="mt-2 font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase">{k}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-28 sm:px-8 md:py-36 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div {...reveal}>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.05em]">
            The answer, <span className="text-white/40">live.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/60">This terminal is hitting the real API on Hedera testnet. Any app can ask the same question.</p>
          <Link to="/developers" className="mt-9 inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm hover:bg-white/10">
            Developer docs <ArrowRight className="size-4" />
          </Link>
        </motion.div>
        <motion.div {...reveal} className="min-w-0">
          <LiveTerminal />
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-28 sm:px-8 md:pb-36 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.h2 {...reveal} className="text-[clamp(2.2rem,4.5vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.05em]">
          Questions
        </motion.h2>
        <Accordion.Root type="single" collapsible className="divide-y divide-white/10 border-y border-white/10">
          {FAQ.map(([q, a]) => (
            <Accordion.Item key={q} value={q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium">
                  {q}
                  <Plus className="size-4 shrink-0 text-white/50 transition-transform duration-300 group-data-[state=open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_250ms_cubic-bezier(0.16,1,0.3,1)]">
                <p className="max-w-xl pb-6 text-white/60">{a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>

      <Credits />
    </div>
  )
}

function Credits() {
  const roles = [
    ['Starring', 'You'],
    ['Proofs by', 'Self Protocol'],
    ['Produced on', 'Hedera'],
    ['Holo card after', 'Arlan Marat'],
    ['Data stored about you', 'None'],
  ]
  const links = [
    ['Get verified', '/start'],
    ['Dashboard', '/app'],
    ['Developers', '/developers'],
    ['Registry contract', explorer.contract(REGISTRY_ADDRESS)],
    ['Gates contract', explorer.contract(GATES_ADDRESS)],
    ['GitHub', 'https://github.com/Gravyie/Universal-Web3-Identity-UWI'],
  ]
  return (
    <footer className="border-t border-white/10 px-5 pt-28 pb-16 text-center sm:px-8">
      <motion.dl {...reveal} className="mx-auto grid max-w-md gap-5">
        {roles.map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[10px] tracking-[0.4em] text-white/40 uppercase">{k}</dt>
            <dd className="mt-1 text-xl font-medium tracking-[-0.02em]">{v}</dd>
          </div>
        ))}
      </motion.dl>
      <nav className="mx-auto mt-20 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/50" aria-label="Footer">
        {links.map(([label, href]) =>
          href.startsWith('/') ? (
            <Link key={label} to={href} className="hover:text-white">
              {label}
            </Link>
          ) : (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
              {label} <ArrowUpRight className="size-3" />
            </a>
          ),
        )}
      </nav>
      <p className="mt-10 text-xs text-white/30">Running on Hedera testnet. Credentials here are for testing.</p>
    </footer>
  )
}
