export const shortAddress = (address, head = 6, tail = 4) =>
  address ? `${address.slice(0, head)}...${address.slice(-tail)}` : ''

export const shortHash = (hash, head = 8, tail = 6) =>
  hash && hash.length > head + tail + 3 ? `${hash.slice(0, head)}...${hash.slice(-tail)}` : (hash ?? '')

export const formatDate = (ms, opts = { year: 'numeric', month: 'short', day: 'numeric' }) =>
  ms ? new Intl.DateTimeFormat(undefined, opts).format(new Date(ms)) : '-'

export const formatNumber = (n) => new Intl.NumberFormat().format(n)

export const padTokenId = (id) => String(id ?? 0).padStart(6, '0')

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
export function timeAgo(ms) {
  const diff = (ms - Date.now()) / 1000
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'just now'
}
