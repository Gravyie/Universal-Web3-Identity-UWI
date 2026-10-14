import { Link } from 'react-router-dom'

/** The UWI mark: one ring, three orbits. One human, seen from every app. */
export function LogoMark({ className = 'size-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="32" cy="32" r="24" />
        <ellipse cx="32" cy="32" rx="24" ry="9.5" />
        <ellipse cx="32" cy="32" rx="24" ry="9.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="24" ry="9.5" transform="rotate(-60 32 32)" />
      </g>
      <circle cx="32" cy="32" r="4.5" fill="currentColor" />
    </svg>
  )
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="group flex items-center gap-2" aria-label="UWI home">
      <span className="text-ink transition-transform duration-700 ease-out group-hover:rotate-[120deg]">
        <LogoMark />
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.04em] text-ink">UWI</span>
    </Link>
  )
}
