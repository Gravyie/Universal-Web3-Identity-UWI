import { useNavigate } from 'react-router-dom'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { CaretDown, Copy, IdentificationCard, SignOut, SquaresFour, Wallet, Warning } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { useCopy } from '../ui/primitives'
import { useCredential } from '../../hooks/useCredential'
import { uwiChain } from '../../config/chain'
import { hueFor } from '../holo/print'
import { shortAddress } from '../../lib/format'

const item =
  'flex cursor-default items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-ink-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink'

/** Connect button when signed out; identity menu when signed in. */
export function AccountMenu({ size = 'sm' }) {
  const { open } = useAppKit()
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { credential } = useCredential(address)
  const { copy } = useCopy()
  const navigate = useNavigate()

  if (!isConnected) {
    return (
      <Button size={size} onClick={() => open()} loading={isConnecting && !isReconnecting}>
        {!isConnecting && <Wallet className="size-4" />}
        Connect
      </Button>
    )
  }

  const wrongChain = chainId !== uwiChain.id
  const hue = hueFor(address)

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface pr-2.5 pl-1 text-[13px] text-ink transition-colors outline-none hover:bg-surface-2 data-[state=open]:bg-surface-2">
        <span
          className="size-7 rounded-full"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 82%), hsl(${(hue + 50) % 360} 60% 62%))` }}
        />
        <span className="max-w-28 truncate font-medium">
          {credential ? `@${credential.username}` : <span className="font-mono">{shortAddress(address, 5, 4)}</span>}
        </span>
        {wrongChain && <Warning weight="fill" className="size-4 text-warn" aria-label="Wrong network" />}
        <CaretDown className="size-3 text-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          className="z-60 w-60 rounded-[20px] border border-line-strong bg-bg-elev p-1.5 shadow-card data-[state=open]:animate-[dialog-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <div className="text-sm font-medium text-ink">{credential ? `@${credential.username}` : 'No credential yet'}</div>
            <div className="font-mono text-xs text-muted">{shortAddress(address, 8, 6)}</div>
          </div>
          <Menu.Separator className="mx-1 my-1 h-px bg-line" />
          {wrongChain && (
            <Menu.Item className={item} onSelect={() => open({ view: 'Networks' })}>
              <Warning className="size-4 text-warn" /> Switch to {uwiChain.name}
            </Menu.Item>
          )}
          <Menu.Item className={item} onSelect={() => navigate('/app')}>
            <SquaresFour className="size-4" /> Dashboard
          </Menu.Item>
          {credential ? (
            <Menu.Item className={item} onSelect={() => navigate(`/u/${credential.username}`)}>
              <IdentificationCard className="size-4" /> Public profile
            </Menu.Item>
          ) : (
            <Menu.Item className={item} onSelect={() => navigate('/app/verify')}>
              <IdentificationCard className="size-4" /> Get verified
            </Menu.Item>
          )}
          <Menu.Item className={item} onSelect={() => copy(address, 'Address copied')}>
            <Copy className="size-4" /> Copy address
          </Menu.Item>
          <Menu.Separator className="mx-1 my-1 h-px bg-line" />
          <Menu.Item className={item} onSelect={() => disconnect()}>
            <SignOut className="size-4" /> Disconnect
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
