import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import './index.css'

// Reown AppKit imports
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'
import { arbitrum, mainnet, polygon, celo, celoAlfajores } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id'

const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'Hedera Explorer', url: 'https://hashscan.io/testnet' },
  },
}

const networks = [mainnet, arbitrum, polygon, celo, celoAlfajores, hederaTestnet]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Universal Web3 Identity',
    description: 'Create your Sybil-resistant Web3 identity',
    url: 'https://uwi.app',
    icons: ['https://uwi.app/icon.png'],
  },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
