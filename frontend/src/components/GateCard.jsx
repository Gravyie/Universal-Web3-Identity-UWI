import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, Infinity as InfinityIcon, LockSimple, SealCheck, UsersThree } from '@phosphor-icons/react'
import { Badge } from './ui/primitives'
import { gateState } from '../hooks/useGates'
import { hueFor } from './holo/print'
import { formatNumber, timeAgo } from '../lib/format'

const STATE_BADGE = {
  open: { tone: 'ok', label: 'Open' },
  closed: { tone: 'neutral', label: 'Closed' },
  ended: { tone: 'neutral', label: 'Ended' },
  full: { tone: 'warn', label: 'Full' },
}

/** Stacked member dots: deterministic colour per member, so lists look alive without photos. */
export function MemberStack({ seeds = [], total = 0 }) {
  if (!total) return null
  return (
    <div className="flex items-center">
      {seeds.slice(0, 5).map((s, i) => {
        const h = hueFor(s)
        return (
          <span
            key={s + i}
            className="-ml-1.5 size-6 rounded-full ring-2 ring-surface first:ml-0"
            style={{ background: `linear-gradient(135deg, hsl(${h} 70% 80%), hsl(${(h + 50) % 360} 60% 58%))` }}
          />
        )
      })}
      {total > 5 && <span className="ml-2 text-xs text-muted">+{formatNumber(total - 5)}</span>}
    </div>
  )
}

export function GateCard({ gate, to, memberSeeds, mine }) {
  const state = gateState(gate)
  const badge = STATE_BADGE[state]
  const spots = gate.capacity ? `${formatNumber(gate.memberCount)} of ${formatNumber(gate.capacity)}` : formatNumber(gate.memberCount)
  const Body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-ink">{gate.name}</h3>
            {mine && <Badge tone="accent">Yours</Badge>}
          </div>
          {gate.description && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{gate.description}</p>}
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <UsersThree className="size-3.5" /> {spots} {gate.memberCount === 1 && !gate.capacity ? 'human' : 'humans'}
        </span>
        {gate.closesAt ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {Date.now() < gate.closesAt ? `Closes ${timeAgo(gate.closesAt)}` : 'Ended'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <InfinityIcon className="size-3.5" /> No deadline
          </span>
        )}
        {gate.strict && (
          <span className="inline-flex items-center gap-1.5">
            <SealCheck className="size-3.5" /> Self proofs only
          </span>
        )}
        {state === 'closed' && (
          <span className="inline-flex items-center gap-1.5">
            <LockSimple className="size-3.5" /> Locked list
          </span>
        )}
      </div>
      {memberSeeds && (
        <div className="mt-5 flex items-center justify-between">
          <MemberStack seeds={memberSeeds} total={gate.memberCount} />
          {to && <ArrowUpRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
        </div>
      )}
    </>
  )

  const cls = 'group block rounded-[20px] border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-card'
  return to ? (
    <Link to={to} className={cls}>
      {Body}
    </Link>
  ) : (
    <div className={cls}>{Body}</div>
  )
}
