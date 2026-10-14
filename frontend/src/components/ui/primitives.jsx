import { useState } from 'react'
import * as RTooltip from '@radix-ui/react-tooltip'
import * as RSwitch from '@radix-ui/react-switch'
import * as RTabs from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function Tooltip({ content, children, side = 'top' }) {
  return (
    <RTooltip.Root delayDuration={250}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-80 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-bg shadow-card data-[state=delayed-open]:animate-[fade-in_120ms_ease-out]"
        >
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

export function Switch({ checked, onCheckedChange, id, ...props }) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-accent"
      {...props}
    >
      <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  )
}

/** Underline tabs with a sliding indicator. */
export function Tabs({ value, onValueChange, items, children, layoutId = 'tabs', className = '' }) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List className="flex gap-1 border-b border-line">
        {items.map((it) => (
          <RTabs.Trigger
            key={it.value}
            value={it.value}
            className="relative px-3 pt-1 pb-3 text-sm text-muted transition-colors hover:text-ink data-[state=active]:text-ink"
          >
            {it.label}
            {it.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-px font-mono text-[11px] text-ink-2">{it.count}</span>
            )}
            {value === it.value && (
              <motion.span layoutId={layoutId} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />
            )}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  )
}
export const TabPanel = RTabs.Content

export function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'border-line-strong text-ink-2',
    accent: 'border-transparent bg-accent-soft text-accent',
    ok: 'border-transparent bg-ok/12 text-ok',
    warn: 'border-transparent bg-warn/12 text-warn',
    danger: 'border-transparent bg-danger/12 text-danger',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-line-strong bg-surface px-1 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  )
}

export function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text, message = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(message)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't access the clipboard")
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
      className={`inline-grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={copied ? 'y' : 'n'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}>
          {copied ? <Check className="size-3.5 text-ok" weight="bold" /> : <Copy className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
          <Icon className="size-5" />
        </div>
      )}
      <h3 className="mt-4 font-medium text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-2">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
