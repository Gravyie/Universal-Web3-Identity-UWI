import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { List, MagnifyingGlass } from '@phosphor-icons/react'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/primitives'
import { Sheet } from '../ui/Sheet'
import { ThemeMenu } from './ThemeMenu'
import { AccountMenu } from './AccountMenu'
import { openCommandMenu } from './CommandMenu'

const LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/#gates', label: 'Gates' },
  { to: '/developers', label: 'Developers' },
]

export function SiteHeader() {
  const [menu, setMenu] = useState(false)
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 rounded-full border border-line-strong bg-bg-elev/70 pr-2 pl-5 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.35)] backdrop-blur-2xl backdrop-saturate-150">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="rounded-full px-3 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={openCommandMenu}
            className="hidden h-9 items-center gap-2 rounded-full border border-line-strong bg-surface pr-1.5 pl-3 text-[13px] text-muted transition-colors hover:text-ink lg:flex"
          >
            <MagnifyingGlass className="size-3.5" /> Look up a human <Kbd>⌘K</Kbd>
          </button>
          <ThemeMenu />
          <div className="hidden sm:block">
            <AccountMenu />
          </div>
          <Button to="/app" size="sm" variant="secondary" className="hidden md:inline-flex">
            Open app
          </Button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2 md:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <List className="size-5" />
          </button>
        </div>
      </div>

      <Sheet open={menu} onOpenChange={setMenu} title="Menu">
        <nav className="grid gap-1" aria-label="Mobile">
          {[...LINKS, { to: '/app', label: 'Open app' }].map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenu(false)} className="rounded-[12px] px-3 py-3 text-[15px] text-ink hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <AccountMenu size="md" />
        </div>
      </Sheet>
    </header>
  )
}
