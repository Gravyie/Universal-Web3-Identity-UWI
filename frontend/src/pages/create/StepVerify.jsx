import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BadgeCheck, Check, FlaskConical, Info, ScanFace, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { demoVerifyAllowed, selfConfigured } from '../../config/self'
import { StepHeading } from './StepHeading'

const SelfPanel = lazy(() => import('./SelfPanel'))

const SHARED = [
  { label: 'Over 18', shared: true },
  { label: 'Unique document', shared: true },
  { label: 'Name', shared: false },
  { label: 'Birthday', shared: false },
  { label: 'Passport number', shared: false },
  { label: 'Nationality', shared: false },
]

export function StepVerify({ address, username, onVerified, onLaunch, onBack }) {
  const [success, setSuccess] = useState(false)

  const finish = (method) => {
    setSuccess(true)
    // Let the success state land before moving on.
    setTimeout(() => onVerified(method), 1100)
  }

  return (
    <div>
      <StepHeading
        icon={ScanFace}
        title="Prove you're a unique human"
        body="Self turns your passport into a zero-knowledge proof on your phone. UWI only learns the answers below."
      />

      <ul className="mt-6 flex flex-wrap gap-2">
        {SHARED.map((s) => (
          <li
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] ${
              s.shared ? 'border-accent/35 bg-accent-soft text-accent' : 'border-line-strong text-muted'
            }`}
          >
            {s.shared ? <Check className="size-3.5" strokeWidth={2.5} /> : <X className="size-3.5" />}
            {s.label}
          </li>
        ))}
      </ul>

      <div className="relative mt-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center rounded-3xl border border-accent/30 bg-accent-soft py-12 text-center"
            >
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                className="relative grid size-16 place-items-center rounded-full bg-accent text-on-accent"
              >
                <span className="absolute inset-0 rounded-full bg-accent [animation:pulse-ring_1.2s_ease-out_infinite]" />
                <BadgeCheck className="relative size-8" />
              </motion.span>
              <p className="mt-5 text-lg font-medium text-ink">Proof accepted</p>
              <p className="text-sm text-ink-2">On to minting…</p>
            </motion.div>
          ) : (
            <motion.div key="panel" exit={{ opacity: 0, scale: 0.98 }}>
              {selfConfigured ? (
                <Suspense
                  fallback={
                    <div className="grid h-72 place-items-center rounded-3xl border border-line-strong bg-surface text-muted">
                      <Spinner />
                    </div>
                  }
                >
                  <SelfPanel
                    address={address}
                    username={username}
                    onVerified={() => finish('self')}
                    onLaunch={onLaunch}
                  />
                </Suspense>
              ) : (
                <div className="flex gap-3 rounded-3xl border border-line-strong bg-surface p-5 text-sm text-ink-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" />
                  <p>
                    Self verification isn't configured for this deployment yet (<code className="font-mono text-[12px] text-ink">VITE_SELF_ENDPOINT</code>{' '}
                    is empty). You can still try the whole flow with a simulated proof.
                  </p>
                </div>
              )}

              {demoVerifyAllowed && (
                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-warn/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    <span className="font-medium text-warn">Testing?</span> Skip Self with a simulated proof. The
                    credential's hash is prefixed <code className="font-mono text-ink">demo:</code> so anyone can tell.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => finish('demo')} className="shrink-0">
                    <FlaskConical className="size-3.5" /> Simulate proof
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="button" onClick={onBack} className="mt-8 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        ← Change username
      </button>
    </div>
  )
}
