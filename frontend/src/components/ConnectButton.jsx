import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { Wallet } from 'lucide-react'
import { Button } from './ui/Button'
import { shortAddress } from '../lib/format'
import { uwiChain } from '../config/web3'

export function ConnectButton({ size = 'sm', className = '' }) {
  const { open } = useAppKit()
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount()

  if (!isConnected) {
    return (
      <Button size={size} onClick={() => open()} loading={isConnecting && !isReconnecting} className={className}>
        {!isConnecting && <Wallet className="size-4" />}
        Connect
      </Button>
    )
  }

  const wrongChain = chainId !== uwiChain.id
  return (
    <button
      type="button"
      onClick={() => open({ view: wrongChain ? 'Networks' : 'Account' })}
      className={`inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface pr-3.5 pl-2.5 font-mono text-[13px] text-ink transition-colors hover:bg-surface-2 ${className}`}
    >
      <span className="relative flex size-2">
        <span className={`absolute inset-0 rounded-full ${wrongChain ? 'bg-warn' : 'bg-accent'}`} />
        {!wrongChain && <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" />}
      </span>
      {wrongChain ? 'Wrong network' : shortAddress(address, 5, 4)}
    </button>
  )
}
