import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Spinner'

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45'

const variants = {
  primary:
    'bg-accent text-on-accent shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_24px_-10px_var(--accent)] hover:brightness-[1.06] hover:shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_12px_32px_-10px_var(--accent)]',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink/30 hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
}

const sizes = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, href, loading, className = '', children, ...props },
  ref,
) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  const content = (
    <>
      {loading && <Spinner className="size-4" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...props}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noreferrer" className={cls} {...props}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref} className={cls} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  )
})
