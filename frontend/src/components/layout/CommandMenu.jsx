import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { isAddress } from 'viem'
import { BookOpen, Desktop, Door, House, IdentificationCard, MagnifyingGlass, Moon, SquaresFour, Sun, UserCircle } from '@phosphor-icons/react'
import { useTheme } from '../../theme/ThemeProvider'

const itemCls =
  'flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-2 data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink'

/** ⌘K: jump anywhere, look up any human by address or username, switch theme. */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { setMode } = useTheme()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('uwi:command', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('uwi:command', onOpen)
    }
  }, [])

  const go = (to) => {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  const q = query.trim().replace(/^@/, '')
  const looksLikeAddress = isAddress(q, { strict: false })
  const looksLikeName = /^[a-z0-9_]{3,24}$/i.test(q)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-60 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[20px] border border-line-strong bg-bg-elev shadow-card outline-none data-[state=open]:animate-[dialog-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <Command loop>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass className="size-4 text-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, or look up an address or @username"
                className="h-13 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
            </div>
            <Command.List data-lenis-prevent className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted">No matches.</Command.Empty>

              {(looksLikeAddress || looksLikeName) && (
                <Command.Group heading="Look up" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted">
                  <Command.Item value={`lookup ${q}`} onSelect={() => go(`/u/${q}`)} className={itemCls}>
                    <UserCircle className="size-4" />
                    View {looksLikeAddress ? 'wallet' : `@${q}`}
                  </Command.Item>
                </Command.Group>
              )}

              <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted">
                {[
                  { icon: House, label: 'Home', to: '/' },
                  { icon: IdentificationCard, label: 'Get verified', to: '/app/verify' },
                  { icon: SquaresFour, label: 'Dashboard', to: '/app' },
                  { icon: Door, label: 'Gates', to: '/app/gates' },
                  { icon: BookOpen, label: 'Developers', to: '/app/developers' },
                ].map(({ icon: Icon, label, to }) => (
                  <Command.Item key={to} value={label} onSelect={() => go(to)} className={itemCls}>
                    <Icon className="size-4" /> {label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Theme" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted">
                {[
                  { icon: Sun, label: 'Light theme', mode: 'light' },
                  { icon: Moon, label: 'Dark theme', mode: 'dark' },
                  { icon: Desktop, label: 'System theme', mode: 'system' },
                ].map(({ icon: Icon, label, mode }) => (
                  <Command.Item
                    key={mode}
                    value={label}
                    onSelect={() => {
                      setMode(mode)
                      setOpen(false)
                    }}
                    className={itemCls}
                  >
                    <Icon className="size-4" /> {label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const openCommandMenu = () => window.dispatchEvent(new Event('uwi:command'))
