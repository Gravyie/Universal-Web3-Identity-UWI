import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDate, formatNumber } from '../lib/format'

const H = 168
const PAD = { top: 16, right: 44, bottom: 26, left: 32 }

function useWidth(ref) {
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function niceMax(v) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / p) * p
}

/**
 * Cumulative members over time, as a step area. One series, so no legend: the
 * title names it and the end value is labelled directly. The member table
 * below the chart is its table view.
 */
export function JoinsChart({ joins, since, capacity }) {
  const ref = useRef(null)
  const width = useWidth(ref)
  const [hover, setHover] = useState(null)

  const series = useMemo(() => {
    const times = joins.map((j) => j.joinedAt).sort((a, b) => a - b)
    const start = Math.min(since, times[0] ?? since)
    const end = Math.max(Date.now(), times.at(-1) ?? 0)
    return { start, end, points: times.map((t, i) => ({ t, n: i + 1 })) }
  }, [joins, since])

  const total = series.points.length
  const yMax = niceMax(Math.max(total, 1))
  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const span = Math.max(1, series.end - series.start)
  const x = (t) => PAD.left + ((t - series.start) / span) * innerW
  const y = (n) => PAD.top + innerH - (n / yMax) * innerH

  // Step-after path: flat until each join, then up by one.
  let line = `M${x(series.start)} ${y(0)}`
  for (const p of series.points) line += `H${x(p.t)}V${y(p.n)}`
  line += `H${x(series.end)}`
  const area = `${line}V${y(0)}H${x(series.start)}Z`

  const ticks = [0, yMax / 2, yMax]

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const t = series.start + ((px - PAD.left) / innerW) * span
    if (t < series.start || t > series.end) return setHover(null)
    const n = series.points.filter((p) => p.t <= t).length
    setHover({ t, n, px: x(t) })
  }

  const last = series.points.at(-1)

  return (
    <div className="rounded-[20px] border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-medium text-ink">Joins over time</h2>
        <p className="text-sm text-muted">
          {formatNumber(total)} {total === 1 ? 'human' : 'humans'}
          {capacity ? ` of ${formatNumber(capacity)} spots` : ''}
        </p>
      </div>

      <div ref={ref} className="relative mt-4">
        <svg
          width={width}
          height={H}
          className="block"
          role="img"
          aria-label={`${total} members joined between ${formatDate(series.start)} and ${formatDate(series.end)}. The member table below lists every join.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {formatNumber(t)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} className="fill-muted text-[11px]">
            {formatDate(series.start, { month: 'short', day: 'numeric' })}
          </text>
          <text x={width - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[11px]">
            Now
          </text>

          <path d={area} fill="var(--chart)" fillOpacity="0.12" />
          <path d={line} fill="none" stroke="var(--chart)" strokeWidth="2" strokeLinejoin="round" />

          {last && !hover && (
            <>
              <circle cx={x(series.end)} cy={y(last.n)} r="4" fill="var(--chart)" stroke="var(--surface)" strokeWidth="2" />
              <text x={x(series.end) + 8} y={y(last.n)} dy="0.32em" className="fill-ink font-mono text-[11px] font-medium">
                {formatNumber(last.n)}
              </text>
            </>
          )}

          {hover && (
            <>
              <line x1={hover.px} x2={hover.px} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--line-strong)" strokeWidth="1" />
              <circle cx={hover.px} cy={y(hover.n)} r="4" fill="var(--chart)" stroke="var(--surface)" strokeWidth="2" />
            </>
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[12px] border border-line-strong bg-bg-elev px-3 py-2 text-xs shadow-card"
            style={{ left: Math.min(Math.max(hover.px, 70), width - 70) }}
          >
            <div className="font-medium text-ink">
              {formatNumber(hover.n)} {hover.n === 1 ? 'human' : 'humans'}
            </div>
            <div className="text-muted">{formatDate(hover.t, { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
        )}
      </div>
    </div>
  )
}
