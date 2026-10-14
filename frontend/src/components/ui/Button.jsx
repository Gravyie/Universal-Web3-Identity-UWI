import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Spinner'

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow,filter] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

const variants = {
  primary: 'bg-accent text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] hover:brightness-110',
  ink: 'bg-ink text-bg hover:opacity-90',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-110',
}

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-10 px-4.5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'size-9',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, href, loading, className = '', children, disabled, ...props },
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
    <button ref={ref} className={cls} disabled={loading || disabled} {...props}>
      {content}
    </button>
  )
})
