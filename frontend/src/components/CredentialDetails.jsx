import { ArrowUpRight, Flask, SealCheck } from '@phosphor-icons/react'
import { Badge, CopyButton } from './ui/primitives'
import { explorer } from '../config/chain'
import { formatDate, padTokenId, shortAddress, shortHash } from '../lib/format'

/** The facts behind a credential, as a definition list. */
export function CredentialDetails({ credential, address }) {
  const rows = [
    [
      'Status',
      credential.proof === 'self' ? (
        <Badge tone="ok">
          <SealCheck weight="fill" className="size-3.5" /> Verified with Self
        </Badge>
      ) : (
        <Badge tone="warn">
          <Flask weight="fill" className="size-3.5" /> Demo credential
        </Badge>
      ),
    ],
    ['Strict check', credential.proof === 'self' ? 'Passes' : 'Fails (demo proof)'],
    ['Credential', <span className="font-mono">No. {padTokenId(credential.tokenId)}</span>],
    ['Issued', formatDate(credential.issuedAt, { dateStyle: 'medium', timeStyle: 'short' })],
    ...(credential.updatedAt !== credential.issuedAt ? [['Moved to this wallet', formatDate(credential.updatedAt, { dateStyle: 'medium' })]] : []),
    [
      'Holder',
      <span className="flex items-center justify-end gap-0.5 font-mono">
        <a href={explorer.account(address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
          {shortAddress(address, 6, 4)} <ArrowUpRight className="size-3" />
        </a>
        <CopyButton value={address} label="Copy address" message="Address copied" className="-my-1.5 -mr-1.5" />
      </span>,
    ],
    [
      'Nullifier hash',
      <span className="flex items-center justify-end gap-0.5 font-mono">
        {shortHash(credential.nullifier, 8, 4)}
        <CopyButton value={credential.nullifier} label="Copy nullifier hash" message="Copied" className="-my-1.5 -mr-1.5" />
      </span>,
    ],
  ]
  return (
    <dl className="divide-y divide-line rounded-[20px] border border-line bg-surface px-5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 truncate text-right text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
