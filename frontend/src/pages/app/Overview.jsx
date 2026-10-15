import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle, Circle, Code, DownloadSimple, Door, Plus, ShareNetwork, Wallet } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/primitives'
import { HoloCard } from '../../components/holo/HoloCard'
import { GateCard } from '../../components/GateCard'
import { CredentialDetails } from '../../components/CredentialDetails'
import { useCredential, useServiceStatus, useStats } from '../../hooks/useCredential'
import { gateState, useMyGates, useRecentGates } from '../../hooks/useGates'
import { useCardActions } from '../../hooks/useCardActions'
import { formatNumber } from '../../lib/format'
import { readJSON, writeJSON } from '../../lib/storage'
import { easeOutExpo } from '../../lib/motion'
import { PageContainer, PageHeader } from '../../components/layout/Page'

export default function Overview() {
  const { address } = useAccount()
  const { status, credential } = useCredential(address)

  if (!address) return <Welcome />
  if (status === 'loading' || status === 'idle') return <OverviewSkeleton />
  if (status === 'none') return <Welcome connected />
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

/**
 * The overview for anyone without a credential yet, connected or not: what UWI
 * is, the live state of the network, the newest gates to look at, and the one
 * next step.
 */
function Welcome({ connected = false }) {
  const { open } = useAppKit()
  const { humans, gates } = useStats()
  const { data: service } = useServiceStatus()
  const { gates: recent, isLoading } = useRecentGates(12)
  const openGates = recent.filter((g) => gateState(g) === 'open')
  const relayer = service?.relayer
  const stats = [
    ['Verified humans', humans !== undefined ? formatNumber(Number(humans)) : null],
    ['Gates', gates !== undefined ? formatNumber(Number(gates)) : null],
    ['Gasless relayer', relayer ? (relayer.configured ? `Online · ${Number(relayer.balance ?? 0).toFixed(0)} HBAR` : 'Offline') : null],
    ['Gas you pay', '$0'],
  ]
  const steps = connected
    ? ['Pick a username', 'Scan your passport with Self', 'Use it in every app']
    : ['Connect a wallet', 'Pick a username', 'Scan your passport with Self']

  return (
    <PageContainer>
      <PageHeader
        title={connected ? "You're not verified yet" : 'Welcome to UWI'}
        description={
          connected
            ? 'Your wallet is connected. Get your credential to join gates, run your own and be recognised everywhere.'
            : 'One private credential that proves you are a unique human, and nothing else.'
        }
        actions={
          !connected && (
            <Button variant="secondary" size="sm" onClick={() => open()}>
              <Wallet className="size-4" /> Connect wallet
            </Button>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="grid items-center gap-10 overflow-hidden rounded-[24px] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">About two minutes</p>
          <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.1] font-semibold tracking-[-0.04em] text-ink">
            Prove you're human once.
            <br />
            <span className="text-ink-2">Use it everywhere.</span>
          </h2>
          <ol className="mt-6 grid gap-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[15px] text-ink-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[11px] text-ink">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button to="/app/verify" size="lg">
              Get verified <ArrowRight className="size-4" />
            </Button>
            <Button to="/app/gates" variant="ghost" size="lg">
              Explore gates
            </Button>
          </div>
        </div>
        <HoloCard proof="pending" className="mx-auto w-full max-w-sm" />
      </motion.div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-surface p-5">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-ink tabular-nums">
              {value ?? <Skeleton className="h-6 w-16" />}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink">Latest gates</h2>
          <p className="mt-0.5 text-sm text-ink-2">Lists anyone verified can join, once.</p>
        </div>
        <Link to="/app/gates" className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-2 hover:text-ink">
          All gates <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {isLoading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 rounded-[20px]" />
          ))}
        </div>
      ) : openGates.length ? (
        <div className="mt-4 grid gap-4 [&>*]:min-w-0 md:grid-cols-2">
          {openGates.slice(0, 4).map((g) => (
            <GateCard key={g.id} gate={g} to={`/g/${g.id}`} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-line-strong">
          <EmptyState icon={Door} title="No open gates right now" body="Once you're verified you can run the first one: an allowlist, waitlist or vote that admits each human once." />
        </div>
      )}

      <Link
        to="/app/developers"
        className="group mt-6 flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface p-5 transition-colors hover:border-line-strong"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Code className="size-5" />
          </span>
          <div>
            <p className="font-medium text-ink">Building an app?</p>
            <p className="text-sm text-ink-2">Check any wallet with one contract call or one GET request.</p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </Link>
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
