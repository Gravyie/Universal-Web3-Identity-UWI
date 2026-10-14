export const shortAddress = (address, head = 6, tail = 4) =>
  address ? `${address.slice(0, head)}…${address.slice(-tail)}` : ''

export const shortHash = (hash, head = 10, tail = 6) =>
  hash && hash.length > head + tail + 1 ? `${hash.slice(0, head)}…${hash.slice(-tail)}` : hash ?? ''

export const formatDate = (ms, opts = { year: 'numeric', month: 'short', day: '2-digit' }) =>
  ms ? new Intl.DateTimeFormat(undefined, opts).format(new Date(ms)) : '—'

export const formatNumber = (n) => new Intl.NumberFormat().format(n)

export const padTokenId = (id) => String(id ?? 0).padStart(6, '0')

/**
 * Passport-style machine readable zone built only from public credential data.
 * Purely decorative — it's a nod to the documents Self reads, not a real MRZ.
 */
export function buildMrz({ username = '', address = '', tokenId = 0 }) {
  const name = username.toUpperCase().replace(/[^A-Z0-9]/g, '<')
  const addr = (address || '').replace(/^0x/i, '').toUpperCase()
  const line1 = `UW<HBR${name}<<`.padEnd(36, '<').slice(0, 36)
  const line2 = `${padTokenId(tokenId)}<${addr.slice(0, 20)}<<SBT`.padEnd(36, '<').slice(0, 36)
  return [line1, line2]
}
