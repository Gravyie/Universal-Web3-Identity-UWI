import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// Touch-first devices can't scan a QR code shown on their own screen.
export const useIsMobile = () => useMediaQuery('(pointer: coarse) and (max-width: 820px)')
