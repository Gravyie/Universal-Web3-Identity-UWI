// Mirrors UWIRegistry._isValidUsername so we can reject bad input before a round trip.
export const USERNAME = { min: 3, max: 24, pattern: /^[a-z0-9_]+$/ }

export const normalizeUsername = (value) => value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

export function usernameProblem(name) {
  if (!name) return 'Pick a username'
  if (name.length < USERNAME.min) return `At least ${USERNAME.min} characters`
  if (name.length > USERNAME.max) return `At most ${USERNAME.max} characters`
  if (!USERNAME.pattern.test(name)) return 'Lowercase letters, numbers and underscores'
  return null
}
