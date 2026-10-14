import { Link } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { GATES_ADDRESS, REGISTRY_ADDRESS, explorer } from '../../config/chain'

const COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Get verified', to: '/start' },
      { label: 'Dashboard', to: '/app' },
      { label: 'Gates', to: '/app/gates' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs and API', to: '/developers' },
      { label: 'Registry contract', href: explorer.contract(REGISTRY_ADDRESS) },
      { label: 'Gates contract', href: explorer.contract(GATES_ADDRESS) },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: 'https://github.com/Gravyie/Universal-Web3-Identity-UWI' },
      { label: 'Self Protocol', href: 'https://self.xyz' },
      { label: 'Holo card by Arlan Marat', href: 'https://www.arlan.me/vault/holo' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark className="size-5" />
            <span className="font-semibold tracking-[-0.04em]">UWI</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Proof of personhood for Web3. Running on Hedera testnet, so credentials here are for testing.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-medium text-ink">{col.title}</h3>
            <ul className="mt-3 grid gap-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link className="text-muted transition-colors hover:text-ink" to={l.to}>
                      {l.label}
                    </Link>
                  ) : (
                    <a className="text-muted transition-colors hover:text-ink" href={l.href} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}
