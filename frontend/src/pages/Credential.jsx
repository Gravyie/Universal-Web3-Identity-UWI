import { useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { motion } from 'motion/react'
import { ArrowUpRight, BadgeCheck, Download, Lock, RotateCcw, Share2, UserRoundX } from 'lucide-react'
import { IdentityCard } from '../components/IdentityCard'
import { Guilloche } from '../components/Guilloche'
import { Button } from '../components/ui/Button'
import { CopyButton, useCopy } from '../components/ui/CopyButton'
import { useToast } from '../components/ui/Toast'
import { easeOutExpo } from '../lib/motion'
import { useIdentity } from '../hooks/useIdentity'
import { explorer } from '../config/contract'
import { isDemoHash } from '../lib/identity'
import { formatDate, padTokenId, shortAddress, shortHash } from '../lib/format'

export default function Credential() {
  const { address } = useParams()
  const [params] = useSearchParams()
  const { address: viewer } = useAccount()
  const { status, identity, metadata, refetch } = useIdentity(address)
  const justMinted = params.has('minted')
  const isOwner = viewer && address && viewer.toLowerCase() === address.toLowerCase()

  if (!isAddress(address ?? '', { strict: false })) {
    return <Empty title="That isn't a valid address" body="Wallet addresses start with 0x followed by 40 hex characters." />
  }
  if (status === 'loading' || status === 'idle') return <Skeleton />
  if (status === 'no-contract') {
    return <Empty title="The UWI contract isn't deployed" body="There's no contract at the configured address on Hedera testnet, so credentials can't be read right now." />
  }
  if (status === 'error') {
    return (
      <Empty title="Couldn't reach Hedera" body="The network didn't respond. Check your connection and try again.">
        <Button variant="secondary" onClick={refetch}>
          <RotateCcw className="size-4" /> Retry
        </Button>
      </Empty>
    )
  }
  if (status === 'none') {
    return (
      <Empty
        title={isOwner ? "You don't have a credential yet" : 'No credential for this address'}
        body={
          isOwner
            ? 'Verify once with Self and mint your soulbound UWI in a couple of minutes.'
            : `${shortAddress(address, 8, 6)} hasn't minted a UWI credential, so it can't be treated as a verified human.`
        }
      >
        {isOwner && <Button to="/create">Create your identity</Button>}
      </Empty>
    )
  }

  return <Found address={address} identity={identity} metadata={metadata} isOwner={isOwner} justMinted={justMinted} />
}

function Found({ address, identity, metadata, isOwner, justMinted }) {
  const cardRef = useRef(null)
  const toast = useToast()
  const { copy } = useCopy()
  const [exporting, setExporting] = useState(false)
  const demo = isDemoHash(identity.verificationHash)

  const download = async () => {
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      const a = document.createElement('a')
      a.href = url
      a.download = `uwi-${identity.username}.png`
      a.click()
      toast('Card saved', { type: 'success' })
    } catch {
      toast("Couldn't render the image", { type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const share = async () => {
    const url = window.location.origin + window.location.pathname
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${identity.username} on UWI`, text: 'Verified human on Universal Web3 Identity', url })
        return
      } catch {
        /* dismissed — fall through to copy */
      }
    }
    copy(url, 'Link copied')
  }

  const details = [
    ['Status', <span className="inline-flex items-center gap-1.5 text-accent"><BadgeCheck className="size-4" /> Verified human</span>],
    ['Proof', demo ? <span className="text-warn">Simulated (demo)</span> : <span>Self · zero-knowledge</span>],
    ['Token', <span className="font-mono">#{padTokenId(identity.tokenId)}</span>],
    ['Issued', formatDate(identity.createdAt, { dateStyle: 'medium', timeStyle: 'short' })],
    [
      'Owner',
      <span className="flex items-center gap-0.5 font-mono">
        {shortAddress(address, 6, 4)}
        <CopyButton value={address} label="Copy address" className="-my-2" />
      </span>,
    ],
    [
      'Verification hash',
      <span className="flex items-center gap-0.5 font-mono">
        {shortHash(identity.verificationHash, 10, 4)}
        <CopyButton value={identity.verificationHash} label="Copy hash" className="-my-2 -mr-2" />
      </span>,
    ],
  ]

  return (
    <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
      {justMinted && (
        <div className="pointer-events-none absolute top-0 left-1/2 -z-0 aspect-square w-[min(1000px,150vw)] -translate-x-1/2 -translate-y-1/4 text-accent">
          <Guilloche variant="seal" draw strokeWidth={0.2} opacity={0.35} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOutExpo }}
        className="relative max-w-2xl"
      >
        <div className="eyebrow flex items-center gap-2">
          {justMinted ? 'Credential minted' : isOwner ? 'Your credential' : 'Credential'}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] break-words text-ink sm:text-5xl">
          {justMinted ? (
            <>
              Welcome, <span className="font-display font-normal text-accent italic">@{identity.username}</span>
            </>
          ) : (
            <>
              <span className="font-display font-normal text-muted italic">@</span>
              {identity.username}
            </>
          )}
        </h1>
        <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink-2">
          {justMinted
            ? "You're counted. Any dApp that checks UWI will now recognise this wallet as a unique, verified human."
            : 'This wallet holds a soulbound UWI credential on Hedera testnet.'}
        </p>
      </motion.div>

      <div className="relative mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <motion.div
          initial={justMinted ? { opacity: 0, scale: 0.6, rotateY: -50, y: 60 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
          transition={justMinted ? { type: 'spring', stiffness: 70, damping: 14, delay: 0.2 } : { duration: 0.7, ease: easeOutExpo }}
          className="[perspective:1400px]"
        >
          <IdentityCard
            ref={cardRef}
            username={identity.username}
            address={address}
            tokenId={identity.tokenId}
            issuedAt={identity.createdAt}
            status="verified"
            demo={demo}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={download} loading={exporting}>
              {!exporting && <Download className="size-3.5" />} Save image
            </Button>
            <Button variant="secondary" size="sm" onClick={share}>
              <Share2 className="size-3.5" /> Share
            </Button>
            <Button variant="ghost" size="sm" href={explorer.address(address)}>
              HashScan <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
          className="space-y-4"
        >
          <dl className="divide-y divide-line rounded-3xl border border-line-strong bg-bg-elev px-5">
            {details.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-3.5 text-[14.5px]">
                <dt className="text-muted">{k}</dt>
                <dd className="min-w-0 truncate text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex gap-3 rounded-3xl border border-line bg-bg-elev p-5 text-sm leading-relaxed text-ink-2">
            <Lock className="mt-0.5 size-4 shrink-0 text-accent" />
            Soulbound: the contract rejects every transfer, so this credential can't be sold, lent or moved to a
            farm wallet.
          </div>

          {metadata?.image && (
            <div className="flex items-center gap-4 rounded-3xl border border-line bg-bg-elev p-4">
              <img src={metadata.image} alt="On-chain token art" className="size-20 rounded-xl ring-1 ring-line" />
              <div className="min-w-0 text-sm">
                <div className="font-medium text-ink">On-chain token art</div>
                <p className="mt-0.5 text-ink-2">
                  Rendered as SVG by the contract itself — it lives in <code className="font-mono text-[12px]">tokenURI</code>, not on a server.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6" aria-busy="true" aria-label="Loading credential">
      <div className="skeleton h-3 w-28 rounded" />
      <div className="skeleton mt-4 h-11 w-72 max-w-full rounded-lg" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="skeleton aspect-[1.586] w-full rounded-[1.6rem]" />
        <div className="skeleton h-72 rounded-3xl" />
      </div>
    </div>
  )
}

function Empty({ title, body, children }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
        <UserRoundX className="size-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
      <p className="mt-2 text-ink-2">{body}</p>
      {children && <div className="mt-8 flex gap-3">{children}</div>}
    </div>
  )
}
