import { AlertTriangle } from 'lucide-react'
import { useContractDeployed } from '../hooks/useIdentity'
import { UWI_ADDRESS } from '../config/contract'
import { shortAddress } from '../lib/format'

export function ContractBanner() {
  const deployed = useContractDeployed()
  if (deployed !== false) return null
  return (
    <div className="border-b border-warn/30 bg-warn/10 px-4 py-2.5 text-center text-[13px] text-ink-2" role="alert">
      <AlertTriangle className="mr-1.5 inline size-3.5 -translate-y-px text-warn" />
      No UWI contract found at <span className="font-mono text-ink">{shortAddress(UWI_ADDRESS)}</span> on Hedera
      testnet — it may have been wiped by a testnet reset. Redeploy and update{' '}
      <code className="font-mono text-ink">VITE_UWI_CONTRACT_ADDRESS</code>.
    </div>
  )
}
