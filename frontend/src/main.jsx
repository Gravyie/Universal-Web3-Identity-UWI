import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'

// Web3Modal imports
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { arbitrum, mainnet, polygon } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// 1. Get projectId from WalletConnect
const projectId = '26fc2c38c6a17ba6503530bb4113029b' // Get this from walletconnect.com

// 2. Configure chains
const chains = [mainnet, arbitrum, polygon]

// 3. Create wagmiConfig
const metadata = {
  name: 'Universal Web3 Identity',
  description: 'Create your unified Web3 identity',
  url: 'https://your-domain.com',
  icons: ['https://your-domain.com/icon.png']
}

const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// 4. Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
