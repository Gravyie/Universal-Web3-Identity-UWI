import { lazy, Suspense } from 'react'

const Web3Provider = lazy(() => import('./Web3Provider'))

/** Renders children inside the lazily loaded wallet stack. */
export function Web3({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback}>
      <Web3Provider>{children}</Web3Provider>
    </Suspense>
  )
}
