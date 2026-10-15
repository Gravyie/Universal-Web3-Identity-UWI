import NumberFlow from '@number-flow/react'
import { useLiveStats } from '../hooks/useLiveStats'

/** Live numbers from the registry. */
export function HeroProof({ className = '' }) {
  const { humans, gates } = useLiveStats()
  const items = [
    [humans, 'verified humans'],
    [gates, 'sybil-proof gates'],
    [0, 'gas paid by people', '$'],
  ]
  return (
    <ul className={`flex items-end gap-7 ${className}`}>
      {items.map(([v, label, prefix]) => (
        <li key={label}>
          <p className="text-2xl font-semibold tracking-[-0.04em] text-white tabular-nums sm:text-[28px]">
            {v === undefined ? <span className="inline-block h-7 w-8 animate-pulse rounded-md bg-white/10 align-middle" /> : <NumberFlow value={Number(v)} prefix={prefix} />}
          </p>
          <p className="mt-1 text-xs text-white/45">{label}</p>
        </li>
      ))}
    </ul>
  )
}
