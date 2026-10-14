import { getAddress, isAddress } from 'viem'
import { publicClient, registry } from './chain.js'

const PROOF_NAMES = ['self', 'demo']

/** Looks up a human by wallet address or username. */
export async function lookupHuman(id) {
  let address
  if (isAddress(id, { strict: false })) {
    address = getAddress(id.toLowerCase())
  } else {
    const [holder] = await publicClient.readContract({ ...registry, functionName: 'resolveUsername', args: [id.toLowerCase()] })
    if (holder === '0x0000000000000000000000000000000000000000') return { verified: false, query: id }
    address = holder
  }

  const [tokenId, c] = await publicClient.readContract({ ...registry, functionName: 'credentialOf', args: [address] })
  if (tokenId === 0n) return { verified: false, address }

  return {
    verified: true,
    strict: c.proof === 0,
    address,
    tokenId: tokenId.toString(),
    username: c.username,
    proof: PROOF_NAMES[c.proof] ?? 'unknown',
    issuedAt: new Date(Number(c.issuedAt) * 1000).toISOString(),
    updatedAt: new Date(Number(c.updatedAt) * 1000).toISOString(),
  }
}
