import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'
import { ACCENTS } from '../theme/options'

const MODE_META = {
  system: { icon: Monitor, label: 'System' },
  light: { icon: Sun, label: 'Paper' },
  dark: { icon: Moon, label: 'Ink' },
}

export function ThemeMenu() {
  const { mode, setMode, accent, setAccent, resolved } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const TriggerIcon = resolved === 'dark' ? Moon : Sun

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolved}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
          >
            <TriggerIcon className="size-[18px]" />
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-line-strong bg-bg-elev/95 p-3 shadow-card backdrop-blur-xl"
          >
            <div className="eyebrow px-1 pb-2">Theme</div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
              {Object.entries(MODE_META).map(([id, { icon: Icon, label }]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`relative flex flex-col items-center gap-1 rounded-lg py-2 text-xs transition-colors ${mode === id ? 'text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {mode === id && (
                    <motion.span
                      layoutId="theme-mode-pill"
                      className="absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-line"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                  <Icon className="relative size-4" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <div className="eyebrow px-1 pt-4 pb-2">Accent</div>
            <div className="grid grid-cols-4 gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccent(a.id)}
                  aria-label={a.label}
                  title={a.label}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-bg-elev transition ${accent === a.id ? 'ring-2 ring-ink/70' : 'group-hover:scale-105'}`}
                    style={{ background: a.swatch }}
                  >
                    {accent === a.id && <Check className="size-4 text-black/70" strokeWidth={3} />}
                  </span>
                  <span className="text-[11px] text-muted">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
