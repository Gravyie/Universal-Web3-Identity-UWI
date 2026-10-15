import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { ArrowClockwise } from '@phosphor-icons/react'
import { useAccount } from 'wagmi'
import { useCredential } from '../../hooks/useCredential'

function colorJson(json) {
  return json.split(/("(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?)/g).map((t, i) => {
    if (i % 2 === 0) return t
    if (/^".*"$/.test(t) && json.includes(`${t}:`)) return <span key={i} className="text-sky-300">{t}</span>
    if (t.startsWith('"')) return <span key={i} className="text-emerald-300">{t}</span>
    if (t === 'true') return <span key={i} className="text-emerald-300">{t}</span>
    if (t === 'false' || t === 'null') return <span key={i} className="text-rose-300">{t}</span>
    return <span key={i} className="text-amber-200">{t}</span>
  })
}

/**
 * A terminal that types a real request and prints the real response from
 * /api/v1/humans. Pick a sample, or it uses your own handle when connected.
 */
export function LiveTerminal() {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, margin: '-100px' })
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const { credential } = useCredential(address)
  const samples = [...new Set([credential?.username, 'ada_lovelace', 'nobody_here'].filter(Boolean))]
  const [target, setTarget] = useState('ada_lovelace')
  const [typed, setTyped] = useState('')
  const [res, setRes] = useState(null)
  const [run, setRun] = useState(0)

  const command = `curl ${window.location.host}/api/v1/humans/${target}`

  useEffect(() => {
    if (!seen) return
    let cancelled = false
    setRes(null)
    setTyped('')
    const go = async () => {
      if (reduce) setTyped(command)
      else {
        for (let i = 1; i <= command.length; i++) {
          if (cancelled) return
          setTyped(command.slice(0, i))
          await new Promise((r) => setTimeout(r, 14))
        }
      }
      const t0 = performance.now()
      try {
        const r = await fetch(`/api/v1/humans/${encodeURIComponent(target)}`)
        const body = await r.json()
        if (!cancelled) setRes({ status: r.status, ms: Math.round(performance.now() - t0), body })
      } catch {
        if (!cancelled) setRes({ status: 0, ms: 0, body: { error: 'network unavailable' } })
      }
    }
    go()
    return () => {
      cancelled = true
    }
  }, [seen, target, run, command, reduce])

  return (
    <div ref={ref} className="overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="ml-2 font-mono text-xs text-zinc-500">live request, Hedera testnet</span>
        <button type="button" onClick={() => setRun((n) => n + 1)} className="ml-auto grid size-7 place-items-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Run again">
          <ArrowClockwise className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-zinc-900 px-4 py-2.5">
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTarget(s)}
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${target === s ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
          >
            @{s}
            {s === credential?.username ? ' (you)' : ''}
          </button>
        ))}
      </div>
      <pre className="min-h-[300px] overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75]">
        <span className="text-zinc-500">$ </span>
        {typed}
        {!res && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-zinc-300" />}
        {res && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block">
            <span className="mt-3 block text-zinc-500">
              {res.status ? `HTTP ${res.status}` : 'error'} {res.ms ? `in ${res.ms} ms` : ''}
            </span>
            <span className="block">{colorJson(JSON.stringify(res.body, null, 2))}</span>
          </motion.span>
        )}
      </pre>
    </div>
  )
}
