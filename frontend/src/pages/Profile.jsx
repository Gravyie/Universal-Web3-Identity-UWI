import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { motion } from 'motion/react'
import { DownloadSimple, ShareNetwork, UserCircleMinus } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { PageContainer, PageHeader } from '../components/layout/Page'
import { Badge, EmptyState, Skeleton } from '../components/ui/primitives'
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
      <PageContainer>
        <Skeleton className="mb-8 h-9 w-56" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Skeleton className="aspect-[1.586] rounded-[20px]" />
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
      </PageContainer>
    )
  }

  if (resolved.status === 'none' || status === 'none' || resolved.status === 'idle') {
    const isAddress = handle?.startsWith('0x')
    return (
      <PageContainer>
        <div className="rounded-[20px] border border-dashed border-line-strong">
        <EmptyState
          icon={UserCircleMinus}
          title={isAddress ? 'Not a verified human' : `No one is @${handle?.replace(/^@/, '')}`}
          body={
            isAddress
              ? `${shortAddress(handle, 8, 6)} doesn't hold a UWI credential. Apps checking UWI will treat it as unverified.`
              : 'That username is free. It could be yours.'
          }
          action={<Button to="/app/verify">{isAddress ? 'Get verified' : 'Claim it'}</Button>}
        />
        </div>
      </PageContainer>
    )
  }

  if (status === 'error' || resolved.status === 'error') {
    return (
      <PageContainer>
        <EmptyState title="Couldn't reach Hedera" body="The network didn't respond. Refresh to try again." />
      </PageContainer>
    )
  }

  return <Found credential={credential} address={address} isMe={isMe} />
}

function Found({ credential, address, isMe }) {
  const cardRef = useRef(null)
  const { save, share, saving } = useCardActions(cardRef, credential.username)
  return (
    <PageContainer>
      <PageHeader
        title={`@${credential.username}`}
        description={
          credential.proof === 'self'
            ? 'This wallet belongs to one unique, verified person. Their documents never left their phone.'
            : 'This wallet holds a demo credential from UWI testnet. It is not backed by a passport proof.'
        }
        meta={<Badge tone={isMe ? 'accent' : 'neutral'}>{isMe ? 'Your public profile' : 'Public profile'}</Badge>}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={share}>
              <ShareNetwork className="size-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={save} loading={saving}>
              {!saving && <DownloadSimple className="size-4" />} Save image
            </Button>
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
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
          <CredentialDetails credential={credential} address={address} />
        </motion.div>
      </div>
    </PageContainer>
  )
}
