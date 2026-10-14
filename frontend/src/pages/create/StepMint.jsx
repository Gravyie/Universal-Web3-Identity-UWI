import { useEffect, useMemo } from 'react'
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseEventLogs } from 'viem'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowUpRight, Gem, Repeat } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { CopyButton } from '../../components/ui/CopyButton'
import { HBAR_FAUCET, explorer, uwiAbi, uwiContract } from '../../config/contract'
import { selfConfig } from '../../config/self'
import { uwiChain } from '../../config/web3'
import { verificationHash } from '../../lib/identity'
import { shortAddress, shortHash } from '../../lib/format'
import { StepHeading } from './StepHeading'

function describeError(error) {
  if (!error) return null
  const text = `${error.shortMessage ?? ''} ${error.message ?? ''}`
  if (/user (rejected|denied)|rejected the request/i.test(text)) return { message: 'You declined the transaction in your wallet.' }
  if (/already has identity/i.test(text)) return { message: 'This wallet already holds a UWI credential.', already: true }
  if (/insufficient (funds|balance)/i.test(text)) return { message: "There isn't enough HBAR in this wallet to pay for gas.", faucet: true }
  return { message: error.shortMessage ?? 'The transaction failed. Please try again.' }
}

export function StepMint({ address, username, verification, onMinted, onBack, onAlreadyMinted }) {
  const { chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { writeContract, data: txHash, isPending: signing, error: writeError, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: uwiChain.id })

  const hash = useMemo(
    () =>
      verificationHash({
        address,
        scope: selfConfig.scope,
        username,
        verifiedAt: verification.verifiedAt,
        method: verification.method,
      }),
    [address, username, verification],
  )

  useEffect(() => {
    if (!receipt.data) return
    if (receipt.data.status !== 'success') return
    const [event] = parseEventLogs({ abi: uwiAbi, eventName: 'IdentityMinted', logs: receipt.data.logs })
    onMinted({ tokenId: event?.args.tokenId?.toString(), txHash })
  }, [receipt.data, txHash, onMinted])

  const wrongChain = chainId !== uwiChain.id
  const reverted = receipt.data?.status === 'reverted'
  const err = describeError(writeError ?? receipt.error) ?? (reverted ? { message: 'The transaction reverted on-chain.' } : null)
  const confirming = Boolean(txHash) && !receipt.data && !receipt.error

  const mint = () => {
    reset()
    writeContract({ ...uwiContract, functionName: 'mintIdentity', args: [address, username, hash] })
  }

  const rows = [
    ['Wallet', <span className="font-mono">{shortAddress(address, 8, 6)}</span>],
    ['Username', <span>@{username}</span>],
    [
      'Proof',
      <span className={verification.method === 'demo' ? 'text-warn' : 'text-accent'}>
        {verification.method === 'demo' ? 'Simulated (demo)' : 'Self · zero-knowledge'}
      </span>,
    ],
    [
      'Verification hash',
      <span className="flex items-center gap-1 font-mono">
        {shortHash(hash, 12, 6)}
        <CopyButton value={hash} label="Copy hash" className="-my-2 -mr-2" />
      </span>,
    ],
    ['Network', <span>{uwiChain.name}</span>],
  ]

  return (
    <div>
      <StepHeading
        icon={Gem}
        title="Mint your soulbound credential"
        body="One transaction writes your username and verification hash to Hedera. The token can never be transferred or sold."
      />

      <dl className="mt-8 divide-y divide-line rounded-3xl border border-line-strong bg-surface px-5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-3.5 text-[14.5px]">
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 truncate text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <AnimatePresence>
        {err && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
              <div className="text-ink-2">
                <p className="text-ink">{err.message}</p>
                {err.faucet && (
                  <a href={HBAR_FAUCET} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-accent hover:underline">
                    Get free test HBAR <ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {err.already && (
                  <button type="button" onClick={onAlreadyMinted} className="mt-1 text-accent hover:underline">
                    View your credential →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {wrongChain ? (
          <Button size="lg" onClick={() => switchChain({ chainId: uwiChain.id })} loading={switching}>
            {!switching && <Repeat className="size-4" />}
            Switch to {uwiChain.name}
          </Button>
        ) : (
          <Button size="lg" onClick={mint} loading={signing || confirming} disabled={signing || confirming}>
            {signing ? 'Confirm in your wallet…' : confirming ? 'Minting on Hedera…' : err ? 'Try again' : 'Mint credential'}
          </Button>
        )}
        {!signing && !confirming && (
          <Button variant="ghost" size="lg" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      {confirming && (
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          href={explorer.tx(txHash)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink"
        >
          <Spinner className="size-3.5" /> Transaction {shortHash(txHash)} <ArrowUpRight className="size-3.5" />
        </motion.a>
      )}

      <p className="mt-8 text-[13px] text-muted">
        Need gas?{' '}
        <a href={HBAR_FAUCET} target="_blank" rel="noreferrer" className="text-ink-2 underline-offset-4 hover:underline">
          Get free test HBAR from the Hedera faucet
        </a>
        .
      </p>
    </div>
  )
}
