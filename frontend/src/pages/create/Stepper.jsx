import { motion } from 'motion/react'
import { Check } from 'lucide-react'

const FLOW_STEPS = [
  { id: 'connect', label: 'Wallet' },
  { id: 'username', label: 'Username' },
  { id: 'verify', label: 'Verify' },
  { id: 'mint', label: 'Mint' },
]

export function Stepper({ current }) {
  const index = FLOW_STEPS.findIndex((s) => s.id === current)
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progress">
      {FLOW_STEPS.map((s, i) => {
        const done = i < index
        const active = i === index
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none" aria-current={active ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ scale: active ? 1 : 0.92 }}
                className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs transition-colors duration-300 ${
                  done
                    ? 'border-accent bg-accent text-on-accent'
                    : active
                      ? 'border-accent text-accent'
                      : 'border-line-strong text-muted'
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </motion.span>
              <span className={`hidden text-sm sm:inline ${active ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <span className="relative h-px flex-1 overflow-hidden bg-line-strong">
                <motion.span
                  className="absolute inset-0 origin-left bg-accent"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
