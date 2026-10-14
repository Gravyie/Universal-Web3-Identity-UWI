import * as Popover from '@radix-ui/react-popover'
import { motion } from 'motion/react'
import { Check, Desktop, Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '../../theme/ThemeProvider'
import { ACCENTS } from '../../theme/options'

const MODES = [
  { id: 'system', icon: Desktop, label: 'System' },
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
]

export function ThemeMenu() {
  const { mode, setMode, accent, setAccent, resolved } = useTheme()
  const Trigger = resolved === 'dark' ? Moon : Sun

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Appearance"
        className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Trigger className="size-[18px]" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-60 w-64 rounded-[20px] border border-line-strong bg-bg-elev p-3 shadow-card outline-none data-[state=open]:animate-[dialog-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <p className="px-1 pb-2 text-xs font-medium text-muted">Theme</p>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
            {MODES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={`relative flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs transition-colors ${mode === id ? 'text-ink' : 'text-muted hover:text-ink'}`}
              >
                {mode === id && (
                  <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                )}
                <Icon className="relative size-3.5" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <p className="px-1 pt-4 pb-2 text-xs font-medium text-muted">Accent</p>
          <div className="flex gap-2 px-1">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                aria-label={a.label}
                title={a.label}
                aria-pressed={accent === a.id}
                className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-bg-elev transition hover:scale-105 aria-pressed:ring-2 aria-pressed:ring-ink/60"
                style={{ background: a.swatch }}
              >
                {accent === a.id && <Check weight="bold" className="size-3.5 text-black/70" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
