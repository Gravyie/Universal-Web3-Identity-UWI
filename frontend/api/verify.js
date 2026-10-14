// Vercel serverless function: Self's relayer POSTs the user's zero-knowledge
// proof here. We check it against the Self hub contract and answer in the
// shape the Self app expects ({ status, result, reason }).
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core'

const endpoint = process.env.SELF_ENDPOINT || process.env.VITE_SELF_ENDPOINT
const scope = process.env.SELF_SCOPE || process.env.VITE_SELF_SCOPE || 'uwi-identity'
const endpointType = process.env.VITE_SELF_ENDPOINT_TYPE || 'staging_https'
const mockPassport = endpointType.startsWith('staging')

// Must match `selfConfig.disclosures` in src/config/self.js.
const verifier = endpoint
  ? new SelfBackendVerifier(
      scope,
      endpoint,
      mockPassport,
      AllIds,
      new DefaultConfigStore({ minimumAge: 18, excludedCountries: [], ofac: false }),
      'hex',
    )
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ status: 'error', result: false, reason: 'Method not allowed' })
  }
  if (!verifier) {
    return res
      .status(500)
      .json({ status: 'error', result: false, reason: 'SELF_ENDPOINT is not configured' })
  }

  const { attestationId, proof, publicSignals, userContextData } = req.body ?? {}
  if (!attestationId || !proof || !publicSignals || !userContextData) {
    return res
      .status(200)
      .json({ status: 'error', result: false, reason: 'Missing proof, publicSignals, attestationId or userContextData' })
  }

  try {
    const result = await verifier.verify(attestationId, proof, publicSignals, userContextData)
    const { isValid, isMinimumAgeValid } = result.isValidDetails

    if (!isValid || !isMinimumAgeValid) {
      const reason = !isValid ? 'Proof is not valid' : 'Minimum age requirement not met'
      return res.status(200).json({ status: 'error', result: false, reason })
    }

    return res.status(200).json({ status: 'success', result: true })
  } catch (error) {
    return res.status(200).json({ status: 'error', result: false, reason: error?.message ?? 'Verification failed' })
  }
}
