import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { useToast } from './Toast'

export function useCopy() {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const copy = async (text, message = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast(message, { type: 'success' })
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast("Couldn't access the clipboard", { type: 'error' })
    }
  }

  return { copy, copied }
}

export function CopyButton({ value, label = 'Copy', message, className = '' }) {
  const { copy, copied } = useCopy()
  return (
    <button
      type="button"
      onClick={() => copy(value, message)}
      aria-label={label}
      title={label}
      className={`relative inline-grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'y' : 'n'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? <Check className="size-3.5 text-accent" strokeWidth={2.5} /> : <Copy className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
