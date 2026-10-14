import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import * as Tooltip from '@radix-ui/react-tooltip'

import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'

import { wagmiAdapter, queryClient } from './config/web3'
import { ThemeProvider } from './theme/ThemeProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <Tooltip.Provider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </Tooltip.Provider>
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
