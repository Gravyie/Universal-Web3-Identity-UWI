import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowUpRight, DownloadSimple, LinkSimple, LockSimple, MagnifyingGlass, QrCode, UsersThree } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { Badge, CopyButton, EmptyState, Skeleton, useCopy } from '../../components/ui/primitives'
import { useGate, useGateMembers, gateState } from '../../hooks/useGates'
import { useGasless } from '../../hooks/useGasless'
import { JoinsChart } from '../../components/JoinsChart'
import { hueFor } from '../../components/holo/print'
import { formatDate, formatNumber, shortAddress, timeAgo } from '../../lib/format'
import { PageContainer, PageHeader } from '../../components/layout/Page'

export default function GateDetail() {
  const { id } = useParams()
  const { address } = useAccount()
  const { status, gate, refetch } = useGate(id)
  const { rows, isLoading } = useGateMembers(id, gate?.memberCount)
  const { copy } = useCopy()
  const { closeGate } = useGasless()
  const [qr, setQr] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.username?.includes(q) || r.account.toLowerCase().includes(q)) : rows
  }, [rows, query])

  if (status === 'loading') {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-28 rounded-[20px]" />
        <Skeleton className="mt-6 h-64 rounded-[20px]" />
      </PageContainer>
    )
  }
  if (status !== 'found') {
    return <EmptyState title="Gate not found" body="It may have a different id, or the network didn't respond." action={<Button to="/app/gates" variant="secondary">Back to gates</Button>} />
  }

  const isCreator = address && gate.creator.toLowerCase() === address.toLowerCase()
  const state = gateState(gate)
  const shareUrl = `${window.location.origin}/g/${gate.id}`

  const close = async () => {
    setClosing(true)
    try {
      await closeGate(gate.id)
      await refetch()
      toast.success('Gate closed. The list is final.')
      setConfirmClose(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setClosing(false)
    }
  }

  const stats = [
    ['Members', formatNumber(gate.memberCount)],
    ['Spots', gate.capacity ? `${formatNumber(gate.capacity - gate.memberCount)} left` : 'Unlimited'],
    ['Closes', gate.closesAt ? formatDate(gate.closesAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'When you close it'],
    ['Accepts', gate.strict ? 'Self proofs only' : 'Any credential'],
  ]

  return (
    <PageContainer>
      <PageHeader
        back={{ to: '/app/gates', label: 'Gates' }}
        title={gate.name}
        description={gate.description || undefined}
        meta={
          <div className="flex items-center gap-3 text-sm text-muted">
            <Badge tone={state === 'open' ? 'ok' : state === 'full' ? 'warn' : 'neutral'}>{state[0].toUpperCase() + state.slice(1)}</Badge>
            Gate No. {gate.id} created {timeAgo(gate.createdAt)}
          </div>
        }
        actions={
          <>
          <Button size="sm" onClick={() => copy(shareUrl, 'Join link copied')}>
            <LinkSimple className="size-4" /> Copy join link
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setQr(true)}>
            <QrCode className="size-4" /> QR
          </Button>
          <Button size="sm" variant="secondary" href={`/api/v1/gates/${gate.id}?format=csv`} target="_self" download>
            <DownloadSimple className="size-4" /> CSV
          </Button>
          {isCreator && !gate.closed && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmClose(true)}>
              <LockSimple className="size-4" /> Close
            </Button>
          )}
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-surface p-5">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="mt-1 text-lg font-medium tracking-[-0.02em] text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {rows.length > 0 && (
        <div className="mt-6">
          <JoinsChart joins={rows} since={gate.createdAt} capacity={gate.capacity} />
        </div>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-ink">Members</h2>
          <Input
            className="w-full sm:w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by username or address"
            aria-label="Filter members"
            prefix={<MagnifyingGlass className="size-4 text-muted" />}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-surface">
          {isLoading ? (
            <div className="grid gap-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : !rows.length ? (
            <EmptyState
              icon={UsersThree}
              title="No one has joined yet"
              body="Share the join link. Each verified human can join once, and it costs them nothing."
              action={<Button variant="secondary" onClick={() => copy(shareUrl, 'Join link copied')}><LinkSimple className="size-4" /> Copy join link</Button>}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Human</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Wallet</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Proof</th>
                  <th className="px-5 py-3 text-right font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((r) => {
                  const h = hueFor(r.account)
                  return (
                    <tr key={r.tokenId} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="size-7 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, hsl(${h} 70% 82%), hsl(${(h + 50) % 360} 60% 60%))` }} />
                          {r.username ? (
                            <Link to={`/u/${r.username}`} className="font-medium text-ink hover:text-accent">
                              @{r.username}
                            </Link>
                          ) : (
                            <span className="text-muted">Revoked credential</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-[13px] text-ink-2 sm:table-cell">
                        <span className="inline-flex items-center gap-0.5">
                          {shortAddress(r.account, 6, 4)} <CopyButton value={r.account} label="Copy address" message="Address copied" />
                        </span>
                      </td>
                      <td className="hidden px-5 py-3 md:table-cell">
                        <Badge tone={r.proof === 'self' ? 'ok' : r.proof === 'demo' ? 'warn' : 'neutral'}>{r.proof === 'self' ? 'Self' : r.proof === 'demo' ? 'Demo' : 'Revoked'}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-ink-2">{timeAgo(r.joinedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {rows.length > 0 && !filtered.length && <p className="p-5 text-center text-sm text-muted">No members match "{query}".</p>}
        </div>
      </section>

      <Sheet open={qr} onOpenChange={setQr} title="Scan to join" description={gate.name}>
        <div className="grid justify-items-center gap-4">
          <div className="rounded-[20px] bg-white p-4">
            <QRCodeSVG value={shareUrl} size={220} level="M" />
          </div>
          <div className="flex w-full items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-2">{shareUrl}</span>
            <CopyButton value={shareUrl} label="Copy link" message="Join link copied" />
          </div>
          <Button variant="ghost" size="sm" href={shareUrl}>
            Open join page <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={confirmClose}
        onOpenChange={(o) => !closing && setConfirmClose(o)}
        title="Close this gate?"
        description="No one else will be able to join. The current list of members becomes final. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClose(false)} disabled={closing}>
            Keep open
          </Button>
          <Button variant="danger" onClick={close} loading={closing}>
            Close gate
          </Button>
        </div>
      </Sheet>
    </PageContainer>
  )
}
