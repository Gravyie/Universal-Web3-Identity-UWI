import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '../../theme/ThemeProvider'

/** Light/dark toggle. The theme follows the system until you pick one here. */
export function ThemeMenu() {
  const { resolved, setMode } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  const Icon = resolved === 'dark' ? Moon : Sun
  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="grid size-9 place-items-center overflow-hidden rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resolved}
          initial={{ y: 10, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -10, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <Icon className="size-[18px]" />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
