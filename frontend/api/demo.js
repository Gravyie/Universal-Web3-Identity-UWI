// Testnet-only: issue a credential without Self, so the product can be tried
// end to end. The wallet proves ownership with a signed message; the
// credential is marked Proof.Demo on-chain, which strict checks reject.
import { encodePacked, getAddress, isAddress, keccak256, verifyMessage } from 'viem'
import { PROOF, demoMessage } from '../src/config/abi.js'
import { ApiError, config, sendAsAttestor, registry } from './_lib/chain.js'
import { body, route } from './_lib/http.js'

const MAX_AGE_MS = 10 * 60 * 1000

export default route(['POST'], async (req, res) => {
  if (!config.demoIssuance) throw new ApiError(403, 'DemoDisabled', 'Demo credentials are disabled on this deployment.')

  const { address, username, issuedAt, signature } = body(req)
  if (!isAddress(address ?? '', { strict: false }) || !/^[a-z0-9_]{3,24}$/.test(username ?? '') || !signature) {
    throw new ApiError(400, 'BadRequest', 'Send address, username, issuedAt and signature.')
  }
  const age = Date.now() - Date.parse(issuedAt)
  if (!(age >= -60_000 && age < MAX_AGE_MS)) throw new ApiError(400, 'Expired', 'That signature is too old. Please sign again.')

  const wallet = getAddress(address.toLowerCase())
  const valid = await verifyMessage({ address: wallet, message: demoMessage({ address: wallet, username, issuedAt }), signature })
  if (!valid) throw new ApiError(401, 'InvalidSignature', "The signature doesn't match this wallet.")

  // One demo human per wallet. Real Self nullifiers come from the passport instead.
  const nullifier = keccak256(encodePacked(['string', 'address'], ['uwi-demo:', wallet]))
  const { hash, result } = await sendAsAttestor(registry, 'issue', [wallet, username, nullifier, PROOF.demo])
  return res.status(200).json({ tokenId: result.toString(), txHash: hash })
})
