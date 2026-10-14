// Self Protocol settings. The disclosures here must match the DefaultConfigStore
// in api/self.js, or the backend verifier rejects proofs as a config mismatch.
const env = import.meta.env

export const selfConfig = {
  appName: 'UWI',
  // Public https URL of api/self.js. Self's relayer calls it, so it can't be localhost.
  endpoint: env.VITE_SELF_ENDPOINT || '',
  endpointType: env.VITE_SELF_ENDPOINT_TYPE || 'staging_https',
  scope: env.VITE_SELF_SCOPE || 'uwi-identity',
  disclosures: { minimumAge: 18, excludedCountries: [], ofac: false },
}

export const selfConfigured = Boolean(selfConfig.endpoint)
