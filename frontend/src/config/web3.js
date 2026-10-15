import { createAppKit } from '@reown/appkit/react'
import { OptionsController } from '@reown/appkit-controllers'
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
  // Coinbase's SDKs (Coinbase Wallet and Base Account) send their own analytics from
  // every page. Coinbase Wallet still connects as an injected or WalletConnect wallet.
  enableCoinbase: false,
  enableBaseAccount: false,
  themeVariables: {
    '--w3m-font-family': "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    '--w3m-border-radius-master': '3px',
  },
})

// AppKit 1.8 accepts enableBaseAccount but never applies it, so the Base Account
// SDK (and its analytics) would load anyway. Set it on the options store directly,
// before AppKit gets round to adding third-party connectors.
OptionsController.setEnableBaseAccount(false)

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 10_000 } },
})
