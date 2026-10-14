// Self Protocol settings. The disclosures here must match the DefaultConfigStore
// in api/verify.js, or the backend verifier rejects the proof as a config mismatch.
const env = import.meta.env

export const selfConfig = {
  appName: 'Universal Web3 Identity',
  endpoint: env.VITE_SELF_ENDPOINT || '',
  endpointType: env.VITE_SELF_ENDPOINT_TYPE || 'staging_https',
  scope: env.VITE_SELF_SCOPE || 'uwi-identity',
  disclosures: { minimumAge: 18, excludedCountries: [], ofac: false },
}

export const selfConfigured = Boolean(selfConfig.endpoint)

// Without an endpoint there is no way to finish the flow, so demo mode is on.
export const demoVerifyAllowed =
  !selfConfigured || env.DEV || env.VITE_ALLOW_DEMO_VERIFY === 'true'
