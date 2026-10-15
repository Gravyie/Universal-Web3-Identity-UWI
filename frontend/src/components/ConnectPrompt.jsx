import { useAppKit } from '@reown/appkit/react'
import { Wallet } from '@phosphor-icons/react'
import { Button } from './ui/Button'

/** A quiet inline ask to connect, for the parts of a page that need a wallet. */
export function ConnectPrompt({ title = 'Connect your wallet', body, className = '' }) {
  const { open } = useAppKit()
  return (
    <div className={`flex flex-col gap-4 rounded-[20px] border border-dashed border-line-strong p-6 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <p className="font-medium text-ink">{title}</p>
        {body && <p className="mt-1 max-w-md text-sm text-ink-2">{body}</p>}
      </div>
      <Button onClick={() => open()} className="shrink-0">
        <Wallet className="size-4" /> Connect wallet
      </Button>
    </div>
  )
}
