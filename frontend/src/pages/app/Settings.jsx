import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { ArrowUpRight, ArrowsClockwise, Check, Trash } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { CopyButton } from '../../components/ui/primitives'
import { HoloCard } from '../../components/holo/HoloCard'
import { FOILS } from '../../components/holo/engine'
import { useTheme } from '../../theme/ThemeProvider'
import { FINISHES } from '../../theme/options'
import { useCredential, useServiceStatus } from '../../hooks/useCredential'
import { useGasless } from '../../hooks/useGasless'
import { GATES_ADDRESS, REGISTRY_ADDRESS, explorer, uwiChain } from '../../config/chain'
import { shortAddress } from '../../lib/format'
import { PageContainer, PageHeader } from '../../components/layout/Page'

function Section({ title, body, children }) {
  return (
    <section className="grid gap-6 border-t border-line py-10 first:border-t-0 first:pt-0 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-medium text-ink">{title}</h2>
        {body && <p className="mt-1 text-sm text-ink-2">{body}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export default function Settings() {
  const { address } = useAccount()
  const { credential } = useCredential(address)
  const { mode, setMode, finish, setFinish } = useTheme()
  const { data: service } = useServiceStatus()

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Appearance, your card, the network and your credential." />

      <div className="rounded-[20px] border border-line bg-surface px-6 py-8 sm:px-8">
        <Section title="Appearance" body="Saved on this device.">
          <div>
            <div>
              <p className="text-sm font-medium text-ink">Theme</p>
              <div className="mt-2 inline-flex rounded-full bg-surface-2 p-1">
                {['system', 'light', 'dark'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${mode === m ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Card finish" body="The foil on your credential card. Only you see this choice.">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {FINISHES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFinish(f)}
                aria-pressed={finish === f}
                className={`rounded-[20px] border p-2 text-left transition-colors ${finish === f ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}`}
              >
                <HoloCard foil={f} username={credential?.username} address={address} proof={credential?.proof ?? 'pending'} interactive={false} label={`${FOILS[f].label} finish preview`} />
                <span className="mt-2 block px-1 pb-1 text-sm font-medium text-ink">{FOILS[f].label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Network" body={`UWI runs on ${uwiChain.name}. Every write goes through the gasless relayer.`}>
          <dl className="divide-y divide-line rounded-[20px] border border-line bg-surface px-5 text-sm">
            {[
              ['Registry', REGISTRY_ADDRESS],
              ['Gates', GATES_ADDRESS],
              ['Relayer', service?.relayer?.address],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-muted">{k}</dt>
                <dd className="flex items-center gap-1 font-mono text-ink">
                  {v ? (
                    <>
                      <a className="inline-flex items-center gap-1 hover:text-accent" href={k === 'Relayer' ? explorer.account(v) : explorer.contract(v)} target="_blank" rel="noreferrer">
                        {shortAddress(v, 6, 4)} <ArrowUpRight className="size-3" />
                      </a>
                      <CopyButton value={v} label={`Copy ${k} address`} message="Copied" />
                    </>
                  ) : (
                    <span className="text-muted">Unavailable</span>
                  )}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">Relayer balance</dt>
              <dd className="text-ink">{service?.relayer?.balance ? `${Number(service.relayer.balance).toFixed(2)} HBAR` : '-'}</dd>
            </div>
          </dl>
        </Section>

        {credential && (
          <>
            <Section title="Recovery" body="What happens if you lose this wallet.">
              <div className="flex gap-3 rounded-[20px] border border-line bg-surface p-5 text-sm text-ink-2">
                <ArrowsClockwise className="mt-0.5 size-5 shrink-0 text-accent" />
                <p>
                  {credential.proof === 'self'
                    ? 'Connect a new wallet and verify with the same passport. Your passport produces the same nullifier, so your credential, username and gate memberships move to the new wallet.'
                    : 'Demo credentials are tied to this wallet and cannot be recovered. Verify with Self to get a recoverable credential.'}
                </p>
              </div>
            </Section>
            <Section title="Revoke credential" body="Burn your credential and release your username.">
              <RevokePanel credential={credential} />
            </Section>
          </>
        )}
      </div>
    </PageContainer>
  )
}

function RevokePanel({ credential }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const { revokeCredential } = useGasless()

  const revoke = async () => {
    setBusy(true)
    try {
      await revokeCredential(credential.tokenId)
      toast.success('Credential revoked')
      setOpen(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[20px] border border-danger/30 p-5">
      <p className="text-sm text-ink-2">
        Apps will stop recognising this wallet as a verified human. Gates you joined keep your past entry. You can verify again later.
      </p>
      <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        <Trash className="size-4" /> Revoke credential
      </Button>
      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (busy) return
          setOpen(o)
          setTyped('')
        }}
        title="Revoke your credential?"
        description="This burns the token on-chain. It can't be undone, but you can verify again afterwards."
      >
        <Field label={`Type ${credential.username} to confirm`}>
          {(a) => <Input {...a} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} />}
        </Field>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={revoke} loading={busy} disabled={typed !== credential.username}>
            Revoke
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
