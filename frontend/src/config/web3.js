import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { hederaTestnet } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// AppKit ships WalletConnect (QR on desktop, deep links on mobile), injected
// wallets and Coinbase out of the box, so no extra connectors are needed.
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id'

export const networks = [hederaTestnet]
export const uwiChain = hederaTestnet

export const wagmiAdapter = new WagmiAdapter({ networks, projectId })

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: hederaTestnet,
  projectId,
  metadata: {
    name: 'Universal Web3 Identity',
    description: 'Prove you are a unique human — without oversharing.',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://uwi.app',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : ''],
  },
  features: { analytics: false, email: false, socials: false, swaps: false, onramp: false },
  themeVariables: {
    '--w3m-font-family': "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    '--w3m-border-radius-master': '2px',
  },
})

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
})
