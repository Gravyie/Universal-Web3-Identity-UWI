import { motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  EyeOff,
  Fingerprint,
  Gamepad2,
  Landmark,
  Lock,
  ScanFace,
  Users,
  Vote,
  Wallet,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { easeOutExpo } from '../lib/motion'
import { IdentityCard } from '../components/IdentityCard'
import { Guilloche } from '../components/Guilloche'
import { IntegrationSnippets } from '../components/IntegrationSnippets'
import { useTotalSupply } from '../hooks/useIdentity'
import { formatNumber } from '../lib/format'

const SAMPLE = {
  username: 'ada_lovelace',
  address: '0x7a3F1c9E0b5D2A8e4C6f1B3d9E7a2C5b8D0e4F61',
  tokenId: 42,
  issuedAt: Date.UTC(2026, 9, 14),
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Problem />
      <HowItWorks />
      <Privacy />
      <UseCases />
      <Builders />
      <FinalCta />
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero() {
  const line = {
    hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
    show: (i) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.9, delay: 0.1 + i * 0.09, ease: easeOutExpo },
    }),
  }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hairline-grid [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)] opacity-70" />
      <div className="pointer-events-none absolute top-1/2 left-[68%] aspect-square w-[min(1100px,140vw)] -translate-x-1/2 -translate-y-1/2 text-accent max-lg:top-[72%] max-lg:left-1/2">
        <Guilloche variant="seal" draw strokeWidth={0.16} opacity={0.2} />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-24 lg:pb-28">
        <div>
          <motion.div
            variants={line}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 py-1 pr-3 pl-1 text-xs text-ink-2 backdrop-blur"
          >
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-accent uppercase">
              Testnet
            </span>
            Proof of personhood for Web3
          </motion.div>

          <h1 className="mt-6 text-[clamp(2.6rem,7vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance text-ink">
            <motion.span variants={line} initial="hidden" animate="show" custom={1} className="block">
              One human.
            </motion.span>
            <motion.span variants={line} initial="hidden" animate="show" custom={2} className="block">
              One identity.
            </motion.span>
            <motion.span
              variants={line}
              initial="hidden"
              animate="show"
              custom={3}
              className="block font-display font-normal tracking-[-0.02em] text-accent italic"
            >
              Zero oversharing.
            </motion.span>
          </h1>

          <motion.p
            variants={line}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2"
          >
            UWI proves you're a real, unique person with a zero-knowledge passport check — then binds that proof
            to your wallet as a soulbound credential. Airdrops, DAOs and communities get Sybil resistance. You keep
            your documents.
          </motion.p>

          <motion.div
            variants={line}
            initial="hidden"
            animate="show"
            custom={5}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/create" size="lg">
              Create your identity
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button to="/verify" size="lg" variant="secondary">
              Verify an address
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.35, ease: easeOutExpo }}
          className="relative mx-auto w-full max-w-[520px] [perspective:1400px]"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <IdentityCard {...SAMPLE} status="verified" />
          </motion.div>
          <div className="pointer-events-none absolute inset-x-[10%] -bottom-10 h-16 rounded-[50%] bg-black/30 blur-2xl dark:bg-black/60" />
          <p className="mt-14 text-center font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Sample credential · move your cursor over it
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Stats ────────────────────────────────────────────────────────────── */

function Stats() {
  const { data: supply, isLoading } = useTotalSupply()
  const items = [
    {
      k: 'Credentials issued',
      v: isLoading ? null : supply !== undefined ? formatNumber(Number(supply)) : '—',
      live: true,
    },
    { k: 'Documents stored on-chain', v: '0' },
    { k: 'Times a credential can move', v: 'Never' },
    { k: 'Network', v: 'Hedera' },
  ]
  return (
    <section className="border-y border-line bg-bg-elev/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
        {items.map((s, i) => (
          <Reveal key={s.k} delay={i * 0.06} className="px-1 py-7 lg:px-7">
            <div className="flex items-center gap-2 text-xs text-muted">
              {s.live && (
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative size-1.5 rounded-full bg-accent" />
                </span>
              )}
              {s.k}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink tabular-nums">
              {s.v ?? <span className="skeleton inline-block h-8 w-14 rounded-md align-middle" />}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── Problem ──────────────────────────────────────────────────────────── */

function SectionHead({ eyebrow, title, children, id }) {
  return (
    <Reveal className="max-w-2xl" id={id}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-ink">
        {title}
      </h2>
      {children && <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p>}
    </Reveal>
  )
}

function SybilDiagram({ unified }) {
  const wallets = Array.from({ length: 9 }, (_, i) => {
    const a = (-70 + i * 17.5) * (Math.PI / 180)
    return { x: 150 + Math.cos(a) * 110, y: 110 + Math.sin(a) * 92 }
  })
  return (
    <svg viewBox="0 0 300 220" className="w-full" aria-hidden="true">
      {wallets.map((w, i) => {
        const muted = unified && i !== 4
        return (
          <g key={i}>
            <motion.line
              x1="40"
              y1="110"
              x2={w.x}
              y2={w.y}
              stroke="currentColor"
              strokeWidth="1"
              className={muted ? 'text-line-strong' : unified ? 'text-accent' : 'text-danger/70'}
              strokeDasharray={muted ? '3 4' : undefined}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: easeOutExpo }}
            />
            <motion.rect
              x={w.x - 9}
              y={w.y - 7}
              width="18"
              height="14"
              rx="3"
              className={muted ? 'fill-surface-2 stroke-line-strong' : unified ? 'fill-accent-soft stroke-accent' : 'fill-danger/10 stroke-danger/70'}
              strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              style={{ transformOrigin: `${w.x}px ${w.y}px` }}
            />
          </g>
        )
      })}
      <circle cx="40" cy="110" r="16" className="fill-surface stroke-line-strong" strokeWidth="1" />
      <circle cx="40" cy="104" r="4.5" className="fill-ink-2" />
      <path d="M31 119a9 7 0 0 1 18 0" className="fill-ink-2" />
    </svg>
  )
}

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHead eyebrow="The problem" title="Wallets are free. People aren't.">
        Anyone can spin up a thousand addresses in a minute. That breaks every system that assumes one wallet
        means one person — fair launches, token-weighted votes, faucets, quests.
      </SectionHead>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {[
          {
            title: 'Without UWI',
            body: 'One farmer, nine wallets, nine airdrop claims. Votes and rewards go to whoever scripts hardest.',
            unified: false,
          },
          {
            title: 'With UWI',
            body: 'One verified person, one credential. Extra wallets have no proof attached, so they get nothing.',
            unified: true,
          },
        ].map((c, i) => (
          <Reveal
            key={c.title}
            delay={i * 0.1}
            className="rounded-3xl border border-line bg-bg-elev p-6 sm:p-8"
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${c.unified ? 'bg-accent' : 'bg-danger'}`} />
              <h3 className="font-medium text-ink">{c.title}</h3>
            </div>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">{c.body}</p>
            <div className="mt-6 px-2">
              <SybilDiagram unified={c.unified} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── How it works ─────────────────────────────────────────────────────── */

const STEPS = [
  { icon: Wallet, title: 'Connect a wallet', body: 'Any EVM wallet works — browser extension or mobile via WalletConnect.' },
  { icon: Fingerprint, title: 'Pick a username', body: 'The only human-readable detail on your credential. Make it yours.' },
  {
    icon: ScanFace,
    title: 'Prove it with Self',
    body: "Scan the QR with the Self app. Your passport's NFC chip is read on your phone and turned into a zero-knowledge proof.",
  },
  {
    icon: Lock,
    title: 'Mint your soulbound ID',
    body: 'A non-transferable token on Hedera binds the proof to your wallet. Any dApp can check it with one call.',
  },
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-bg-elev/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHead eyebrow="How it works" title="Four steps. About two minutes.">
          No forms, no selfies uploaded to a vendor, no waiting for a reviewer.
        </SectionHead>

        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <motion.div
            className="absolute top-5 right-[12%] left-[12%] hidden h-px origin-left bg-line-strong md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.4, ease: easeOutExpo }}
          />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={0.15 + i * 0.12} className="relative flex gap-5 md:block">
              <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-bg text-accent">
                <s.icon className="size-[18px]" />
              </div>
              <div className="md:mt-6">
                <div className="font-mono text-xs text-muted">0{i + 1}</div>
                <h3 className="mt-1 text-lg font-medium tracking-[-0.02em] text-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ── Privacy ledger ───────────────────────────────────────────────────── */

function Privacy() {
  const onChain = [
    ['Username', 'ada_lovelace'],
    ['Verification hash', '0x9f2c…e41a'],
    ['Issued at', 'block timestamp'],
    ['Owner', 'your wallet address'],
  ]
  const offChain = ['Legal name', 'Date of birth', 'Passport number', 'Nationality', 'Photo', 'Document expiry']

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHead eyebrow="Privacy by construction" title="The chain learns that you're human. Nothing else.">
        Self reads your document on your phone and only shares the answer to a yes-or-no question — “is this a
        unique person over 18?” UWI stores a hash of that answer, never the document.
      </SectionHead>

      <div className="mt-14 grid overflow-hidden rounded-3xl border border-line-strong md:grid-cols-2">
        <Reveal className="bg-bg-elev p-6 sm:p-9">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Landmark className="size-4 text-accent" /> Written on-chain
          </div>
          <dl className="mt-6 divide-y divide-line">
            {onChain.map(([k, v], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08, ease: easeOutExpo, duration: 0.6 }}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <dt className="text-[15px] text-ink-2">{k}</dt>
                <dd className="truncate font-mono text-[13px] text-ink">{v}</dd>
              </motion.div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={0.1} className="relative overflow-hidden border-t border-line-strong bg-surface-2/60 p-6 sm:p-9 md:border-t-0 md:border-l">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <EyeOff className="size-4 text-accent" /> Never leaves your phone
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {offChain.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                className="rounded-full border border-line-strong bg-bg/60 px-3.5 py-1.5 text-sm text-ink-2 line-through decoration-muted/60"
              >
                {item}
              </motion.li>
            ))}
          </ul>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-muted">
            Zero-knowledge proofs let Self show a statement is true without showing the data behind it.
          </p>
          <div className="pointer-events-none absolute -right-16 -bottom-20 size-64 text-accent">
            <Guilloche variant="mark" strokeWidth={0.5} opacity={0.25} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Use cases ────────────────────────────────────────────────────────── */

const CASES = [
  { icon: Coins, title: 'Fair airdrops', body: 'One claim per person, not per wallet. Farmers stop draining your distribution.', span: 'md:col-span-2' },
  { icon: Vote, title: 'DAO governance', body: 'One-person-one-vote and quadratic voting finally hold up.' },
  { icon: Users, title: 'Communities', body: 'Token-gate a Discord or forum to verified humans without collecting emails.' },
  { icon: Gamepad2, title: 'Gaming & quests', body: 'Leaderboards and reward pools free of bot armies and alt accounts.', span: 'md:col-span-2' },
]

function UseCases() {
  return (
    <section className="border-t border-line bg-bg-elev/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHead eyebrow="Use cases" title="Verify once. Show up everywhere.">
          Instead of every dApp running its own checks, they read the same credential. You never repeat KYC.
        </SectionHead>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {CASES.map((c, i) => (
            <Reveal
              key={c.title}
              delay={i * 0.07}
              className={`group relative overflow-hidden rounded-3xl border border-line bg-bg p-7 transition-colors hover:border-line-strong ${c.span ?? ''}`}
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-10 text-xl font-medium tracking-[-0.025em] text-ink">{c.title}</h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{c.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Builders ─────────────────────────────────────────────────────────── */

function Builders() {
  return (
    <section id="builders" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28">
          <SectionHead eyebrow="For builders" title="Sybil resistance in one line of code.">
            Call <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">isVerifiedHuman(address)</code> from
            a contract or a frontend. No API keys, no vendor, no personal data to store or secure.
          </SectionHead>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <Button to="/verify" variant="secondary">
              Try a lookup <ArrowRight className="size-4" />
            </Button>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="min-w-0">
          <IntegrationSnippets />
        </Reveal>
      </div>
    </section>
  )
}

/* ── Final CTA ────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-[2rem] border border-line-strong bg-bg-elev px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[900px] -translate-x-1/2 -translate-y-1/2 text-accent">
          <Guilloche variant="seal" strokeWidth={0.2} opacity={0.22} />
        </div>
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-[clamp(2rem,5vw,3.75rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance text-ink">
            Be counted <span className="font-display font-normal text-accent italic">once</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[17px] text-ink-2">
            Get your credential in a couple of minutes. It's free on testnet — you only need a little test HBAR for gas.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button to="/create" size="lg">
              Create your identity <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button href="https://self.xyz" size="lg" variant="ghost">
              About Self <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
