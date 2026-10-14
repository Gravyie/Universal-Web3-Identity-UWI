import { forwardRef, useId } from 'react'

/** Label above, control, then hint or error below. Never placeholder-as-label. */
export function Field({ label, hint, error, children, aside, className = '' }) {
  const id = useId()
  const describedBy = `${id}-desc`
  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
      {(error || hint) && (
        <p id={describedBy} className={`text-[13px] ${error ? 'text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ className = '', prefix, suffix, invalid, ...props }, ref) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-[12px] border bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_var(--accent-soft)] ${
        invalid ? 'border-danger/60' : 'border-line-strong focus-within:border-accent'
      } ${className}`}
    >
      {prefix}
      <input
        ref={ref}
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        {...props}
      />
      {suffix}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ className = '', invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`min-h-24 w-full resize-y rounded-[12px] border bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:shadow-[0_0_0_3px_var(--accent-soft)] ${
        invalid ? 'border-danger/60' : 'border-line-strong focus:border-accent'
      } ${className}`}
      {...props}
    />
  )
})
