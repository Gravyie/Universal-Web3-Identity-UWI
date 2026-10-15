import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle, Circle, DownloadSimple, Door, Plus, ShareNetwork } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/primitives'
import { HoloCard } from '../../components/holo/HoloCard'
import { GateCard } from '../../components/GateCard'
import { CredentialDetails } from '../../components/CredentialDetails'
import { useCredential, useStats } from '../../hooks/useCredential'
import { useMyGates } from '../../hooks/useGates'
import { useCardActions } from '../../hooks/useCardActions'
import { formatNumber } from '../../lib/format'
import { readJSON, writeJSON } from '../../lib/storage'
import { easeOutExpo } from '../../lib/motion'
import { PageContainer, PageHeader } from '../../components/layout/Page'

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

function Verified({ credential, address }) {
  const cardRef = useRef(null)
  const { save, share, saving } = useCardActions(cardRef, credential.username)
  const [shared, setShared] = useState(() => readJSON(`uwi:shared:${address}`, false))
  const markShared = () => {
    setShared(true)
    writeJSON(`uwi:shared:${address}`, true)
  }
  const { created, joined, isLoading } = useMyGates(address)
  const { humans, gates } = useStats()
  const recent = [...created.map((g) => ({ ...g, mine: true })), ...joined].slice(0, 4)

  return (
    <PageContainer>
      <PageHeader
        title={`Hi, @${credential.username}`}
        description="Your credential, and the gates you run and belong to."
        actions={
          <Button to="/app/gates?new=1" size="sm">
            <Plus className="size-4" /> New gate
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                markShared()
                share()
              }}
            >
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

      <SetupChecklist
        credential={credential}
        created={created.length}
        joined={joined.length}
        onShare={() => {
          markShared()
          share()
        }}
        shared={shared}
        humans={humans}
      />

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
    </PageContainer>
  )
}

function NotVerified() {
  return (
    <PageContainer>
      <PageHeader title="Overview" description="Get your credential to join gates, create your own and be recognised by every app that checks UWI." />
      <div className="grid items-center gap-10 rounded-[20px] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">You're not verified yet</h2>
          <p className="mt-2 text-ink-2">Connect, pick a username and prove you're one person. About two minutes.</p>
          <Button to="/app/verify" size="lg" className="mt-6">
            Get verified <ArrowRight className="size-4" />
          </Button>
        </div>
        <HoloCard proof="pending" className="mx-auto w-full max-w-sm" />
      </div>
    </PageContainer>
  )
}

function OverviewSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="mb-8 h-9 w-56" />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-[1.586] rounded-[20px]" />
        <Skeleton className="h-72 rounded-[20px]" />
      </div>
    </PageContainer>
  )
}

/** The few things that make UWI useful, with real completion state. Hidden once done. */
function SetupChecklist({ credential, created, joined, shared, onShare, humans }) {
  const items = [
    { done: true, title: 'Get verified', body: `You hold credential No. ${credential.tokenId}.` },
    {
      done: credential.proof === 'self',
      title: 'Back it with a passport proof',
      body: 'Demo credentials fail strict checks. Revoke it in Settings, then verify with Self.',
      action: <Link to="/app/settings" className="text-sm font-medium text-accent hover:underline">Settings</Link>,
    },
    {
      done: created > 0,
      title: 'Create your first gate',
      body: 'A list that admits each verified human once.',
      action: <Link to="/app/gates?new=1" className="text-sm font-medium text-accent hover:underline">Create</Link>,
    },
    {
      done: joined > 0,
      title: 'Join a gate',
      body: 'When a project shares a UWI gate link, joining takes one signature.',
    },
    {
      done: shared,
      title: 'Share your profile',
      body: 'Let others check you are a verified human.',
      action: <button type="button" onClick={onShare} className="text-sm font-medium text-accent hover:underline">Share</button>,
    },
  ]
  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <section className="mt-6 rounded-[20px] border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-medium text-ink">Get set up</h2>
          <p className="mt-0.5 text-sm text-muted">
            {doneCount} of {items.length} done
            {humans !== undefined && ` · ${formatNumber(Number(humans))} verified humans on UWI`}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {items.map((it, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${it.done ? 'bg-accent' : 'bg-line-strong'}`} />
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {items.map((it) => (
          <li key={it.title} className="flex items-center gap-4 px-5 py-3.5">
            {it.done ? (
              <CheckCircle weight="fill" className="size-5 shrink-0 text-accent" aria-label="Done" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted" aria-label="To do" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${it.done ? 'text-muted line-through' : 'text-ink'}`}>{it.title}</p>
              {!it.done && <p className="text-[13px] text-ink-2">{it.body}</p>}
            </div>
            {!it.done && it.action}
          </li>
        ))}
      </ul>
    </section>
  )
}
