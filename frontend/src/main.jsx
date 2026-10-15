import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import * as Tooltip from '@radix-ui/react-tooltip'

import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'

import { ThemeProvider } from './theme/ThemeProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Tooltip.Provider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Tooltip.Provider>
      </MotionConfig>
    </ThemeProvider>
  </React.StrictMode>,
)
