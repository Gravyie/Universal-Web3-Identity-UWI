import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, AtSign, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { USERNAME_RULES, validateUsername } from '../../lib/identity'
import { StepHeading } from './StepHeading'

export function StepUsername({ value, onChange, onSubmit }) {
  const [touched, setTouched] = useState(false)
  const error = validateUsername(value)
  const showError = touched && error

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!error) onSubmit(value.trim())
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHeading
        icon={AtSign}
        title="Choose your username"
        body="It's printed on your credential and stored in the token's metadata. It's public and permanent, so keep it to something you're happy to be known by."
      />

      <label htmlFor="username" className="mt-8 block text-sm font-medium text-ink">
        Username
      </label>
      <div
        className={`mt-2 flex h-14 items-center rounded-2xl border bg-surface pr-3 pl-4 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_4px_var(--accent-soft)] ${
          showError ? 'border-danger/60' : 'border-line-strong focus-within:border-accent'
        }`}
      >
        <span className="font-display text-2xl text-muted italic">@</span>
        <input
          id="username"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          maxLength={USERNAME_RULES.max}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, '_'))}
          onBlur={() => setTouched(true)}
          placeholder="satoshi"
          aria-invalid={Boolean(showError)}
          aria-describedby="username-hint"
          className="h-full min-w-0 flex-1 bg-transparent pl-1 text-lg text-ink outline-none placeholder:text-muted/50"
        />
        <AnimatePresence>
          {!error && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="grid size-6 place-items-center rounded-full bg-accent text-on-accent"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div id="username-hint" className="mt-2 flex justify-between gap-4 text-[13px]">
        <span className={showError ? 'text-danger' : 'text-muted'}>
          {showError ? error : 'Letters, numbers and underscores.'}
        </span>
        <span className="font-mono text-muted tabular-nums">
          {value.trim().length}/{USERNAME_RULES.max}
        </span>
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full sm:w-auto" disabled={touched && Boolean(error)}>
        Continue to verification
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </form>
  )
}
