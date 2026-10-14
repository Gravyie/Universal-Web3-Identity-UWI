import { useState } from 'react'
import { motion } from 'motion/react'
import { CopyButton } from './ui/CopyButton'
import { UWI_ADDRESS } from '../config/contract'

const SNIPPETS = {
  solidity: {
    label: 'Solidity',
    code: `interface IUWI {
    function isVerifiedHuman(address user) external view returns (bool);
}

contract FairAirdrop {
    IUWI constant UWI = IUWI(${UWI_ADDRESS});
    mapping(address => bool) public claimed;

    function claim() external {
        require(UWI.isVerifiedHuman(msg.sender), "Not a verified human");
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;
        // ...transfer tokens
    }
}`,
  },
  viem: {
    label: 'viem',
    code: `import { createPublicClient, http, parseAbi } from 'viem'
import { hederaTestnet } from 'viem/chains'

const client = createPublicClient({ chain: hederaTestnet, transport: http() })

const isHuman = await client.readContract({
  address: '${UWI_ADDRESS}',
  abi: parseAbi(['function isVerifiedHuman(address) view returns (bool)']),
  functionName: 'isVerifiedHuman',
  args: [userAddress],
})`,
  },
  wagmi: {
    label: 'React',
    code: `import { useReadContract } from 'wagmi'

export function HumanGate({ address, children }) {
  const { data: isHuman } = useReadContract({
    address: '${UWI_ADDRESS}',
    abi: [{ type: 'function', name: 'isVerifiedHuman', stateMutability: 'view',
            inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }] }],
    functionName: 'isVerifiedHuman',
    args: [address],
  })
  return isHuman ? children : <p>Verify with UWI to continue.</p>
}`,
  },
}

// Minimal highlighter: comments, strings, keywords. Enough to make code scannable.
function highlight(code) {
  const tokens = code.split(/(\/\/.*$|'[^']*'|"[^"]*"|\b(?:function|contract|interface|external|view|returns|require|import|from|const|await|export|return|mapping|public|bool|address|constant)\b)/gm)
  return tokens.map((t, i) => {
    if (!t) return null
    if (t.startsWith('//')) return <span key={i} className="text-muted italic">{t}</span>
    if (t.startsWith("'") || t.startsWith('"')) return <span key={i} className="text-accent">{t}</span>
    if (/^[a-z]+$/.test(t) && i % 2 === 1) return <span key={i} className="text-ink">{t}</span>
    return <span key={i}>{t}</span>
  })
}

export function IntegrationSnippets() {
  const [tab, setTab] = useState('solidity')
  const { code } = SNIPPETS[tab]

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-bg-elev shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-2 sm:px-3">
        <div className="flex gap-1" role="tablist">
          {Object.entries(SNIPPETS).map(([id, s]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {tab === id && (
                <motion.span layoutId="snippet-tab" className="absolute inset-0 rounded-lg bg-surface-2" />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
        <CopyButton value={code} label="Copy code" message="Snippet copied" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] text-ink-2 sm:p-5">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
