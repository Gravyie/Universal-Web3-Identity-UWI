import { hederaTestnet } from '@reown/appkit/networks'
import { gatesAbi, registryAbi } from './abi'
import { GATES_ADDRESS, REGISTRY_ADDRESS } from './addresses'

// Multicall3 lives at its canonical address on Hedera testnet; registering it
// lets wagmi batch the dashboard's reads into one RPC call.
export const uwiChain = {
  ...hederaTestnet,
  contracts: { ...hederaTestnet.contracts, multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
}

export { REGISTRY_ADDRESS, GATES_ADDRESS, explorer } from './addresses'

export const registry = { address: REGISTRY_ADDRESS, abi: registryAbi, chainId: uwiChain.id }
export const gates = { address: GATES_ADDRESS, abi: gatesAbi, chainId: uwiChain.id }
