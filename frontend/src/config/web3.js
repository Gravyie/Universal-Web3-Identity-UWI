import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient } from '@tanstack/react-query'
import { uwiChain } from './chain'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id'
const origin = typeof window !== 'undefined' ? window.location.origin : 'https://uwi.app'

export const networks = [uwiChain]
export const wagmiAdapter = new WagmiAdapter({ networks, projectId })

// AppKit brings WalletConnect (QR on desktop, deep links on mobile) and
// injected wallets. Users only ever sign here; the relayer pays all gas.
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: uwiChain,
  projectId,
  metadata: {
    name: 'UWI',
    description: 'Proof of personhood for Web3.',
    url: origin,
    icons: [`${origin}/favicon.svg`],
  },
  features: { analytics: false, email: false, socials: false, swaps: false, onramp: false, send: false },
  // The Coinbase SDK phones home to its own analytics on every page; Coinbase Wallet
  // still connects as an injected or WalletConnect wallet.
  enableCoinbase: false,
  themeVariables: {
    '--w3m-font-family': "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    '--w3m-border-radius-master': '3px',
  },
})

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 10_000 } },
})
