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

/** The wordmark: spaced capitals, so the three letters read as a mark rather than a word. */
export function Wordmark({ className = '' }) {
  return <span className={`pl-[0.06em] text-[15px] leading-none font-semibold tracking-[0.17em] ${className}`}>UWI</span>
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label="UWI home">
      <span className="text-ink transition-transform duration-700 ease-out group-hover:rotate-[120deg]">
        <LogoMark />
      </span>
      <Wordmark className="text-ink" />
    </Link>
  )
}
