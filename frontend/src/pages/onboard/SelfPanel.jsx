import { useMemo, useState } from 'react'
import { SelfAppBuilder, SelfQRcodeWrapper, getUniversalLink } from '@selfxyz/qrcode'
import { ArrowClockwise, DeviceMobile, QrCode, Warning } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { selfConfig } from '../../config/self'
import { useIsMobile } from '../../hooks/useMediaQuery'

/**
 * Desktop: Self's websocket QR, which tells this page when the proof landed.
 * Mobile: a universal link into the Self app with a callback back to /app/verify.
 * Either way the proof goes to api/self.js, which issues the credential.
 */
export default function SelfPanel({ address, username, onSubmitted, onLaunch }) {
  const isMobile = useIsMobile()
  const [showQr, setShowQr] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState(null)

  const { app, buildError } = useMemo(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: selfConfig.appName,
        scope: selfConfig.scope,
        endpoint: selfConfig.endpoint,
        endpointType: selfConfig.endpointType,
        logoBase64: `${window.location.origin}/favicon.svg`,
        userId: address,
        userIdType: 'hex',
        userDefinedData: `uwi:${username}`,
        disclosures: selfConfig.disclosures,
        deeplinkCallback: `${window.location.origin}/app/verify?self=done`,
      }).build()
      return { app, buildError: null }
    } catch (e) {
      return { app: null, buildError: e.message }
    }
  }, [address, username])

  if (buildError || error) {
    return (
      <div className="rounded-[20px] border border-danger/30 bg-danger/5 p-5" role="alert">
        <div className="flex items-center gap-2 font-medium text-danger">
          <Warning className="size-4" /> {buildError ? "Couldn't set up Self" : "Verification didn't go through"}
        </div>
        <p className="mt-1.5 text-sm break-words text-ink-2">{buildError ?? error}</p>
        {!buildError && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setError(null)
              setAttempt((a) => a + 1)
            }}
          >
            <ArrowClockwise className="size-3.5" /> Try again
          </Button>
        )}
      </div>
    )
  }

  if (isMobile && !showQr) {
    return (
      <div className="rounded-[20px] border border-line-strong bg-surface p-5">
        <Button href={getUniversalLink(app)} target="_self" size="lg" className="w-full" onClick={onLaunch}>
          <DeviceMobile className="size-4" /> Open the Self app
        </Button>
        <p className="mt-3 text-center text-[13px] text-muted">Self scans your passport, then sends you back here.</p>
        <button type="button" onClick={() => setShowQr(true)} className="mx-auto mt-4 flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
          <QrCode className="size-3.5" /> Self is on another phone? Show a QR code
        </button>
      </div>
    )
  }

  return (
    <div className="grid items-center gap-6 rounded-[20px] border border-line-strong bg-surface p-5 sm:grid-cols-[auto_1fr]">
      <div className="mx-auto w-fit overflow-hidden rounded-[16px] bg-white p-2.5 ring-1 ring-line">
        <SelfQRcodeWrapper
          key={attempt}
          selfApp={app}
          size={220}
          showBorder={false}
          onSuccess={onSubmitted}
          onError={(data) => setError(data?.reason || data?.error_code || 'The Self app reported an error.')}
        />
      </div>
      <ol className="grid gap-3.5 text-sm text-ink-2">
        {[
          'Install Self and add your passport or ID by scanning its chip.',
          'Scan this code from inside the Self app.',
          'Approve. Only "over 18" and a uniqueness check are shared.',
        ].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[11px] text-muted">{i + 1}</span>
            <span className="pt-0.5">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
