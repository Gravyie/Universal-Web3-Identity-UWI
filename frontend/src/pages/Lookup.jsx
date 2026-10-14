import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BadgeCheck, Search, ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { IntegrationSnippets } from '../components/IntegrationSnippets'
import { Reveal } from '../components/ui/Reveal'
import { useIdentity } from '../hooks/useIdentity'
import { isDemoHash } from '../lib/identity'
import { formatDate, padTokenId, shortAddress } from '../lib/format'

export default function Lookup() {
  const [params, setParams] = useSearchParams()
  const { address: own } = useAccount()
  const query = params.get('address') ?? ''
  const [input, setInput] = useState(query)
  const [touched, setTouched] = useState(false)
  const valid = isAddress(input.trim(), { strict: false })

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (valid) setParams({ address: input.trim() })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
      <div className="max-w-2xl">
        <div className="eyebrow">Lookup</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
          Is this wallet a <span className="font-display font-normal text-accent italic">human</span>?
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
          Paste any address to check it against the UWI contract — the same read your dApp would make.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 max-w-2xl" noValidate>
        <div
          className={`flex h-14 items-center gap-2 rounded-2xl border bg-surface pr-2 pl-4 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_4px_var(--accent-soft)] ${
            touched && !valid ? 'border-danger/60' : 'border-line-strong focus-within:border-accent'
          }`}
        >
          <Search className="size-4 shrink-0 text-muted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Wallet address"
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-[15px] text-ink outline-none placeholder:text-muted/60"
          />
          <Button type="submit" size="md" className="shrink-0">
            Check
          </Button>
        </div>
        <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-[13px]">
          <span className="text-danger">{touched && !valid ? 'Enter a full 0x address (42 characters).' : ''}</span>
          {own && (
            <button
              type="button"
              onClick={() => {
                setInput(own)
                setParams({ address: own })
              }}
              className="text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              Use my wallet
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 max-w-2xl">
        <AnimatePresence mode="wait">{isAddress(query, { strict: false }) && <Result key={query} address={query} />}</AnimatePresence>
      </div>

      <div className="mt-24 grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="eyebrow">Integrate</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">Gate anything behind personhood.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
            <code className="font-mono text-[0.9em] text-ink">isVerifiedHuman</code> is a free view call. Use it in a
            contract to protect claims and votes, or in your frontend to tailor the experience.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <IntegrationSnippets />
        </Reveal>
      </div>
    </div>
  )
}

function Result({ address }) {
  const { status, identity } = useIdentity(address)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-3xl border border-line-strong bg-bg-elev"
      aria-live="polite"
    >
      {status === 'loading' && (
        <div className="flex items-center gap-3 p-6 text-ink-2">
          <Spinner className="size-4" /> Reading the contract…
        </div>
      )}
      {status === 'no-contract' && (
        <div className="p-6 text-ink-2">The UWI contract isn't deployed at the configured address, so there's nothing to check against.</div>
      )}
      {status === 'error' && <div className="p-6 text-danger">Couldn't reach Hedera. Try again in a moment.</div>}
      {status === 'none' && (
        <div className="flex items-start gap-4 p-6">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="text-lg font-medium text-ink">Not verified</div>
            <p className="mt-1 text-[15px] text-ink-2">
              <span className="font-mono">{shortAddress(address, 8, 6)}</span> has no UWI credential. Treat it as an
              unverified wallet.
            </p>
          </div>
        </div>
      )}
      {status === 'found' && (
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent"
            >
              <BadgeCheck className="size-5" />
            </motion.div>
            <div className="min-w-0">
              <div className="text-lg font-medium text-ink">
                Verified human
                {isDemoHash(identity.verificationHash) && (
                  <span className="ml-2 rounded-full border border-warn/40 px-2 py-0.5 align-middle font-mono text-[10px] tracking-[0.1em] text-warn uppercase">
                    demo proof
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-[15px] text-ink-2">
                @{identity.username} · token #{padTokenId(identity.tokenId)} · since {formatDate(identity.createdAt)}
              </p>
            </div>
          </div>
          <Link
            to={`/id/${address}`}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent"
          >
            View credential <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}
