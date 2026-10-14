import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'motion/react'
import { ArrowRight, ArrowsClockwise, Code, DownloadSimple, Fingerprint, GasPump, Plus, SealCheck } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { HoloCard } from '../components/holo/HoloCard'
import { GateCard } from '../components/GateCard'
import { CodeSnippets } from '../components/CodeSnippets'
import { SybilDiagram, SystemPipeline } from '../components/Diagrams'
import { useStats } from '../hooks/useCredential'
import { formatNumber } from '../lib/format'
import { easeOutExpo } from '../lib/motion'

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: easeOutExpo },
}

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

function Hero() {
  const enter = (i) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: 0.05 + i * 0.08, ease: easeOutExpo },
  })
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] size-[720px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 65%)' }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 md:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-12 lg:pt-20 lg:pb-24">
        <div>
          <motion.h1
            {...enter(0)}
            className="text-[clamp(2.4rem,3.7vw,3.4rem)] leading-[1.06] font-semibold tracking-[-0.05em] text-ink"
          >
            <span className="lg:block lg:whitespace-nowrap">Prove you're human once. </span>
            <span className="text-muted lg:block lg:whitespace-nowrap">Use it everywhere.</span>
          </motion.h1>
          <motion.p {...enter(1)} className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-2">
            A private, soulbound credential that tells any app you're one unique person, without showing who you are.
          </motion.p>
          <motion.div {...enter(2)} className="mt-9 flex flex-wrap items-center gap-3">
            <Button to="/start" size="lg">
              Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button to="/developers" size="lg" variant="secondary">
              Build with UWI
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: easeOutExpo }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <HoloCard
            username="ada_lovelace"
            address="0x7a3F1c9E0b5D2A8e4C6f1B3d9E7a2C5b8D0e4F61"
            tokenId={42}
            issuedAt={Date.UTC(2026, 9, 14)}
            proof="self"
            label="Example UWI credential for @ada_lovelace. Move the pointer over it, or tilt your phone."
          />
        </motion.div>
      </div>
    </section>
  )
}

/* ── Live network stats ───────────────────────────────────────────────── */

function Stats() {
  const { humans, gates, isLoading } = useStats()
  const items = [
    { k: 'Verified humans', v: humans !== undefined ? formatNumber(Number(humans)) : null },
    { k: 'Gates created', v: gates !== undefined ? formatNumber(Number(gates)) : null },
    { k: 'Documents stored', v: '0' },
    { k: 'Gas paid by users', v: '0 HBAR' },
  ]
  return (
    <section className="border-y border-line bg-bg-elev">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div key={s.k} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }} className="py-8 md:px-6 md:first:pl-0">
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="mt-1.5 text-3xl font-semibold tracking-[-0.04em] text-ink tabular-nums">
              {s.v ?? (isLoading ? <span className="skeleton inline-block h-8 w-16 rounded-lg align-middle" /> : '-')}
            </dd>
          </motion.div>
        ))}
      </dl>
    </section>
  )
}

/* ── Problem ──────────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
      <motion.h2 {...reveal} className="max-w-2xl text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-ink">
        Wallets are free. That's the problem.
      </motion.h2>
      <motion.p {...reveal} className="mt-4 max-w-xl text-lg text-ink-2">
        Anything that assumes one wallet means one person can be farmed. Flip the switch to see the difference.
      </motion.p>
      <motion.div {...reveal} className="mt-12">
        <SybilDiagram />
      </motion.div>
    </section>
  )
}

/* ── How it works ─────────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <motion.p {...reveal} className="label">
          How it works
        </motion.p>
        <motion.h2 {...reveal} className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-ink">
          Less data at every hop.
        </motion.h2>
        <motion.p {...reveal} className="mt-4 max-w-xl text-lg text-ink-2">
          Each step only passes on what the next one needs. By the time an app asks, the answer is a single yes or no.
        </motion.p>
        <div className="mt-14 md:mb-10">
          <SystemPipeline />
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
    ['Issued', 'block timestamp'],
    ['Holder', 'your wallet'],
  ]
  const phone = ['Legal name', 'Date of birth', 'Passport number', 'Nationality', 'Photo', 'Expiry date']
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div {...reveal}>
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-ink">
            The chain learns you're human. Nothing else.
          </h2>
          <p className="mt-4 max-w-md text-lg text-ink-2">
            The nullifier is derived from your document and UWI's scope, so it can't be traced back to the document or linked across other apps.
          </p>
        </motion.div>
        <motion.div {...reveal} className="grid overflow-hidden rounded-[20px] border border-line-strong sm:grid-cols-2">
          <div className="bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">On-chain</h3>
            <dl className="mt-5 grid gap-4">
              {chain.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 font-mono text-[13px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="border-t border-line-strong bg-surface-2 p-6 sm:border-t-0 sm:border-l">
            <h3 className="text-sm font-medium text-ink">Stays on your phone</h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {phone.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                  className="rounded-full border border-line-strong bg-bg px-3 py-1 text-sm text-muted line-through"
                >
                  {p}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Gates (the product for builders) ─────────────────────────────────── */

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
    { icon: Fingerprint, title: 'One entry per human', body: 'Entries are keyed to the credential, not the wallet. Switching wallets gets nobody a second spot.' },
    { icon: GasPump, title: 'Gasless to join', body: 'People sign a message. The relayer pays. Nobody needs HBAR to sign up.' },
    { icon: DownloadSimple, title: 'Export anywhere', body: 'CSV, JSON or straight from the contract. Your list, readable by any script.' },
  ]
  return (
    <section id="gates" className="scroll-mt-20 border-t border-line bg-bg-elev">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <motion.p {...reveal} className="label">
          Gates
        </motion.p>
        <motion.h2 {...reveal} className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-ink">
          Sybil-proof lists in a minute.
        </motion.h2>
        <motion.p {...reveal} className="mt-4 max-w-xl text-lg text-ink-2">
          Allowlists, waitlists and sign-ups that only verified humans can join. Share a link, watch it fill, export it.
        </motion.p>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <motion.div
            {...reveal}
            className="relative overflow-hidden rounded-[20px] border border-line p-6 md:col-span-4 md:row-span-2 md:p-10"
            style={{ background: 'radial-gradient(120% 100% at 100% 0%, var(--accent-soft), transparent 60%), var(--surface)' }}
          >
            <p className="text-sm text-muted">Example gate</p>
            <div className="mt-4 max-w-md">
              <GateCard gate={EXAMPLE_GATE} memberSeeds={['a1', 'b2', 'c3', 'd4', 'e5', 'f6']} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/app/gates" variant="ink">
                <Plus className="size-4" /> Create a gate
              </Button>
            </div>
          </motion.div>
          {cells.map((c, i) => (
            <motion.div
              key={c.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: 0.08 * i }}
              className={`rounded-[20px] border border-line p-6 md:col-span-2 ${i === 2 ? 'bg-ink text-bg md:col-span-6 md:flex md:items-center md:gap-8' : 'bg-surface'}`}
            >
              <c.icon className={`size-5 shrink-0 ${i === 2 ? 'text-bg' : 'text-accent'}`} weight="duotone" />
              <div className={i === 2 ? 'mt-4 md:mt-0' : 'mt-4'}>
                <h3 className={`font-medium ${i === 2 ? 'text-bg' : 'text-ink'}`}>{c.title}</h3>
                <p className={`mt-1.5 text-sm leading-relaxed ${i === 2 ? 'text-bg/70' : 'text-ink-2'}`}>{c.body}</p>
              </div>
            </motion.div>
          ))}
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
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
      <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div {...reveal} className="lg:sticky lg:top-28">
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-ink">
            One question, three ways to ask it.
          </h2>
          <ul className="mt-8 grid gap-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-ink-2">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
                {text}
              </li>
            ))}
          </ul>
          <Button to="/developers" variant="secondary" className="mt-8">
            Read the docs <ArrowRight className="size-4" />
          </Button>
        </motion.div>
        <motion.div {...reveal} className="min-w-0">
          <CodeSnippets only={['rest', 'solidity', 'viem']} />
        </motion.div>
      </div>
    </section>
  )
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

const FAQ = [
  ['Does UWI see my passport?', 'No. Self reads the chip on your phone and produces a zero-knowledge proof. UWI checks that proof and only learns that you are over 18 and haven\'t registered before.'],
  ['What if I lose my wallet?', 'Verify again with Self from a new wallet. Your passport produces the same nullifier, so UWI moves your existing credential, username and gate memberships to the new wallet.'],
  ['Can I delete my credential?', 'Yes. Revoke it from Settings. The token is burned and your username and nullifier are released, so you can verify again later if you want.'],
  ['Do I need crypto to use it?', 'You need a wallet, but not funds. Every action is a signed message, and the UWI relayer pays the network fees.'],
  ['What is a demo credential?', 'On testnet you can try the full product without a passport. Demo credentials are marked on-chain and rejected by strict checks and strict gates.'],
]

function Faq() {
  return (
    <section className="border-t border-line bg-bg-elev">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.h2 {...reveal} className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-ink">
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
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
      <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
        <h2 className="text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-balance text-ink">
          Two minutes to verify. Then you're counted everywhere.
        </h2>
        <div className="mt-9 flex justify-center">
          <Button to="/start" size="lg">
            Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
