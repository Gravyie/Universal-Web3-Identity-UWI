import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { ArrowRight, ArrowsClockwise, Code, DownloadSimple, Fingerprint, GasPump, Plus, SealCheck } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { GateCard } from '../components/GateCard'
import { Aurora, GridFloor, Orbits, Spotlight } from '../components/fx'
import { HeroScene } from '../components/landing/HeroScene'
import { SybilCompare } from '../components/landing/SybilCompare'
import { PipelineStory } from '../components/landing/PipelineStory'
import { RedactedPassport } from '../components/landing/RedactedPassport'
import { LiveTerminal } from '../components/landing/LiveTerminal'
import { useStats } from '../hooks/useCredential'
import { easeOutExpo } from '../lib/motion'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: easeOutExpo },
}

const H2 = 'text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.05em] text-balance text-ink'

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Problem />
      <HowItWorks />
      <Privacy />
      <GatesSection />
      <Builders />
      <Faq />
      <Closing />
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Words({ text, className, delay = 0 }) {
  return text.split(' ').map((w, i) => (
    <motion.span
      key={i}
      className={`inline-block whitespace-pre ${className ?? ''}`}
      initial={{ opacity: 0, y: '0.5em', filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: delay + i * 0.06, ease: easeOutExpo }}
    >
      {w}{' '}
    </motion.span>
  ))
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Aurora />
      <GridFloor />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-24 sm:px-6 md:pt-20 lg:min-h-[86dvh] lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pt-10">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg-elev/70 py-1 pr-3.5 pl-1 text-[13px] text-ink-2 backdrop-blur"
          >
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-bg">Live</span>
            Proof of personhood on Hedera
          </motion.p>
          <h1 className="mt-7 text-[clamp(2.5rem,3.75vw,3.6rem)] leading-[1.04] font-semibold tracking-[-0.055em] text-ink">
            <span className="block lg:whitespace-nowrap">
              <Words text="Prove you're human" delay={0.1} />
            </span>
            <span className="block lg:whitespace-nowrap">
              <Words text="once." delay={0.34} />
              <Words text="Use it everywhere." delay={0.42} className="text-muted" />
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: easeOutExpo }}
            className="mt-6 max-w-[33rem] text-lg leading-relaxed text-ink-2"
          >
            A private, soulbound credential that tells any app you're one unique person, without showing who you are.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.82, ease: easeOutExpo }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/start" size="lg">
              Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button to="/developers" size="lg" variant="secondary">
              Build with UWI
            </Button>
          </motion.div>
        </div>
        <div className="mx-auto w-full max-w-[560px] pb-6 lg:pb-0">
          <HeroScene />
        </div>
      </div>
    </section>
  )
}

/* ── Live network stats ───────────────────────────────────────────────── */

function Stats() {
  const { humans, gates } = useStats()
  const items = [
    { k: 'Verified humans', v: humans !== undefined ? Number(humans) : null },
    { k: 'Gates created', v: gates !== undefined ? Number(gates) : null },
    { k: 'Documents stored', v: 0 },
    { k: 'Gas paid by users', v: 0, suffix: ' HBAR' },
  ]
  return (
    <section className="relative border-y border-line bg-bg-elev/80 backdrop-blur">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-line">
        {items.map((s) => (
          <div key={s.k} className="py-8 md:px-8 md:first:pl-0">
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-ink">
              {s.v === null ? <span className="skeleton inline-block h-9 w-16 rounded-lg align-middle" /> : <NumberFlow value={s.v} suffix={s.suffix} />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ── Problem ──────────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 md:py-36">
      <motion.h2 {...reveal} className={`${H2} max-w-2xl`}>
        Wallets are free. That's the whole problem.
      </motion.h2>
      <motion.p {...reveal} className="mt-5 max-w-xl text-lg text-ink-2">
        Airdrops, votes and rewards that assume one wallet is one person get farmed. Pick a side.
      </motion.p>
      <motion.div {...reveal} className="mt-12">
        <SybilCompare />
      </motion.div>
    </section>
  )
}

/* ── How it works (pinned story) ──────────────────────────────────────── */

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 md:pt-36">
        <motion.p {...reveal} className="label">
          How it works
        </motion.p>
        <motion.h2 {...reveal} className={`${H2} mt-4 max-w-2xl`}>
          Less data at every hop.
        </motion.h2>
        <div className="mt-12 pb-28 md:mt-0 md:pb-0">
          <PipelineStory />
        </div>
      </div>
    </section>
  )
}

/* ── Privacy ──────────────────────────────────────────────────────────── */

function Privacy() {
  const chain = [
    ['Username', 'ada_lovelace'],
    ['Nullifier hash', '0x2f9c...e41a'],
    ['Proof', 'self'],
    ['Holder', 'your wallet'],
  ]
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-28 sm:px-6 md:py-36 lg:grid-cols-[1.05fr_1fr]">
        <RedactedPassport />
        <div>
          <motion.h2 {...reveal} className={H2}>
            The chain learns you're human. Nothing else.
          </motion.h2>
          <motion.p {...reveal} className="mt-5 max-w-md text-lg text-ink-2">
            Your passport never leaves your phone. What gets written is a username and a nullifier hash that can't be traced back to the document.
          </motion.p>
          <motion.dl {...reveal} className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line">
            {chain.map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-[13px] text-ink">{v}</dd>
              </div>
            ))}
          </motion.dl>
          <p className="mt-3 text-sm text-muted">Everything UWI stores about you, in full.</p>
        </div>
      </div>
    </section>
  )
}

/* ── Gates ────────────────────────────────────────────────────────────── */

const EXAMPLE_GATE = {
  id: 'example',
  name: 'Season 2 airdrop',
  description: 'One claim per human. Snapshot when the gate closes.',
  memberCount: 1284,
  capacity: 5000,
  closesAt: Date.now() + 6 * 86400000,
  strict: true,
  closed: false,
}

function GatesSection() {
  const cells = [
    { icon: Fingerprint, title: 'One entry per human', body: 'Entries key to the credential, not the wallet. New wallets never buy a second spot.' },
    { icon: GasPump, title: 'Gasless to join', body: 'People sign a message and the relayer pays. Nobody needs HBAR to sign up.' },
  ]
  return (
    <section id="gates" className="scroll-mt-20 border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 md:py-36">
        <motion.p {...reveal} className="label">
          Gates
        </motion.p>
        <motion.h2 {...reveal} className={`${H2} mt-4 max-w-2xl`}>
          Sybil-proof lists in a minute.
        </motion.h2>
        <motion.p {...reveal} className="mt-5 max-w-xl text-lg text-ink-2">
          Allowlists, waitlists and sign-ups only verified humans can join. Share a link, watch it fill, export it.
        </motion.p>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <motion.div {...reveal} className="md:col-span-4 md:row-span-2">
            <Spotlight className="h-full p-6 md:p-10">
              <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(80% 90% at 100% 0%, var(--accent-soft), transparent 60%)' }} />
              <div aria-hidden="true" className="absolute -right-24 -bottom-24 -z-10 size-80 opacity-60">
                <Orbits speed={60} className="size-full" />
              </div>
              <p className="text-sm text-muted">Example gate</p>
              <div className="mt-4 max-w-md">
                <GateCard gate={EXAMPLE_GATE} memberSeeds={['a1', 'b2', 'c3', 'd4', 'e5', 'f6']} />
              </div>
              <Button to="/app/gates?new=1" variant="ink" className="mt-8">
                <Plus className="size-4" /> Create a gate
              </Button>
            </Spotlight>
          </motion.div>
          {cells.map((c, i) => (
            <motion.div key={c.title} {...reveal} transition={{ ...reveal.transition, delay: 0.08 * (i + 1) }} className="md:col-span-2">
              <Spotlight className="h-full p-6">
                <c.icon className="size-6 text-accent" weight="duotone" />
                <h3 className="mt-8 font-semibold tracking-[-0.02em] text-ink">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{c.body}</p>
              </Spotlight>
            </motion.div>
          ))}
          <motion.div {...reveal} className="md:col-span-6">
            <div className="relative overflow-hidden rounded-[20px] bg-ink p-6 text-bg md:flex md:items-center md:gap-8 md:p-8">
              <DownloadSimple className="size-6 shrink-0" weight="duotone" />
              <div className="mt-4 md:mt-0">
                <h3 className="font-semibold tracking-[-0.02em]">Export anywhere</h3>
                <p className="mt-1 text-sm text-bg/70">CSV, JSON or straight from the contract. Your list, readable by any script.</p>
              </div>
              <code className="mt-5 block truncate rounded-full bg-bg/10 px-4 py-2 font-mono text-xs text-bg/80 md:mt-0 md:ml-auto">
                GET /api/v1/gates/1?format=csv
              </code>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── Builders ─────────────────────────────────────────────────────────── */

function Builders() {
  const points = [
    { icon: Code, text: 'A view call from Solidity, or one GET from any backend.' },
    { icon: SealCheck, text: 'Strict mode only accepts real Self proofs, never demo ones.' },
    { icon: ArrowsClockwise, text: 'Lost wallets recover to new ones with the same identity.' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 md:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div {...reveal}>
          <h2 className={H2}>One question. Ask it from anywhere.</h2>
          <ul className="mt-8 grid gap-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-ink-2">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
                {text}
              </li>
            ))}
          </ul>
          <Button to="/developers" variant="secondary" className="mt-9">
            Read the docs <ArrowRight className="size-4" />
          </Button>
        </motion.div>
        <motion.div {...reveal} className="min-w-0">
          <LiveTerminal />
        </motion.div>
      </div>
    </section>
  )
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

const FAQ = [
  ['Does UWI see my passport?', "No. Self reads the chip on your phone and produces a zero-knowledge proof. UWI checks that proof and only learns that you're over 18 and haven't registered before."],
  ['What if I lose my wallet?', 'Verify again with Self from a new wallet. Your passport produces the same nullifier, so UWI moves your existing credential, username and gate memberships to the new wallet.'],
  ['Can I delete my credential?', 'Yes. Revoke it from Settings. The token is burned and your username and nullifier are released, so you can verify again later if you want.'],
  ['Do I need crypto to use it?', 'You need a wallet, but not funds. Every action is a signed message, and the UWI relayer pays the network fees.'],
  ['What is a demo credential?', 'On testnet you can try the full product without a passport. Demo credentials are marked on-chain and rejected by strict checks and strict gates.'],
]

function Faq() {
  return (
    <section className="border-t border-line bg-bg-elev">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-28 sm:px-6 md:py-36 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.h2 {...reveal} className={H2}>
          Questions
        </motion.h2>
        <Accordion.Root type="single" collapsible className="divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <Accordion.Item key={q} value={q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium text-ink">
                  {q}
                  <Plus className="size-4 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_250ms_cubic-bezier(0.16,1,0.3,1)]">
                <p className="max-w-xl pb-5 text-ink-2">{a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}

/* ── Closing ──────────────────────────────────────────────────────────── */

function Closing() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 size-[min(780px,140vw)] -translate-1/2 opacity-70">
        <Orbits speed={50} className="size-full" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-36 text-center sm:px-6 md:py-48">
        <motion.h2 {...reveal} className="mx-auto max-w-4xl text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-balance text-ink">
          Two minutes to verify. Counted everywhere after.
        </motion.h2>
        <motion.div {...reveal} className="mt-10 flex justify-center">
          <Button to="/start" size="lg">
            Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
