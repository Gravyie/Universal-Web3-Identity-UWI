import { NavLink, Outlet } from 'react-router-dom'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { BookOpen, Door, Gear, IdentificationCard, MagnifyingGlass, SquaresFour, Wallet } from '@phosphor-icons/react'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { Kbd, Tooltip } from '../ui/primitives'
import { ThemeMenu } from './ThemeMenu'
import { AccountMenu } from './AccountMenu'
import { openCommandMenu } from './CommandMenu'
import { useCredential, useServiceStatus } from '../../hooks/useCredential'
import { HoloCard } from '../holo/HoloCard'

function useNav() {
  const { address } = useAccount()
  const { credential } = useCredential(address)
  return [
    { to: '/app', label: 'Overview', icon: SquaresFour, end: true },
    { to: '/app/gates', label: 'Gates', icon: Door },
    { to: credential ? `/u/${credential.username}` : '/start', label: credential ? 'Profile' : 'Get verified', icon: IdentificationCard },
    { to: '/app/settings', label: 'Settings', icon: Gear },
  ]
}

function RelayerStatus() {
  const { data, isError } = useServiceStatus()
  const ok = data?.relayer?.configured && !isError
  const balance = data?.relayer?.balance ? Number(data.relayer.balance).toFixed(1) : null
  return (
    <Tooltip content={ok ? `Relayer funded with ${balance} HBAR. You never pay gas.` : 'Gasless relayer unavailable'}>
      <div className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-muted">
        <span className={`size-1.5 rounded-full ${ok ? 'bg-ok' : 'bg-warn'}`} />
        {ok ? 'Gasless relayer online' : 'Relayer offline'}
      </div>
    </Tooltip>
  )
}

function ConnectGate() {
  const { open } = useAppKit()
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">Connect to open your dashboard</h1>
        <p className="mt-3 text-ink-2">Your credential and gates live on-chain and are tied to your wallet. Signing in never costs gas.</p>
        <Button className="mt-8" size="lg" variant="ink" onClick={() => open()}>
          <Wallet className="size-4" /> Connect wallet
        </Button>
      </div>
      <HoloCard proof="pending" className="mx-auto w-full max-w-sm" />
    </div>
  )
}

export function AppShell() {
  const { isConnected, isReconnecting } = useAccount()
  const nav = useNav()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-bg-elev px-3 py-4 lg:flex">
        <div className="px-3 py-1.5">
          <Logo to="/" />
        </div>
        <button
          type="button"
          onClick={openCommandMenu}
          className="mt-5 flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface px-3 text-[13px] text-muted hover:text-ink"
        >
          <MagnifyingGlass className="size-3.5" /> Search <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </button>
        <nav className="mt-5 grid gap-0.5" aria-label="App">
          {[...nav, { to: '/developers', label: 'Developers', icon: BookOpen }].map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors ${isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-full bg-surface-2" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                  <Icon className="relative size-[18px]" weight={isActive ? 'fill' : 'regular'} />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <RelayerStatus />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Logo to="/" />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={openCommandMenu} aria-label="Search" className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2 lg:hidden">
              <MagnifyingGlass className="size-[18px]" />
            </button>
            <ThemeMenu />
            <AccountMenu />
          </div>
        </header>
        <main id="main" className="flex-1">
          {isConnected || isReconnecting ? <Outlet /> : <ConnectGate />}
        </main>
      </div>

      {/* Bottom tab bar on phones */}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-bg-elev/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-ink' : 'text-muted'}`}
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5" weight={isActive ? 'fill' : 'regular'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
