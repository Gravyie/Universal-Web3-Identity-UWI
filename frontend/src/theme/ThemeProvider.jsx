import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { readJSON, writeJSON } from '../lib/storage'
import { FINISHES, MODES } from './options'

const STORAGE_KEY = 'uwi:theme'
const ThemeContext = createContext(null)
const noop = () => {}
const FALLBACK = { mode: 'system', setMode: noop, finish: 'holo', setFinish: noop, resolved: 'dark' }

/** Appearance preferences: light/dark mode (following the system by default) and the holo card finish. */
export function ThemeProvider({ children }) {
  const saved = readJSON(STORAGE_KEY, {})
  const [mode, setMode] = useState(MODES.includes(saved.mode) ? saved.mode : 'system')
  const [finish, setFinish] = useState(FINISHES.includes(saved.finish) ? saved.finish : 'holo')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    writeJSON(STORAGE_KEY, { mode, finish })
  }, [mode, finish, resolved])

  const value = useMemo(
    () => ({ mode, setMode, finish, setFinish, resolved }),
    [mode, finish, resolved],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  // Portals into separate React roots (e.g. 3D HTML overlays) lose context; fall back to defaults.
  return useContext(ThemeContext) ?? FALLBACK
}
