import { useCallback, useState } from 'react'
import { readJSON, remove, writeJSON } from '../../lib/storage'

// How long after tapping "Open Self app" we accept the app's redirect back.
const SELF_RETURN_WINDOW_MS = 15 * 60 * 1000

const keyFor = (address) => `uwi:draft:${address?.toLowerCase()}`

/**
 * Per-wallet progress through the create flow, kept in localStorage. Mobile
 * users leave for the Self app mid-flow and may come back in a fresh tab.
 *
 * Shape: { username, selfLaunchedAt?, verification?: { method, verifiedAt } }
 */
const load = (address) => (address ? readJSON(keyFor(address), {}) : {})

export function useDraft(address) {
  const [store, setStore] = useState(() => ({ address, draft: load(address) }))

  // Load synchronously when the wallet changes (e.g. after reconnecting), so
  // the first render for a new address already sees its saved progress.
  let current = store
  if (store.address !== address) {
    current = { address, draft: load(address) }
    setStore(current)
  }
  const draft = current.draft

  const update = useCallback(
    (patch) => {
      setStore((prev) => {
        const next = typeof patch === 'function' ? patch(prev.draft) : { ...prev.draft, ...patch }
        if (address) writeJSON(keyFor(address), next)
        return { address, draft: next }
      })
    },
    [address],
  )

  const clear = useCallback(() => {
    if (address) remove(keyFor(address))
    setStore({ address, draft: {} })
  }, [address])

  const setUsername = (username) =>
    // The verification is tied to the username, so changing it means proving again.
    update((prev) => (prev.username === username ? prev : { username }))

  const markVerified = (method) =>
    update((prev) => ({ ...prev, selfLaunchedAt: undefined, verification: { method, verifiedAt: Date.now() } }))

  const markSelfLaunched = () => update({ selfLaunchedAt: Date.now() })

  const canAcceptSelfReturn = Boolean(
    draft.selfLaunchedAt && Date.now() - draft.selfLaunchedAt < SELF_RETURN_WINDOW_MS,
  )

  const resetVerification = () => update((prev) => ({ username: prev.username }))

  return {
    draft,
    setUsername,
    markVerified,
    markSelfLaunched,
    canAcceptSelfReturn,
    resetVerification,
    clear,
  }
}
