import { useReadContract, useReadContracts } from 'wagmi'
import { gates, registry } from '../config/chain'
import { toAddress } from './useCredential'

function shapeGate(id, g) {
  return {
    id: id.toString(),
    creator: g.creator,
    createdAt: Number(g.createdAt) * 1000,
    closesAt: g.closesAt ? Number(g.closesAt) * 1000 : null,
    capacity: g.capacity || null,
    memberCount: g.memberCount,
    strict: g.strict,
    closed: g.closed,
    name: g.name,
    description: g.description,
  }
}

/** open | closed | full | ended: what a visitor can actually do right now. */
export function gateState(gate) {
  if (!gate) return null
  if (gate.closed) return 'closed'
  if (gate.closesAt && Date.now() >= gate.closesAt) return 'ended'
  if (gate.capacity && gate.memberCount >= gate.capacity) return 'full'
  return 'open'
}

export function useGate(id) {
  const gateId = id ? BigInt(id) : undefined
  const q = useReadContract({ ...gates, functionName: 'getGate', args: [gateId], query: { enabled: gateId !== undefined } })
  let status = 'loading'
  if (q.isError) status = q.error?.message?.includes('UnknownGate') ? 'none' : 'error'
  else if (q.data) status = 'found'
  return { status, gate: q.data ? shapeGate(gateId, q.data) : null, refetch: q.refetch }
}

/** Members with their usernames, newest first. */
export function useGateMembers(id, count) {
  const gateId = id ? BigInt(id) : undefined
  const membersQ = useReadContract({
    ...gates,
    functionName: 'members',
    args: [gateId, 0n, 500n],
    query: { enabled: gateId !== undefined && count !== undefined },
  })
  const members = membersQ.data ?? []
  const credsQ = useReadContracts({
    contracts: members.map((m) => ({ ...registry, functionName: 'getCredential', args: [m.tokenId] })),
    query: { enabled: members.length > 0 },
  })

  const rows = members
    .map((m, i) => {
      const c = credsQ.data?.[i]?.result
      return {
        account: m.account,
        tokenId: m.tokenId.toString(),
        joinedAt: Number(m.joinedAt) * 1000,
        username: c?.username ?? null,
        proof: c ? (c.proof === 0 ? 'self' : 'demo') : 'revoked',
      }
    })
    .reverse()

  return { rows, isLoading: membersQ.isLoading || credsQ.isLoading, refetch: membersQ.refetch }
}

/** Gates an account created and joined, with details, for the dashboard. */
export function useMyGates(address) {
  const account = toAddress(address)
  const ids = useReadContracts({
    contracts: [
      { ...gates, functionName: 'gatesCreatedBy', args: [account] },
      { ...gates, functionName: 'gatesJoinedBy', args: [account] },
    ],
    query: { enabled: Boolean(account) },
  })
  const created = ids.data?.[0]?.result ?? []
  const joined = ids.data?.[1]?.result ?? []
  const all = [...new Set([...created, ...joined].map(String))].map(BigInt)

  const details = useReadContracts({
    contracts: all.map((id) => ({ ...gates, functionName: 'getGate', args: [id] })),
    query: { enabled: all.length > 0 },
  })
  const byId = new Map(all.map((id, i) => [id.toString(), details.data?.[i]?.result]))
  const pick = (list) =>
    list
      .map((id) => byId.get(id.toString()) && shapeGate(id, byId.get(id.toString())))
      .filter(Boolean)
      .reverse()

  return {
    created: pick(created),
    joined: pick(joined),
    isLoading: ids.isLoading || (all.length > 0 && details.isLoading),
    refetch: async () => {
      await ids.refetch()
      await details.refetch()
    },
  }
}
