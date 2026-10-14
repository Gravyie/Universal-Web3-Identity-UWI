import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { KeyRound, ShieldCheck, Wallet, Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StepHeading } from './StepHeading'

export function StepConnect({ checking }) {
  const { open } = useAppKit()
  const { isConnecting, isReconnecting } = useAccount()

  if (checking) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Spinner className="size-6 text-accent" />
        <p className="mt-4 text-ink-2">Checking for an existing credential…</p>
      </div>
    )
  }

  return (
    <div>
      <StepHeading
        icon={Wallet}
        title="Connect your wallet"
        body="Your credential is minted to this address and can never be moved, so pick the wallet you'll use with dApps."
      />
      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => open()} loading={isConnecting || isReconnecting}>
        {!isConnecting && <Wallet className="size-4" />}
        Connect wallet
      </Button>

      <ul className="mt-10 space-y-3.5 border-t border-line pt-8 text-[15px] text-ink-2">
        {[
          [KeyRound, 'UWI never asks for your seed phrase or private keys.'],
          [ShieldCheck, 'Connecting is read-only. Nothing is signed until you mint.'],
          [Zap, 'Works with browser wallets and mobile wallets via WalletConnect.'],
        ].map(([Icon, text]) => (
          <li key={text} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
