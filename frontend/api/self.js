// Self's relayer POSTs the user's zero-knowledge proof here. We verify it,
// then act on the registry as the attestor:
//   new human            → issue a credential to the wallet that proved
//   known human, new wallet → recover: move their credential to this wallet
// The Self app expects { status, result, reason } with HTTP 200 either way.
import { AllIds, DefaultConfigStore, SelfBackendVerifier } from '@selfxyz/core'
import { getAddress, hexToString, isHex, toHex } from 'viem'
import { PROOF } from '../src/config/abi.js'
import { config, explain, publicClient, registry, sendAsAttestor } from './_lib/chain.js'
import { body, cors } from './_lib/http.js'

// Must match `selfConfig.disclosures` in src/config/self.js.
const verifier = config.self.endpoint
  ? new SelfBackendVerifier(
      config.self.scope,
      config.self.endpoint,
      config.self.endpointType.startsWith('staging'),
      AllIds,
      new DefaultConfigStore({ minimumAge: 18, excludedCountries: [], ofac: false }),
      'hex',
    )
  : null

const fail = (res, reason) => res.status(200).json({ status: 'error', result: false, reason })

/** userDefinedData arrives hex-encoded; the frontend sends `uwi:<username>`. */
export function usernameFrom(userDefinedData) {
  let text = userDefinedData ?? ''
  const hex = text.startsWith('0x') ? text : `0x${text}`
  if (isHex(hex) && hex.length > 2) text = hexToString(hex).replace(/\0/g, '')
  const match = text.match(/uwi:([a-z0-9_]{3,24})/)
  return match?.[1] ?? null
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', result: false, reason: 'Method not allowed' })
  if (!verifier) return fail(res, 'Self verification is not configured on this deployment.')

  const { attestationId, proof, publicSignals, userContextData } = body(req)
  if (!attestationId || !proof || !publicSignals || !userContextData) {
    return fail(res, 'Missing proof, publicSignals, attestationId or userContextData.')
  }

  try {
    const result = await verifier.verify(attestationId, proof, publicSignals, userContextData)
    const { isValid, isMinimumAgeValid } = result.isValidDetails
    if (!isValid) return fail(res, 'The proof is not valid.')
    if (!isMinimumAgeValid) return fail(res, 'You must be 18 or older.')

    const wallet = getAddress(result.userData.userIdentifier)
    const nullifier = toHex(BigInt(result.discloseOutput.nullifier), { size: 32 })
    const existing = await publicClient.readContract({ ...registry, functionName: 'tokenOfNullifier', args: [nullifier] })

    if (existing !== 0n) {
      const holder = await publicClient.readContract({ ...registry, functionName: 'ownerOf', args: [existing] })
      if (holder === wallet) return res.status(200).json({ status: 'success', result: true })
      await sendAsAttestor(registry, 'recover', [nullifier, wallet])
      return res.status(200).json({ status: 'success', result: true })
    }

    const username = usernameFrom(result.userData.userDefinedData)
    if (!username) return fail(res, 'No valid username was attached to this proof.')
    await sendAsAttestor(registry, 'issue', [wallet, username, nullifier, PROOF.self])
    return res.status(200).json({ status: 'success', result: true })
  } catch (error) {
    return fail(res, explain(error).message ?? error?.message ?? 'Verification failed.')
  }
}
