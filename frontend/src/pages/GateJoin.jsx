import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useReadContract } from 'wagmi'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { CheckCircle, Circle, Door, SealCheck, XCircle } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { EmptyState, Skeleton } from '../components/ui/primitives'
import { GateCard } from '../components/GateCard'
import { useCredential } from '../hooks/useCredential'
import { gateState, useGate, useGateMembers } from '../hooks/useGates'
import { useGasless } from '../hooks/useGasless'
import { gates } from '../config/chain'
import { formatNumber } from '../lib/format'

function Check({ ok, pending, children }) {
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
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { status, gate } = useGate(id)
  const { rows } = useGateMembers(id, gate?.memberCount)
  const { credential, status: credStatus } = useCredential(address)
  const joinedQ = useReadContract({ ...gates, functionName: 'hasJoined', args: [id ? BigInt(id) : undefined, address], query: { enabled: Boolean(address && id) } })
  const { joinGate } = useGasless()
  const [busy, setBusy] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="mt-6 h-48 rounded-[20px]" />
      </div>
    )
  }
  if (status !== 'found') {
    return <EmptyState icon={Door} title="Gate not found" body="Check the link with whoever shared it." action={<Button to="/">Go home</Button>} />
  }

  const state = gateState(gate)
  const joined = joinedQ.data === true
  const hasCred = credStatus === 'found'
  const strictOk = !gate.strict || credential?.proof === 'self'
  const canJoin = isConnected && hasCred && strictOk && state === 'open' && !joined

  const join = async () => {
    setBusy(true)
    try {
      await joinGate(gate.id)
      setJustJoined(true)
      toast.success(`You're on ${gate.name}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  let action
  if (!isConnected) action = <Button size="lg" variant="ink" className="w-full" onClick={() => open()}>Connect wallet</Button>
  else if (joined) action = null
  else if (credStatus === 'none') action = <Button size="lg" to="/start" className="w-full">Get verified to join</Button>
  else if (!strictOk) action = <Button size="lg" to="/start" variant="secondary" className="w-full">Verify with Self to join</Button>
  else if (state !== 'open') action = <Button size="lg" disabled className="w-full">This gate is {state}</Button>
  else action = <Button size="lg" className="w-full" onClick={join} loading={busy} disabled={!canJoin}>{busy ? 'Joining...' : 'Join with one signature'}</Button>

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <p className="text-sm text-muted">You've been invited to a UWI gate</p>
      <div className="mt-4">
        <GateCard gate={gate} memberSeeds={rows.map((r) => r.account)} />
      </div>

      <AnimatePresence mode="wait">
        {joined || justJoined ? (
          <motion.div
            key="joined"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="mt-6 rounded-[20px] border border-ok/30 bg-ok/8 p-6 text-center"
          >
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }} className="inline-grid size-12 place-items-center rounded-full bg-ok text-white">
              <SealCheck weight="fill" className="size-6" />
            </motion.span>
            <h1 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink">You're on the list</h1>
            <p className="mt-1 text-sm text-ink-2">
              One of {formatNumber(gate.memberCount)} verified humans. Nothing else to do.
            </p>
            <Link to="/app/gates" className="mt-4 inline-block text-sm text-accent hover:underline">
              See all your gates
            </Link>
          </motion.div>
        ) : (
          <motion.div key="checks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-[20px] border border-line bg-surface p-5">
            <h2 className="text-sm font-medium text-ink">To join</h2>
            <ul className="mt-2 divide-y divide-line">
              <Check ok={isConnected} pending={!isConnected}>Connect a wallet</Check>
              <Check ok={hasCred} pending={!isConnected || credStatus === 'loading'}>Hold a UWI credential</Check>
              {gate.strict && (
                <Check ok={strictOk} pending={!hasCred}>Credential backed by a Self passport proof</Check>
              )}
              <Check ok={state === 'open'}>Gate is open</Check>
            </ul>
            <div className="mt-5">{action}</div>
            <p className="mt-3 text-center text-xs text-muted">Free. You sign a message; UWI pays the network fee.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
