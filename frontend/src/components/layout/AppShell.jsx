import { NavLink, Outlet } from 'react-router-dom'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { BookOpen, Door, Gear, IdentificationCard, MagnifyingGlass, SealCheck, SquaresFour, Wallet } from '@phosphor-icons/react'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { Kbd, Tooltip } from '../ui/primitives'
import { ThemeMenu } from './ThemeMenu'
import { AccountMenu } from './AccountMenu'
import { openCommandMenu } from './CommandMenu'
import { PageContainer, PageHeader } from './Page'
import { useCredential, useServiceStatus } from '../../hooks/useCredential'
import { HoloCard } from '../holo/HoloCard'

function useNav() {
  const { address } = useAccount()
  const { credential } = useCredential(address)
  return [
    { to: '/app', label: 'Overview', icon: SquaresFour, end: true },
    credential
      ? { to: `/u/${credential.username}`, label: 'Profile', icon: IdentificationCard }
      : { to: '/app/verify', label: 'Get verified', icon: SealCheck },
    { to: '/app/gates', label: 'Gates', icon: Door },
    { to: '/app/developers', label: 'Developers', icon: BookOpen },
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

/** Pages that need a wallet show this instead of their content until one is connected. */
export function RequireWallet() {
  const { isConnected, isReconnecting } = useAccount()
  const { open } = useAppKit()
  if (isConnected || isReconnecting) return <Outlet />
  return (
    <PageContainer>
      <PageHeader title="Connect your wallet" description="Your credential and gates are tied to your wallet. Connecting is free and never costs gas." />
      <div className="grid items-center gap-10 rounded-[20px] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-ink-2">New here? Connect, pick a username and verify. It takes about two minutes.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" onClick={() => open()}>
              <Wallet className="size-4" /> Connect wallet
            </Button>
            <Button size="lg" variant="ghost" to="/app/developers">
              Browse the docs
            </Button>
          </div>
        </div>
        <HoloCard proof="pending" className="mx-auto w-full max-w-sm" />
      </div>
    </PageContainer>
  )
}

export function AppShell() {
  const nav = useNav()

  return (
    <div className="relative min-h-dvh bg-bg lg:grid lg:grid-cols-[244px_1fr]">
      {/* the same dawn light as the landing, kept very quiet */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] opacity-70 dark:opacity-100"
        style={{ background: 'radial-gradient(60% 100% at 70% 0%, var(--accent-soft), transparent 70%)' }}
      />

      <aside className="sticky top-0 z-30 hidden h-dvh flex-col border-r border-line bg-bg-elev/70 px-3 py-4 backdrop-blur-xl lg:flex">
        <div className="px-3 py-1.5">
          <Logo to="/" />
        </div>
        <button
          type="button"
          onClick={openCommandMenu}
          className="mt-5 flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[13px] text-muted hover:text-ink"
        >
          <MagnifyingGlass className="size-3.5" /> Search <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </button>
        <nav className="mt-5 grid gap-0.5" aria-label="App">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-full px-3 py-2 text-sm outline-offset-[-2px] transition-colors ${isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'}`
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

      <div className="relative flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-bg/75 px-4 backdrop-blur-xl sm:px-6">
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
        <main id="main" className="relative flex-1">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar on phones */}
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-bg-elev/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[10.5px] ${isActive ? 'text-ink' : 'text-muted'}`}>
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
