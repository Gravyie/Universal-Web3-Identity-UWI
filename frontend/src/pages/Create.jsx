import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { IdentityCard } from '../components/IdentityCard'
import { useToast } from '../components/ui/Toast'
import { useIdentity } from '../hooks/useIdentity'
import { Stepper } from './create/Stepper'
import { useDraft } from './create/useDraft'
import { StepConnect } from './create/StepConnect'
import { StepUsername } from './create/StepUsername'
import { StepVerify } from './create/StepVerify'
import { StepMint } from './create/StepMint'

export default function Create() {
  const { address, isConnected } = useAccount()
  const { status: identityStatus } = useIdentity(address)
  const { draft, setUsername, markVerified, markSelfLaunched, canAcceptSelfReturn, resetVerification, clear } =
    useDraft(address)
  const [usernameInput, setUsernameInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const justMinted = useRef(false)

  useEffect(() => setUsernameInput(draft.username ?? ''), [draft.username])

  // Already holds a credential → there's nothing to create.
  useEffect(() => {
    if (identityStatus === 'found' && address && !justMinted.current) {
      toast('This wallet already has a UWI credential', { type: 'info' })
      navigate(`/id/${address}`, { replace: true })
    }
  }, [identityStatus, address, navigate, toast])

  // Coming back from the Self app on mobile (see SelfPanel's deeplinkCallback).
  useEffect(() => {
    if (params.get('self') !== 'verified' || !address) return
    if (canAcceptSelfReturn && !draft.verification) {
      markVerified('self')
      toast('Verified with Self', { type: 'success' })
    }
    setParams({}, { replace: true })
  }, [params, address, canAcceptSelfReturn, draft.verification, markVerified, setParams, toast])

  const onMinted = useCallback(
    ({ tokenId }) => {
      justMinted.current = true
      // Cached reads still say this wallet has no token; drop them so the
      // credential page loads fresh instead of flashing "not found".
      queryClient.removeQueries()
      navigate(`/id/${address}?minted=${tokenId ?? ''}`)
      clear()
    },
    [clear, navigate, address, queryClient],
  )

  let step = 'connect'
  if (isConnected && (identityStatus === 'none' || identityStatus === 'no-contract' || identityStatus === 'error')) {
    if (!draft.username || editing) step = 'username'
    else if (!draft.verification) step = 'verify'
    else step = 'mint'
  }

  const cardStatus = draft.verification ? 'verified' : step === 'verify' || step === 'mint' ? 'pending' : 'draft'
  const previewName = step === 'username' ? usernameInput : draft.username

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
      <div className="max-w-xl">
        <div className="eyebrow">New credential</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
          Create your <span className="font-display font-normal text-accent italic">identity</span>
        </h1>
      </div>

      <div className="mt-8 max-w-xl">
        <Stepper current={step} />
      </div>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* Live preview — first on mobile so people see what they're making */}
        <div className="lg:sticky lg:top-24 lg:order-2">
          <div className="mx-auto max-w-[460px]">
            <IdentityCard
              username={previewName}
              address={address}
              status={cardStatus}
              demo={draft.verification?.method === 'demo'}
            />
            <p className="mt-4 text-center font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Live preview
            </p>
          </div>
        </div>

        <section className="min-w-0 rounded-[2rem] border border-line bg-bg-elev p-6 sm:p-9 lg:order-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 'connect' && <StepConnect checking={isConnected && identityStatus === 'loading'} />}
              {step === 'username' && (
                <StepUsername
                  value={usernameInput}
                  onChange={setUsernameInput}
                  onSubmit={(name) => {
                    setUsername(name)
                    setEditing(false)
                  }}
                />
              )}
              {step === 'verify' && (
                <StepVerify
                  address={address}
                  username={draft.username}
                  onVerified={markVerified}
                  onLaunch={markSelfLaunched}
                  onBack={() => setEditing(true)}
                />
              )}
              {step === 'mint' && (
                <StepMint
                  address={address}
                  username={draft.username}
                  verification={draft.verification}
                  onMinted={onMinted}
                  onBack={resetVerification}
                  onAlreadyMinted={() => navigate(`/id/${address}`)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}
