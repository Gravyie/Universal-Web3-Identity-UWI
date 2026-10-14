import { Link } from 'react-router-dom'

export function LogoMark({ className = 'size-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.6">
        <circle cx="32" cy="32" r="22" />
        <ellipse cx="32" cy="32" rx="22" ry="9" />
        <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-60 32 32)" />
      </g>
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="UWI home">
      <span className="text-accent transition-transform duration-700 ease-out group-hover:rotate-[120deg]">
        <LogoMark />
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">
        UWI
        <span className="ml-2 hidden font-mono text-[10px] font-normal tracking-[0.12em] text-muted uppercase sm:inline">
          Universal Web3 Identity
        </span>
      </span>
    </Link>
  )
}
