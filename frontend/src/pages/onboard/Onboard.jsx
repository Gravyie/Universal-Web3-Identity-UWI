import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  ArrowRight,
  At,
  CheckCircle,
  Code,
  Door,
  Flask,
  IdentificationCard,
  Info,
  Key,
  ScanSmiley,
  ShieldCheck,
  UserCircle,
  Wallet,
  XCircle,
} from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Spinner } from '../../components/ui/Spinner'
import { HoloCard } from '../../components/holo/HoloCard'
import { PageContainer, PageHeader } from '../../components/layout/Page'
import { useCredential, useServiceStatus, useUsernameAvailable } from '../../hooks/useCredential'
import { useGasless } from '../../hooks/useGasless'
import { selfConfigured } from '../../config/self'
import { normalizeUsername, usernameProblem } from '../../lib/username'
import { readJSON, remove, writeJSON } from '../../lib/storage'
import { easeOutExpo } from '../../lib/motion'

const SelfPanel = lazy(() => import('./SelfPanel'))
const STEPS = ['Wallet', 'Username', 'Verify']
const draftKey = (a) => `uwi:draft:${a?.toLowerCase()}`

function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function Onboard() {
  const { address, isConnected, isReconnecting } = useAccount()
  const { status, credential, refetch } = useCredential(address)
  const [params, setParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [issuing, setIssuing] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  // Set the moment the user starts verifying, so the result reads as new even
  // if the credential lands in the cache before we flip to the issuing state.
  const [started, setStarted] = useState(false)
  const fresh = celebrate || started

  // Restore a draft for this wallet (mobile users come back from the Self app in a new tab).
  useEffect(() => {
    if (!address) return
    const d = readJSON(draftKey(address), {})
    if (d.username) {
      setUsername(d.username)
      setConfirmed(d.username)
    }
  }, [address])

  // Back from the Self app: the proof went to our backend; wait for the credential.
  useEffect(() => {
    if (params.get('self') === 'done') {
      setIssuing(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  // While issuing, poll the registry until the credential shows up.
  useEffect(() => {
    if (!issuing || status === 'found') return
    const t = setInterval(() => refetch(), 2500)
    return () => clearInterval(t)
  }, [issuing, status, refetch])

  useEffect(() => {
    if (issuing && status === 'found') {
      setIssuing(false)
      setCelebrate(true)
      remove(draftKey(address))
    }
  }, [issuing, status, address])

  let step = 'connect'
  if (isConnected) {
    if (status === 'loading' || status === 'idle') step = 'checking'
    else if (status === 'found') step = 'done'
    else if (issuing) step = 'issuing'
    else if (!confirmed) step = 'username'
    else step = 'verify'
  } else if (isReconnecting) step = 'checking'

  const stepIndex = { connect: 0, checking: 0, username: 1, verify: 2, issuing: 2, done: 3 }[step]
  const previewName = step === 'done' ? credential?.username : step === 'username' ? username : confirmed

  return (
    <PageContainer>
      <PageHeader
        title={step === 'done' ? (fresh ? `Welcome, @${credential.username}` : "You're verified") : 'Get verified'}
        description={
          step === 'done'
            ? 'Your credential is live on Hedera. Every app that checks UWI now sees one unique human.'
            : 'Prove you are one unique person, once. About two minutes, and you never pay gas.'
        }
        meta={
          step !== 'done' && (
            <ol className="flex items-center gap-3" aria-label="Progress">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3" aria-current={i === stepIndex ? 'step' : undefined}>
                  <span className={`inline-flex items-center gap-1.5 text-sm transition-colors ${i <= stepIndex ? 'text-ink' : 'text-muted'} ${i === stepIndex ? 'font-medium' : ''}`}>
                    {i < stepIndex ? (
                      <CheckCircle weight="fill" className="size-4 text-accent" />
                    ) : (
                      <span className={`grid size-5 place-items-center rounded-full text-[11px] ${i === stepIndex ? 'bg-ink text-bg' : 'bg-surface-2 text-muted'}`}>{i + 1}</span>
                    )}
                    {s}
                  </span>
                  {i < STEPS.length - 1 && <span className="h-px w-6 bg-line-strong sm:w-10" />}
                </li>
              ))}
            </ol>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-[20px] border border-line bg-surface p-6 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
            >
              {step === 'connect' && <ConnectStep />}
              {step === 'checking' && <Waiting text="Checking your wallet..." />}
              {step === 'username' && (
                <UsernameStep
                  value={username}
                  onChange={setUsername}
                  onSubmit={(name) => {
                    setConfirmed(name)
                    writeJSON(draftKey(address), { username: name })
                  }}
                />
              )}
              {step === 'verify' && (
                <VerifyStep
                  address={address}
                  username={confirmed}
                  onIssuing={() => setIssuing(true)}
                  onStart={setStarted}
                  onBack={() => setConfirmed(null)}
                />
              )}
              {step === 'issuing' && <Waiting text="Issuing your credential on Hedera..." sub="This usually takes a few seconds." />}
              {step === 'done' && <DoneStep credential={credential} />}
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="lg:sticky lg:top-24">
          <motion.div
            key={step === 'done' ? 'final' : 'preview'}
            initial={fresh ? { opacity: 0, scale: 0.7, rotateY: -60 } : false}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 13 }}
            className="mx-auto max-w-[520px] [perspective:1200px] lg:pt-4"
          >
            <HoloCard
              username={previewName}
              address={address}
              tokenId={credential?.tokenId}
              issuedAt={credential?.issuedAt}
              proof={credential?.proof ?? 'pending'}
            />
            <p className="mt-4 text-center text-xs text-muted">{step === 'done' ? 'Tilt it.' : 'Live preview of your card'}</p>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  )
}

function StepTitle({ icon: Icon, title, body }) {
  return (
    <div>
      <Icon className="size-6 text-accent" weight="duotone" />
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-ink">{title}</h2>
      {body && <p className="mt-2 max-w-lg text-ink-2">{body}</p>}
    </div>
  )
}

function Waiting({ text, sub }) {
  return (
    <div className="flex flex-col items-start gap-4 py-10" role="status">
      <Spinner className="size-6 text-accent" />
      <div>
        <p className="font-medium text-ink">{text}</p>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
    </div>
  )
}

function ConnectStep() {
  const { open } = useAppKit()
  return (
    <div>
      <StepTitle
        icon={Wallet}
        title="Connect your wallet"
        body="Your credential is bound to this wallet. Pick the one you use with apps; you can move it later by verifying again."
      />
      <Button size="lg" className="mt-8" onClick={() => open()}>
        <Wallet className="size-4" /> Connect wallet
      </Button>
      <ul className="mt-10 grid gap-3 border-t border-line pt-8 text-sm text-ink-2">
        {[
          [Key, 'UWI never asks for your seed phrase.'],
          [ShieldCheck, 'You only ever sign messages. Nothing costs gas.'],
        ].map(([Icon, t]) => (
          <li key={t} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent" /> {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function UsernameStep({ value, onChange, onSubmit }) {
  const name = normalizeUsername(value)
  const problem = usernameProblem(name)
  const debounced = useDebounced(name, 350)
  const settled = debounced === name
  const available = useUsernameAvailable(debounced, !problem)
  const checking = !problem && (!settled || available.isFetching)
  const taken = !problem && settled && available.data === false
  const ok = !problem && settled && available.data === true

  const submit = (e) => {
    e.preventDefault()
    if (ok) onSubmit(name)
  }

  let status = null
  if (name && problem) status = <span className="text-danger">{problem}</span>
  else if (checking) status = <span className="text-muted">Checking...</span>
  else if (taken) status = <span className="text-danger">Taken. Try another.</span>
  else if (ok) status = <span className="text-ok">Available</span>

  return (
    <form onSubmit={submit} noValidate>
      <StepTitle icon={At} title="Choose a username" body="It's public, printed on your card and unique across UWI. Apps can look you up by it." />
      <Field label="Username" className="mt-8" aside={<span className="text-xs">{status}</span>} hint="3 to 24 lowercase letters, numbers or underscores.">
        {(a11y) => (
          <Input
            {...a11y}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={name}
            maxLength={24}
            onChange={(e) => onChange(e.target.value)}
            placeholder="satoshi"
            invalid={Boolean(name && (problem || taken))}
            prefix={<span className="text-muted">@</span>}
            suffix={
              checking ? (
                <Spinner className="size-4 text-muted" />
              ) : ok ? (
                <CheckCircle weight="fill" className="size-5 text-ok" />
              ) : taken ? (
                <XCircle weight="fill" className="size-5 text-danger" />
              ) : null
            }
          />
        )}
      </Field>
      <Button type="submit" size="lg" className="mt-8" disabled={!ok}>
        Continue <ArrowRight className="size-4" />
      </Button>
    </form>
  )
}

function VerifyStep({ address, username, onIssuing, onStart, onBack }) {
  const { data: service } = useServiceStatus()
  const { createDemoCredential } = useGasless()
  const [demoBusy, setDemoBusy] = useState(false)
  const launched = useRef(false)

  const demo = async () => {
    setDemoBusy(true)
    onStart(true)
    try {
      await createDemoCredential(username)
      onIssuing()
    } catch (e) {
      onStart(false)
      toast.error(e.message)
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <div>
      <StepTitle icon={ScanSmiley} title="Prove you're a unique human" body="Self turns your passport into a proof on your phone. We learn you're over 18 and haven't registered before. Nothing else." />

      <div className="mt-8">
        {selfConfigured ? (
          <Suspense fallback={<div className="skeleton h-64 rounded-[20px]" />}>
            <SelfPanel
              address={address}
              username={username}
              onSubmitted={() => {
                onStart(true)
                onIssuing()
              }}
              onLaunch={() => {
                launched.current = true
              }}
            />
          </Suspense>
        ) : (
          <div className="flex gap-3 rounded-[20px] border border-line-strong bg-surface p-5 text-sm text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" />
            Passport verification needs this app to be deployed with a public Self endpoint. On this deployment you can use a demo credential instead.
          </div>
        )}
      </div>

      {service?.demoIssuance && (
        <div className="mt-4 flex flex-col gap-4 rounded-[20px] border border-dashed border-line-strong p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Flask className="mt-0.5 size-5 shrink-0 text-warn" weight="duotone" />
            <p className="text-sm text-ink-2">
              <span className="font-medium text-ink">No passport handy?</span> Get a demo credential by signing a message. It's marked as demo on-chain.
            </p>
          </div>
          <Button variant="secondary" onClick={demo} loading={demoBusy} className="shrink-0">
            Use demo
          </Button>
        </div>
      )}

      <p className="mt-6 flex gap-2 text-[13px] text-muted">
        <IdentificationCard className="mt-0.5 size-4 shrink-0" />
        Lost your old wallet? Verify with the same passport and your existing credential moves here.
      </p>
      <button type="button" onClick={onBack} className="mt-6 text-sm text-muted hover:text-ink">
        Change username
      </button>
    </div>
  )
}

function DoneStep({ credential }) {
  return (
    <div>
      <CheckCircle weight="fill" className="size-7 text-ok" />
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink">Credential No. {credential.tokenId} is yours</h2>
      <p className="mt-1.5 text-ink-2">Here is what you can do with it.</p>
      <ul className="mt-6 grid gap-2">
        {[
          { icon: Door, title: 'Run a Sybil-proof list', body: 'Allowlists and waitlists that admit each human once.', to: '/app/gates?new=1' },
          { icon: UserCircle, title: 'Share your profile', body: `Anyone can check @${credential.username} is a verified human.`, to: `/u/${credential.username}` },
          { icon: Code, title: 'Check humans in your app', body: 'One contract call or one GET request.', to: '/app/developers' },
        ].map(({ icon: Icon, title, body, to }, i) => (
          <motion.li key={to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08, ease: easeOutExpo, duration: 0.5 }}>
            <Link to={to} className="group flex items-center gap-4 rounded-[14px] border border-line bg-bg p-4 transition-colors hover:border-line-strong">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{title}</span>
                <span className="block truncate text-[13px] text-ink-2">{body}</span>
              </span>
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.li>
        ))}
      </ul>
      <Button to="/app" size="lg" className="mt-6">
        Open dashboard <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
