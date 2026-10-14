import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowUpRight, MagnifyingGlass, SealCheck, ShieldWarning, UserCircleMinus } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Badge, CopyButton } from '../components/ui/primitives'
import { CodeSnippets } from '../components/CodeSnippets'
import { SystemPipeline } from '../components/Diagrams'
import { GATES_ADDRESS, REGISTRY_ADDRESS, explorer, uwiChain } from '../config/chain'
import { api } from '../lib/api'
import { easeOutExpo } from '../lib/motion'

const NAV = [
  ['lookup', 'Lookup'],
  ['rest', 'REST API'],
  ['contracts', 'Contracts'],
  ['architecture', 'Architecture'],
]

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/humans/:id', body: 'Is this address or username a verified human? Returns proof type, token and dates.' },
  { method: 'GET', path: '/api/v1/gates/:id', body: 'A gate and every member with username and proof type. Add ?format=csv for a download.' },
  { method: 'GET', path: '/api/status', body: 'Chain, contract addresses, relayer health and which verification paths are live.' },
  { method: 'POST', path: '/api/relay', body: 'Submit a signed join, createGate, closeGate or revoke. The contract checks the signature.' },
]

const FUNCTIONS = [
  ['isVerifiedHuman(address)', 'Any live credential, including testnet demo ones.'],
  ['isVerifiedHumanStrict(address)', 'Only credentials backed by a Self passport proof. Use this for anything with value.'],
  ['credentialOf(address)', 'Token id, username, proof type, issue and update times, nullifier hash.'],
  ['resolveUsername(string)', 'Username to holder address and token id.'],
  ['members(gateId, offset, limit)', 'Paginated gate members: wallet, credential id, joined time.'],
]

function H2({ id, children }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-[-0.035em] text-ink">
      {children}
    </h2>
  )
}

export default function Developers() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:grid lg:grid-cols-[200px_1fr] lg:gap-16">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 grid gap-1 text-sm" aria-label="On this page">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOutExpo }}>
          <h1 className="text-[clamp(2.2rem,4.5vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-ink">Build on UWI</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">
            Ask whether a wallet is a unique human from a contract, a backend or a browser. No API keys, no personal data to store.
          </p>
        </motion.div>

        <section className="mt-14">
          <H2 id="lookup">Lookup</H2>
          <p className="mt-2 text-ink-2">Try the API against live testnet data.</p>
          <Lookup />
        </section>

        <section className="mt-20">
          <H2 id="rest">REST API</H2>
          <p className="mt-2 text-ink-2">CORS-enabled and cached at the edge for a few seconds. Errors are always {'{ error: { code, message } }'}.</p>
          <div className="mt-6 divide-y divide-line rounded-[20px] border border-line bg-surface">
            {ENDPOINTS.map((e) => (
              <div key={e.path} className="grid gap-2 p-5 md:grid-cols-[auto_260px_1fr] md:items-baseline md:gap-5">
                <Badge tone={e.method === 'GET' ? 'accent' : 'warn'} className="w-fit font-mono">
                  {e.method}
                </Badge>
                <code className="font-mono text-[13px] text-ink">{e.path}</code>
                <p className="text-sm text-ink-2">{e.body}</p>
              </div>
            ))}
          </div>
          <CodeSnippets className="mt-6" only={['rest', 'gates']} />
        </section>

        <section className="mt-20">
          <H2 id="contracts">Contracts</H2>
          <p className="mt-2 text-ink-2">Deployed on {uwiChain.name} (chain {uwiChain.id}). Both are verified-source friendly and have no upgrade proxy.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['UWIRegistry', REGISTRY_ADDRESS, 'Soulbound credentials, one per human, with recovery and revocation.'],
              ['UWIGates', GATES_ADDRESS, 'Sybil-proof lists keyed by credential, with signature-based writes.'],
            ].map(([name, addr, body]) => (
              <div key={name} className="rounded-[20px] border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono text-sm font-medium text-ink">{name}</h3>
                  <a href={explorer.contract(addr)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                    HashScan <ArrowUpRight className="size-3" />
                  </a>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{body}</p>
                <div className="mt-4 flex items-center gap-1 rounded-[12px] bg-surface-2 px-3 py-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">{addr}</code>
                  <CopyButton value={addr} label={`Copy ${name} address`} message="Address copied" />
                </div>
              </div>
            ))}
          </div>
          <dl className="mt-6 divide-y divide-line rounded-[20px] border border-line bg-surface">
            {FUNCTIONS.map(([fn, body]) => (
              <div key={fn} className="grid gap-1 p-5 md:grid-cols-[300px_1fr] md:gap-5">
                <dt className="font-mono text-[13px] text-ink">{fn}</dt>
                <dd className="text-sm text-ink-2">{body}</dd>
              </div>
            ))}
          </dl>
          <CodeSnippets className="mt-6" only={['solidity', 'viem']} />
        </section>

        <section className="mt-20">
          <H2 id="architecture">Architecture</H2>
          <p className="mt-2 max-w-2xl text-ink-2">
            Self's verifier contracts live on Celo, so UWI verifies proofs off-chain in an attestor service and records the result on Hedera.
          </p>
          <div className="mt-10 md:mb-10">
            <SystemPipeline />
          </div>
          <div className="mt-6 flex gap-3 rounded-[20px] border border-line bg-surface p-5">
            <ShieldWarning className="mt-0.5 size-5 shrink-0 text-warn" />
            <div className="text-sm text-ink-2">
              <p className="font-medium text-ink">Trust model</p>
              <p className="mt-1">
                Only addresses the registry owner marks as attestors can issue or recover credentials, so you trust the attestor to have checked
                the Self proof. Everything else is enforced by the contracts: one credential per nullifier, one per wallet, no transfers, and
                every gasless write carries the user's own EIP-712 signature, so the relayer can't act for anyone.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Lookup() {
  const [input, setInput] = useState('')
  const lookup = useMutation({ mutationFn: (id) => api.human(id) })
  const submit = (e) => {
    e.preventDefault()
    const id = input.trim().replace(/^@/, '')
    if (id) lookup.mutate(id)
  }
  const r = lookup.data

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x... or username"
          aria-label="Address or username"
          spellCheck={false}
          autoCapitalize="off"
          prefix={<MagnifyingGlass className="size-4 text-muted" />}
        />
        <Button type="submit" loading={lookup.isPending} className="h-11">
          Look up
        </Button>
      </form>

      {lookup.isError && <p className="mt-3 text-sm text-danger">{lookup.error.message}</p>}

      {r && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="flex items-start gap-4 rounded-[20px] border border-line bg-surface p-5">
            <div className={`grid size-10 shrink-0 place-items-center rounded-full ${r.verified ? 'bg-ok text-white' : 'bg-surface-2 text-muted'}`}>
              {r.verified ? <SealCheck weight="fill" className="size-5" /> : <UserCircleMinus className="size-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink">{r.verified ? 'Verified human' : 'Not verified'}</p>
              <p className="mt-0.5 text-sm text-ink-2">
                {r.verified ? (
                  <>
                    <Link to={`/u/${r.username}`} className="text-accent hover:underline">
                      @{r.username}
                    </Link>{' '}
                    holds credential No. {r.tokenId}, {r.strict ? 'backed by a Self proof.' : 'from a testnet demo.'}
                  </>
                ) : (
                  'No UWI credential for this wallet or username.'
                )}
              </p>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-[20px] border border-line bg-bg-elev p-5 font-mono text-[12.5px] leading-relaxed text-ink-2">
            {JSON.stringify(r, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  )
}
