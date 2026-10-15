import { Link } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'

/** Every app page uses this width and padding, so nothing jumps between pages. */
export function PageContainer({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 ${className}`}>{children}</div>
}

/** The one header style for every app page: optional back link, title, description, actions. */
export function PageHeader({ back, title, description, actions, meta }) {
  return (
    <div className="mb-8">
      {back && (
        <Link to={back.to} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <CaretLeft className="size-3.5" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.035em] break-words text-ink sm:text-[2rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-2">{description}</p>}
          {meta && <div className="mt-3">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
