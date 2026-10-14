import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { appKit } from '../config/web3'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { readJSON, writeJSON } from '../lib/storage'
import { ACCENTS, MODES } from './options'


const STORAGE_KEY = 'uwi:theme'
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const saved = readJSON(STORAGE_KEY, {})
  const [mode, setMode] = useState(MODES.includes(saved.mode) ? saved.mode : 'system')
  const [accent, setAccent] = useState(ACCENTS.some((a) => a.id === saved.accent) ? saved.accent : 'verdigris')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    root.dataset.accent = accent
    writeJSON(STORAGE_KEY, { mode, accent })

    // Keep the wallet modal in the same theme and accent as the page.
    const styles = getComputedStyle(root)
    appKit.setThemeMode(resolved)
    appKit.setThemeVariables({
      '--w3m-accent': styles.getPropertyValue('--accent').trim(),
      '--w3m-color-mix': styles.getPropertyValue('--bg').trim(),
      '--w3m-color-mix-strength': 12,
    })
  }, [mode, accent, resolved])

  const value = useMemo(() => ({ mode, setMode, accent, setAccent, resolved }), [mode, accent, resolved])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
