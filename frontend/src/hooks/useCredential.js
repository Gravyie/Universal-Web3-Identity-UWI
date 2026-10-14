import { useReadContract, useReadContracts } from 'wagmi'
import { getAddress, isAddress, zeroAddress } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { gates, registry } from '../config/chain'
import { api } from '../lib/api'

const PROOFS = ['self', 'demo']

export const toAddress = (value) =>
  value && isAddress(value, { strict: false }) ? getAddress(value.toLowerCase()) : undefined

function shapeCredential(tokenId, c) {
  if (!tokenId || tokenId === 0n) return null
  return {
    tokenId: tokenId.toString(),
    username: c.username,
    issuedAt: Number(c.issuedAt) * 1000,
    updatedAt: Number(c.updatedAt) * 1000,
    proof: PROOFS[c.proof] ?? 'self',
    nullifier: c.nullifier,
  }
}

/**
 * A wallet's credential, straight from the registry.
 * status: idle | loading | none | found | error
 */
export function useCredential(address) {
  const account = toAddress(address)
  const q = useReadContract({
    ...registry,
    functionName: 'credentialOf',
    args: [account],
    query: { enabled: Boolean(account), refetchInterval: (query) => (query.state.data?.[0] ? false : 15_000) },
  })

  const credential = q.data ? shapeCredential(q.data[0], q.data[1]) : null
  let status = 'idle'
  if (account) {
    if (q.isError) status = 'error'
    else if (q.isLoading) status = 'loading'
    else status = credential ? 'found' : 'none'
  }
  return { status, credential, address: account, refetch: q.refetch, error: q.error }
}

/** Resolves "0x…" or a username to a holder address. */
export function useResolve(handle) {
  const direct = toAddress(handle)
  const name = !direct && handle ? handle.toLowerCase().replace(/^@/, '') : undefined
  const q = useReadContract({
    ...registry,
    functionName: 'resolveUsername',
    args: [name],
    query: { enabled: Boolean(name) },
  })
  if (direct) return { address: direct, status: 'found' }
  if (!name) return { address: undefined, status: 'idle' }
  if (q.isLoading) return { address: undefined, status: 'loading' }
  if (q.isError) return { address: undefined, status: 'error' }
  const holder = q.data?.[0]
  return holder && holder !== zeroAddress ? { address: holder, status: 'found' } : { address: undefined, status: 'none' }
}

export function useUsernameAvailable(name, enabled) {
  return useReadContract({
    ...registry,
    functionName: 'usernameAvailable',
    args: [name],
    query: { enabled: Boolean(enabled && name), staleTime: 5_000 },
  })
}

/** Network-wide counters for the landing page and dashboard. */
export function useStats() {
  const q = useReadContracts({
    contracts: [
      { ...registry, functionName: 'humanCount' },
      { ...gates, functionName: 'gateCount' },
    ],
    query: { refetchInterval: 30_000 },
  })
  return {
    humans: q.data?.[0]?.result,
    gates: q.data?.[1]?.result,
    isLoading: q.isLoading,
  }
}

/** Relayer health and which verification paths this deployment offers. */
export function useServiceStatus() {
  return useQuery({ queryKey: ['status'], queryFn: api.status, staleTime: 30_000, retry: 0 })
}
