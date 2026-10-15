import { useEffect, useState } from 'react'
import { GATES_ADDRESS, REGISTRY_ADDRESS, RPC_URL } from '../config/addresses'

// humanCount() and gateCount() selectors
const CALLS = [
  [REGISTRY_ADDRESS, '0xcad07a06'],
  [GATES_ADDRESS, '0x6b227d00'],
]

async function read() {
  const body = CALLS.map(([to, data], id) => ({ jsonrpc: '2.0', id, method: 'eth_call', params: [{ to, data }, 'latest'] }))
  const res = await fetch(RPC_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const out = await res.json()
  const byId = Object.fromEntries(out.map((r) => [r.id, r.result ? Number(BigInt(r.result)) : undefined]))
  return { humans: byId[0], gates: byId[1] }
}

/**
 * Live registry counts with one batched JSON-RPC request and no wallet
 * libraries, so the landing page can show them before the wallet stack loads.
 */
export function useLiveStats() {
  const [stats, setStats] = useState({})
  useEffect(() => {
    let alive = true
    const load = () => read().then((s) => alive && setStats(s), () => {})
    load()
    const t = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])
  return stats
}
