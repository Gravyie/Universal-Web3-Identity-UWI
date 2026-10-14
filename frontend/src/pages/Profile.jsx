import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { DownloadSimple, ShareNetwork, UserCircleMinus } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { EmptyState, Skeleton } from '../components/ui/primitives'
import { HoloCard } from '../components/holo/HoloCard'
import { CredentialDetails } from '../components/CredentialDetails'
import { useCredential, useResolve } from '../hooks/useCredential'
import { useCardActions } from '../hooks/useCardActions'
import { shortAddress } from '../lib/format'
import { easeOutExpo } from '../lib/motion'

export default function Profile() {
  const { handle } = useParams()
  const resolved = useResolve(handle)
  const { status, credential, address } = useCredential(resolved.address)
  const { address: viewer } = useAccount()
  const isMe = viewer && address && viewer.toLowerCase() === address.toLowerCase()

  if (resolved.status === 'loading' || status === 'loading') {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <Skeleton className="aspect-[1.586] rounded-[20px]" />
        <div>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-6 h-64 rounded-[20px]" />
        </div>
      </div>
    )
  }

  if (resolved.status === 'none' || status === 'none' || resolved.status === 'idle') {
    const isAddress = handle?.startsWith('0x')
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={UserCircleMinus}
          title={isAddress ? 'Not a verified human' : `No one is @${handle?.replace(/^@/, '')}`}
          body={
            isAddress
              ? `${shortAddress(handle, 8, 6)} doesn't hold a UWI credential. Apps checking UWI will treat it as unverified.`
              : 'That username is free. It could be yours.'
          }
          action={<Button to="/start">{isAddress ? 'Get verified' : 'Claim it'}</Button>}
        />
      </div>
    )
  }

  if (status === 'error' || resolved.status === 'error') {
    return <EmptyState title="Couldn't reach Hedera" body="The network didn't respond. Refresh to try again." />
  }

  return <Found credential={credential} address={address} isMe={isMe} />
}

function Found({ credential, address, isMe }) {
  const cardRef = useRef(null)
  const { save, share, saving } = useCardActions(cardRef, credential.username)
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <motion.div initial={{ opacity: 0, y: 24, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: easeOutExpo }}>
        <HoloCard
          ref={cardRef}
          username={credential.username}
          address={address}
          tokenId={credential.tokenId}
          issuedAt={credential.issuedAt}
          proof={credential.proof}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: easeOutExpo }}>
        <p className="text-sm text-muted">{isMe ? 'Your public profile' : 'Verified human'}</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-[-0.045em] break-words text-ink">@{credential.username}</h1>
        <p className="mt-3 text-ink-2">
          {credential.proof === 'self'
            ? 'This wallet belongs to one unique, verified person. Their identity documents never left their phone.'
            : 'This wallet holds a demo credential from UWI testnet. It is not backed by a passport proof.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={share}>
            <ShareNetwork className="size-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={save} loading={saving}>
            {!saving && <DownloadSimple className="size-4" />} Save image
          </Button>
        </div>
        <div className="mt-8">
          <CredentialDetails credential={credential} address={address} />
        </div>
      </motion.div>
    </div>
  )
}
