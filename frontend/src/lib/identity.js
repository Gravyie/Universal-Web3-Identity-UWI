import { encodeAbiParameters, keccak256 } from 'viem'

export const USERNAME_RULES = { min: 3, max: 24, pattern: /^[a-zA-Z0-9_]+$/ }

export function validateUsername(value) {
  const name = value.trim()
  if (!name) return 'Pick a username to continue'
  if (name.length < USERNAME_RULES.min) return `At least ${USERNAME_RULES.min} characters`
  if (name.length > USERNAME_RULES.max) return `At most ${USERNAME_RULES.max} characters`
  if (!USERNAME_RULES.pattern.test(name)) return 'Letters, numbers and underscores only'
  return null
}

/**
 * The hash stored on-chain in place of any identity data. It commits to the
 * wallet, the Self scope, the username and the moment of verification — enough
 * for a dApp to tell credentials apart, nothing that reveals the person.
 * Simulated verifications are prefixed with `demo:` so they're visibly distinct.
 */
export function verificationHash({ address, scope, username, verifiedAt, method }) {
  const hash = keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'string' }, { type: 'string' }, { type: 'uint256' }],
      [address, scope, username, BigInt(verifiedAt)],
    ),
  )
  return method === 'demo' ? `demo:${hash}` : hash
}

export const isDemoHash = (hash) => typeof hash === 'string' && hash.startsWith('demo:')

/** Decodes the contract's `data:application/json;base64,…` token URI. */
export function decodeTokenUri(uri) {
  if (!uri?.startsWith('data:application/json;base64,')) return null
  try {
    const bytes = Uint8Array.from(atob(uri.split(',')[1]), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
