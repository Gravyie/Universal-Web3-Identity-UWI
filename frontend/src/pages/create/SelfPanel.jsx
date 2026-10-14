import { useMemo, useState } from 'react'
import { SelfAppBuilder, SelfQRcodeWrapper, getUniversalLink } from '@selfxyz/qrcode'
import { AlertTriangle, ExternalLink, QrCode, RotateCcw, Smartphone } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { selfConfig } from '../../config/self'
import { useIsMobile } from '../../hooks/useMediaQuery'

/**
 * Desktop: Self's websocket QR, which reports success back to this page.
 * Mobile: a universal link into the Self app; on success the app sends the
 * user back to `deeplinkCallback`, which the create page picks up.
 */
export default function SelfPanel({ address, username, onVerified, onLaunch }) {
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
        deeplinkCallback: `${window.location.origin}/create?self=verified`,
      }).build()
      return { app, buildError: null }
    } catch (e) {
      return { app: null, buildError: e.message }
    }
  }, [address, username])

  if (buildError) {
    return <ErrorBox title="Couldn't set up Self verification" reason={buildError} />
  }

  const retry = () => {
    setError(null)
    setAttempt((a) => a + 1)
  }

  if (error) {
    return (
      <ErrorBox title="Verification didn't go through" reason={error}>
        <Button variant="secondary" size="sm" className="mt-4" onClick={retry}>
          <RotateCcw className="size-3.5" /> Try again
        </Button>
      </ErrorBox>
    )
  }

  const qr = (
    <div className="mx-auto w-fit overflow-hidden rounded-3xl bg-white p-3 shadow-card ring-1 ring-line">
      <SelfQRcodeWrapper
        key={attempt} // remounting opens a fresh websocket session
        selfApp={app}
        size={232}
        showBorder={false}
        onSuccess={onVerified}
        onError={(data) => setError(data?.reason || data?.error_code || 'The Self app reported an error.')}
      />
    </div>
  )

  if (isMobile && !showQr) {
    return (
      <div className="rounded-3xl border border-line-strong bg-surface p-5">
        <Button
          href={getUniversalLink(app)}
          size="lg"
          className="w-full"
          onClick={onLaunch}
          target="_self"
        >
          <Smartphone className="size-4" /> Open the Self app
        </Button>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-muted">
          Self will scan your passport's chip, then send you back here.
        </p>
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="mx-auto mt-4 flex items-center gap-1.5 text-[13px] text-ink-2 underline-offset-4 hover:underline"
        >
          <QrCode className="size-3.5" /> Self is on another phone? Show a QR code
        </button>
      </div>
    )
  }

  return (
    <div className="grid items-center gap-6 rounded-3xl border border-line-strong bg-surface p-5 sm:grid-cols-[auto_1fr] sm:p-6">
      {qr}
      <ol className="space-y-4 text-[14.5px] text-ink-2">
        {[
          <>
            Install{' '}
            <a href="https://self.xyz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-ink underline-offset-4 hover:underline">
              Self <ExternalLink className="size-3" />
            </a>{' '}
            and scan your passport or ID's NFC chip.
          </>,
          'Scan this QR code from inside the Self app.',
          'Approve the request. Only “over 18” and a uniqueness check are shared.',
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[11px] text-muted">
              {i + 1}
            </span>
            <span className="pt-0.5">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ErrorBox({ title, reason, children }) {
  return (
    <div className="rounded-3xl border border-danger/30 bg-danger/5 p-5" role="alert">
      <div className="flex items-center gap-2 font-medium text-danger">
        <AlertTriangle className="size-4" /> {title}
      </div>
      <p className="mt-1.5 text-sm break-words text-ink-2">{reason}</p>
      {children}
    </div>
  )
}
