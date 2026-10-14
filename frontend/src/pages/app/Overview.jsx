import { useRef } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { ArrowRight, DownloadSimple, Door, Plus, ShareNetwork } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/primitives'
import { HoloCard } from '../../components/holo/HoloCard'
import { GateCard } from '../../components/GateCard'
import { CredentialDetails } from '../../components/CredentialDetails'
import { useCredential, useStats } from '../../hooks/useCredential'
import { useMyGates } from '../../hooks/useGates'
import { useCardActions } from '../../hooks/useCardActions'
import { formatNumber } from '../../lib/format'
import { easeOutExpo } from '../../lib/motion'

export default function Overview() {
  const { address } = useAccount()
  const { status, credential } = useCredential(address)

  if (status === 'loading' || status === 'idle') return <OverviewSkeleton />
  if (status === 'none') return <NotVerified />
  if (status === 'error') {
    return <EmptyState title="Couldn't reach Hedera" body="The network didn't respond. Refresh to try again." />
  }
  return <Verified credential={credential} address={address} />
}

function PageHeader({ title, body, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-ink sm:text-3xl">{title}</h1>
        {body && <p className="mt-1.5 text-ink-2">{body}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

function Verified({ credential, address }) {
  const cardRef = useRef(null)
  const { save, share, saving } = useCardActions(cardRef, credential.username)
  const { created, joined, isLoading } = useMyGates(address)
  const { humans, gates } = useStats()
  const recent = [...created.map((g) => ({ ...g, mine: true })), ...joined].slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title={`Hi, @${credential.username}`}
        body="Your credential, and the gates you run and belong to."
        actions={
          <Button to="/app/gates?new=1" size="sm">
            <Plus className="size-4" /> New gate
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOutExpo }}>
          <HoloCard
            ref={cardRef}
            username={credential.username}
            address={address}
            tokenId={credential.tokenId}
            issuedAt={credential.issuedAt}
            proof={credential.proof}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={share}>
              <ShareNetwork className="size-4" /> Share profile
            </Button>
            <Button variant="ghost" size="sm" onClick={save} loading={saving}>
              {!saving && <DownloadSimple className="size-4" />} Save image
            </Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: easeOutExpo }}>
          <CredentialDetails credential={credential} address={address} />
        </motion.div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ['Gates you run', created.length],
          ['Gates you joined', joined.length],
          ['Verified humans on UWI', humans !== undefined ? formatNumber(Number(humans)) : null],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[20px] border border-line bg-surface p-5">
            <div className="text-sm text-muted">{k}</div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-ink tabular-nums">
              {v ?? <Skeleton className="mt-1 h-7 w-12" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-ink">Recent gates</h2>
          <Button to="/app/gates" variant="ghost" size="sm">
            All gates <ArrowRight className="size-3.5" />
          </Button>
        </div>
        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-36 rounded-[20px]" />
            <Skeleton className="h-36 rounded-[20px]" />
          </div>
        ) : recent.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recent.map((g) => (
              <GateCard key={g.id} gate={g} mine={g.mine} to={g.mine ? `/app/gates/${g.id}` : `/g/${g.id}`} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[20px] border border-dashed border-line-strong">
            <EmptyState
              icon={Door}
              title="No gates yet"
              body={`Create a Sybil-proof list for your airdrop, waitlist or community. ${gates ? `${formatNumber(Number(gates))} gates exist on UWI so far.` : ''}`}
              action={
                <Button to="/app/gates?new=1" variant="secondary">
                  <Plus className="size-4" /> Create a gate
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

function NotVerified() {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">You're not verified yet</h1>
        <p className="mt-3 text-ink-2">Get your credential to join gates, create your own and be recognised by every app that checks UWI.</p>
        <Button to="/start" size="lg" className="mt-8">
          Get verified <ArrowRight className="size-4" />
        </Button>
      </div>
      <HoloCard proof="pending" className="mx-auto w-full max-w-sm" />
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-[1.586] rounded-[20px]" />
        <Skeleton className="h-72 rounded-[20px]" />
      </div>
    </div>
  )
}
