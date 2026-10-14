// GET /api/v1/gates/:id            → gate details + every member (JSON)
// GET /api/v1/gates/:id?format=csv → the member list as a CSV download
import { publicClient, gates, registry } from '../../_lib/chain.js'
import { route } from '../../_lib/http.js'

const PAGE = 200n

export default route(['GET'], async (req, res) => {
  const id = BigInt(String(req.query.id ?? '0').replace(/\D/g, '') || '0')
  const gate = await publicClient.readContract({ ...gates, functionName: 'getGate', args: [id] })

  const members = []
  for (let offset = 0n; offset < BigInt(gate.memberCount); offset += PAGE) {
    members.push(...(await publicClient.readContract({ ...gates, functionName: 'members', args: [id, offset, PAGE] })))
  }

  // Resolve usernames in one multicall-free batch (Hedera's RPC has no multicall3 by default).
  const credentials = await Promise.all(
    members.map((m) => publicClient.readContract({ ...registry, functionName: 'getCredential', args: [m.tokenId] }).catch(() => null)),
  )
  const rows = members.map((m, i) => ({
    address: m.account,
    tokenId: m.tokenId.toString(),
    username: credentials[i]?.username ?? null,
    proof: credentials[i] ? (credentials[i].proof === 0 ? 'self' : 'demo') : 'revoked',
    joinedAt: new Date(Number(m.joinedAt) * 1000).toISOString(),
  }))

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60')

  if (req.query.format === 'csv') {
    const csv = ['address,username,token_id,proof,joined_at', ...rows.map((r) => [r.address, r.username ?? '', r.tokenId, r.proof, r.joinedAt].join(','))]
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="uwi-gate-${id}.csv"`)
    return res.status(200).send(csv.join('\n'))
  }

  return res.status(200).json({
    id: id.toString(),
    name: gate.name,
    description: gate.description,
    creator: gate.creator,
    createdAt: new Date(Number(gate.createdAt) * 1000).toISOString(),
    closesAt: gate.closesAt ? new Date(Number(gate.closesAt) * 1000).toISOString() : null,
    capacity: gate.capacity || null,
    strict: gate.strict,
    closed: gate.closed,
    memberCount: gate.memberCount,
    members: rows,
  })
})
