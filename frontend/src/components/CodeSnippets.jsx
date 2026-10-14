import { useState } from 'react'
import * as RTabs from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { CopyButton } from './ui/primitives'
import { GATES_ADDRESS, REGISTRY_ADDRESS } from '../config/chain'

const origin = typeof window !== 'undefined' ? window.location.origin : 'https://uwi.app'

export const SNIPPETS = {
  rest: {
    label: 'REST',
    code: `# Any backend, any language. Address or username.
curl ${origin}/api/v1/humans/ada_lovelace

{
  "verified": true,
  "strict": true,
  "username": "ada_lovelace",
  "address": "0x7a3F...4F61",
  "proof": "self",
  "issuedAt": "2026-10-14T19:49:01.000Z"
}`,
  },
  solidity: {
    label: 'Solidity',
    code: `interface IUWI {
    function isVerifiedHumanStrict(address) external view returns (bool);
}

contract FairAirdrop {
    IUWI constant UWI = IUWI(${REGISTRY_ADDRESS});
    mapping(address => bool) public claimed;

    function claim() external {
        require(UWI.isVerifiedHumanStrict(msg.sender), "Verify with UWI first");
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;
        // transfer tokens
    }
}`,
  },
  viem: {
    label: 'TypeScript',
    code: `import { createPublicClient, http, parseAbi } from 'viem'
import { hederaTestnet } from 'viem/chains'

const client = createPublicClient({ chain: hederaTestnet, transport: http() })

const human = await client.readContract({
  address: '${REGISTRY_ADDRESS}',
  abi: parseAbi(['function isVerifiedHumanStrict(address) view returns (bool)']),
  functionName: 'isVerifiedHumanStrict',
  args: [wallet],
})`,
  },
  gates: {
    label: 'Gate export',
    code: `# Every unique human on a gate, as CSV, ready for your airdrop script.
curl -o allowlist.csv "${origin}/api/v1/gates/1?format=csv"

# Or read it on-chain from the Gates contract:
# ${GATES_ADDRESS}
# members(gateId, offset, limit) -> (account, tokenId, joinedAt)[]`,
  },
}

function highlight(code) {
  const parts = code.split(/(#.*$|\/\/.*$|'[^']*'|"[^"]*"|\b(?:function|contract|interface|external|view|returns|require|import|from|const|await|mapping|public|bool|address|constant|true|false)\b)/gm)
  return parts.map((t, i) => {
    if (!t) return null
    if (t.startsWith('#') || t.startsWith('//')) return <span key={i} className="text-muted">{t}</span>
    if (t.startsWith("'") || t.startsWith('"')) return <span key={i} className="text-accent">{t}</span>
    if (i % 2 === 1) return <span key={i} className="text-ink">{t}</span>
    return t
  })
}

export function CodeSnippets({ only, className = '' }) {
  const keys = only ?? Object.keys(SNIPPETS)
  const [tab, setTab] = useState(keys[0])
  return (
    <RTabs.Root value={tab} onValueChange={setTab} className={`min-w-0 overflow-hidden rounded-[20px] border border-line-strong bg-bg-elev ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-2">
        <RTabs.List className="flex gap-1 overflow-x-auto">
          {keys.map((k) => (
            <RTabs.Trigger key={k} value={k} className="relative shrink-0 rounded-full px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink data-[state=active]:text-ink">
              {tab === k && <motion.span layoutId={`snip-${keys.join()}`} className="absolute inset-0 rounded-full bg-surface-2" />}
              <span className="relative">{SNIPPETS[k].label}</span>
            </RTabs.Trigger>
          ))}
        </RTabs.List>
        <CopyButton value={SNIPPETS[tab].code} label="Copy code" message="Copied" />
      </div>
      {keys.map((k) => (
        <RTabs.Content key={k} value={k}>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-ink-2">
            <code>{highlight(SNIPPETS[k].code)}</code>
          </pre>
        </RTabs.Content>
      ))}
    </RTabs.Root>
  )
}
