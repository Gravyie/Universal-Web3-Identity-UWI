import { Link } from 'react-router-dom'
import { LogoMark } from './Logo'
import { explorer } from '../config/contract'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark className="size-5 text-accent" />
            <span className="font-semibold tracking-[-0.03em]">UWI</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A reusable proof-of-personhood layer for Web3. Running on Hedera testnet — credentials here are for
            testing, not production use.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
          <Link className="text-ink-2 hover:text-ink" to="/create">Create identity</Link>
          <Link className="text-ink-2 hover:text-ink" to="/verify">Verify an address</Link>
          <Link className="text-ink-2 hover:text-ink" to="/#builders">For builders</Link>
          <a className="text-ink-2 hover:text-ink" href={explorer.contract()} target="_blank" rel="noreferrer">Contract</a>
          <a className="text-ink-2 hover:text-ink" href="https://self.xyz" target="_blank" rel="noreferrer">Self Protocol</a>
          <a className="text-ink-2 hover:text-ink" href="https://github.com/Gravyie/Universal-Web3-Identity-UWI" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
