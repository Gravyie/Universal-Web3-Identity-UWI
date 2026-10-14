// Gas relayer for signature-based actions. Users sign EIP-712 messages in
// their wallet; we submit them. The contracts check every signature, so the
// relayer can't act on anyone's behalf — it only pays the gas.
import { getAddress, isAddress, isHex } from 'viem'
import { ApiError, gates, registry, sendAsAttestor } from './_lib/chain.js'
import { body, route } from './_lib/http.js'

const big = (v, name) => {
  try {
    return BigInt(v)
  } catch {
    throw new ApiError(400, 'BadRequest', `Invalid ${name}.`)
  }
}
const addr = (v, name) => {
  if (!isAddress(v ?? '', { strict: false })) throw new ApiError(400, 'BadRequest', `Invalid ${name}.`)
  return getAddress(v.toLowerCase())
}

const ACTIONS = {
  join: ({ gateId, account, deadline, signature }) => [
    gates,
    'joinBySig',
    [big(gateId, 'gateId'), addr(account, 'account'), big(deadline, 'deadline'), signature],
  ],
  createGate: ({ creator, params, deadline, signature }) => [
    gates,
    'createGateBySig',
    [
      addr(creator, 'creator'),
      {
        name: String(params?.name ?? ''),
        description: String(params?.description ?? ''),
        closesAt: big(params?.closesAt ?? 0, 'closesAt'),
        capacity: Number(params?.capacity ?? 0),
        strict: Boolean(params?.strict),
      },
      big(deadline, 'deadline'),
      signature,
    ],
  ],
  closeGate: ({ gateId, creator, deadline, signature }) => [
    gates,
    'closeBySig',
    [big(gateId, 'gateId'), addr(creator, 'creator'), big(deadline, 'deadline'), signature],
  ],
  revoke: ({ tokenId, deadline, signature }) => [
    registry,
    'revokeBySig',
    [big(tokenId, 'tokenId'), big(deadline, 'deadline'), signature],
  ],
}

export default route(['POST'], async (req, res) => {
  const { action, ...payload } = body(req)
  const build = ACTIONS[action]
  if (!build) throw new ApiError(400, 'UnknownAction', `action must be one of: ${Object.keys(ACTIONS).join(', ')}`)
  if (!isHex(payload.signature ?? '')) throw new ApiError(400, 'BadRequest', 'Missing signature.')

  const [contract, fn, args] = build(payload)
  const { hash, result } = await sendAsAttestor(contract, fn, args)
  return res.status(200).json({ txHash: hash, result: result === undefined ? null : result.toString() })
})
