import { useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { appKit, queryClient, wagmiAdapter } from '../config/web3'
import { useTheme } from '../theme/ThemeProvider'

/**
 * The wallet stack (wagmi, React Query, Reown AppKit). Loaded lazily so the
 * landing story paints without waiting for it.
 */
export default function Web3Provider({ children }) {
  const { resolved } = useTheme()
  useEffect(() => {
    // Keep the wallet modal in the same theme as the page.
    const styles = getComputedStyle(document.documentElement)
    appKit.setThemeMode(resolved)
    appKit.setThemeVariables({
      '--w3m-accent': styles.getPropertyValue('--accent').trim(),
      '--w3m-color-mix': styles.getPropertyValue('--bg').trim(),
      '--w3m-color-mix-strength': 10,
    })
  }, [resolved])
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
