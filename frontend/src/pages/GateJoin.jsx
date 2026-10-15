import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useReadContract } from 'wagmi'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle, Circle, Clock, Door, Infinity as InfinityIcon, SealCheck, UsersThree, XCircle } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { Badge, EmptyState, Skeleton } from '../components/ui/primitives'
import { HoloCard } from '../components/holo/HoloCard'
import { MemberStack } from '../components/GateCard'
import { useCredential } from '../hooks/useCredential'
import { gateState, useGate, useGateMembers } from '../hooks/useGates'
import { useGasless } from '../hooks/useGasless'
import { gates } from '../config/chain'
import { formatDate, formatNumber, timeAgo } from '../lib/format'
import { easeOutExpo } from '../lib/motion'

const STATE = {
  open: { tone: 'ok', label: 'Open' },
  closed: { tone: 'neutral', label: 'Closed' },
  ended: { tone: 'neutral', label: 'Ended' },
  full: { tone: 'warn', label: 'Full' },
}

function Requirement({ ok, pending, children }) {
  const Icon = pending ? Circle : ok ? CheckCircle : XCircle
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <Icon weight={pending ? 'regular' : 'fill'} className={`size-5 shrink-0 ${pending ? 'text-muted' : ok ? 'text-ok' : 'text-danger'}`} />
      <span className={pending ? 'text-muted' : 'text-ink'}>{children}</span>
    </li>
  )
}

export default function GateJoin() {
  const { id } = useParams()
  const { status, gate } = useGate(id)
  const { rows } = useGateMembers(id, gate?.memberCount)

  if (status === 'loading') {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-12 w-3/4" />
          <Skeleton className="mt-4 h-5 w-2/3" />
        </div>
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    )
  }
  if (status !== 'found') {
    return <EmptyState icon={Door} title="Gate not found" body="Check the link with whoever shared it." action={<Button to="/">Go home</Button>} />
  }
  return <Gate gate={gate} rows={rows} />
}

function Gate({ gate, rows }) {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { credential, status: credStatus } = useCredential(address)
  const { credential: host } = useCredential(gate.creator)
  const joinedQ = useReadContract({
    ...gates,
    functionName: 'hasJoined',
    args: [BigInt(gate.id), address],
    query: { enabled: Boolean(address) },
  })
  const { joinGate } = useGasless()
  const [busy, setBusy] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  const state = gateState(gate)
  const joined = joinedQ.data === true || justJoined
  const hasCred = credStatus === 'found'
  const strictOk = !gate.strict || credential?.proof === 'self'
  const position = address ? rows.length - rows.findIndex((r) => r.account.toLowerCase() === address.toLowerCase()) : null

  const join = async () => {
    setBusy(true)
    try {
      await joinGate(gate.id)
      setJustJoined(true)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  let action
  if (!isConnected) action = <Button size="lg" variant="ink" className="w-full" onClick={() => open()}>Connect wallet</Button>
  else if (credStatus === 'none') action = <Button size="lg" to="/start" className="w-full">Get verified to join</Button>
  else if (hasCred && !strictOk) action = <Button size="lg" to="/start" variant="secondary" className="w-full">Needs a Self passport proof</Button>
  else if (state !== 'open') action = <Button size="lg" disabled className="w-full">This gate is {state}</Button>
  else action = <Button size="lg" className="w-full" onClick={join} loading={busy} disabled={!hasCred}>{busy ? 'Joining...' : 'Join with one signature'}</Button>

  const s = STATE[state]

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: 'radial-gradient(60% 100% at 20% 0%, var(--accent-soft), transparent 70%)' }}
      />
      <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOutExpo }}>
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <Door className="size-4" />
            {host ? (
              <span>
                Hosted by{' '}
                <Link to={`/u/${host.username}`} className="font-medium text-ink hover:text-accent">
                  @{host.username}
                </Link>
              </span>
            ) : (
              <span>UWI gate</span>
            )}
            <Badge tone={s.tone}>{s.label}</Badge>
          </div>
          <h1 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-balance break-words text-ink">
            {gate.name}
          </h1>
          {gate.description && <p className="mt-4 max-w-xl text-lg text-ink-2">{gate.description}</p>}

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-1.5 text-sm text-muted"><UsersThree className="size-4" /> Joined</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink tabular-nums">
                {formatNumber(gate.memberCount)}
                {gate.capacity ? <span className="text-base font-normal text-muted"> / {formatNumber(gate.capacity)}</span> : null}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-sm text-muted">{gate.closesAt ? <Clock className="size-4" /> : <InfinityIcon className="size-4" />} Closes</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">
                {gate.closesAt ? (Date.now() < gate.closesAt ? timeAgo(gate.closesAt) : 'Ended') : 'No deadline'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-sm text-muted"><SealCheck className="size-4" /> Accepts</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">{gate.strict ? 'Self proofs' : 'Any credential'}</dd>
            </div>
          </dl>

          {rows.length > 0 && (
            <div className="mt-8 flex items-center gap-3">
              <MemberStack seeds={rows.map((r) => r.account)} total={gate.memberCount} />
              <span className="text-sm text-muted">Latest joined {timeAgo(rows[0].joinedAt)}</span>
            </div>
          )}
          <p className="mt-10 max-w-md text-sm text-muted">
            Each verified human can join once, from any wallet. Created {formatDate(gate.createdAt)}.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeOutExpo }}
          className="rounded-[20px] border border-line-strong bg-bg-elev p-5 shadow-card sm:p-6"
        >
          <AnimatePresence mode="wait" initial={false}>
            {joined ? (
              <motion.div key="joined" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }} className="text-center">
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }} className="inline-grid size-14 place-items-center rounded-full bg-ok text-white">
                  <SealCheck weight="fill" className="size-7" />
                </motion.span>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink">You're on the list</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {position && position > 0 ? `Human No. ${formatNumber(position)} on this gate.` : 'Your spot is recorded on-chain.'} Nothing else to do.
                </p>
                <Button to="/app/gates" variant="secondary" className="mt-6">
                  Your gates <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-medium text-ink">{hasCred ? "You'll join as" : 'Join this gate'}</p>
                {hasCred && (
                  <HoloCard
                    className="mt-3"
                    username={credential.username}
                    address={address}
                    tokenId={credential.tokenId}
                    issuedAt={credential.issuedAt}
                    proof={credential.proof}
                  />
                )}
                <ul className="mt-3 divide-y divide-line">
                  <Requirement ok={isConnected} pending={!isConnected}>Connect a wallet</Requirement>
                  <Requirement ok={hasCred} pending={!isConnected || credStatus === 'loading'}>Hold a UWI credential</Requirement>
                  {gate.strict && <Requirement ok={strictOk} pending={!hasCred}>Credential backed by a Self passport proof</Requirement>}
                  <Requirement ok={state === 'open'}>Gate is open</Requirement>
                </ul>
                <div className="mt-5">{action}</div>
                <p className="mt-3 text-center text-xs text-muted">Free. You sign a message and UWI pays the network fee.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
