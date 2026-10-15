import { NavLink } from 'react-router-dom'

const LABS = [
  ['cinematic', 'Cinematic'],
  ['editorial', 'Editorial'],
  ['tactile', 'Tactile'],
]

/** Floating switcher so the three directions can be compared back to back. */
export function LabSwitcher({ tone = 'dark' }) {
  const shell =
    tone === 'dark'
      ? 'border-white/15 bg-black/50 text-white/60'
      : tone === 'paper'
        ? 'border-black bg-[#f3f3f0] text-black/60'
        : 'border-white/70 bg-white/70 text-[#3a2d63]/70'
  const active = tone === 'dark' ? 'bg-white text-black' : tone === 'paper' ? 'bg-black text-[#f3f3f0]' : 'bg-[#3a2d63] text-white'
  return (
    <nav
      aria-label="Design directions"
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border p-1 text-sm shadow-2xl backdrop-blur-xl ${shell}`}
    >
      {LABS.map(([id, label]) => (
        <NavLink key={id} to={`/lab/${id}`} className={({ isActive }) => `rounded-full px-4 py-1.5 transition-colors ${isActive ? active : 'hover:opacity-100'}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
