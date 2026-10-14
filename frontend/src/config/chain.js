import { hederaTestnet } from '@reown/appkit/networks'
import { gatesAbi, registryAbi } from './abi'

const env = import.meta.env

// Multicall3 lives at its canonical address on Hedera testnet; registering it
// lets wagmi batch the dashboard's reads into one RPC call.
export const uwiChain = {
  ...hederaTestnet,
  contracts: { ...hederaTestnet.contracts, multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
}

export const REGISTRY_ADDRESS = env.VITE_REGISTRY_ADDRESS || '0xd8EE88623fc33942E554A852530d3CeaB15c39d9'
export const GATES_ADDRESS = env.VITE_GATES_ADDRESS || '0xC20e25084E041A3638Adb713712888262Daa0C9C'

export const registry = { address: REGISTRY_ADDRESS, abi: registryAbi, chainId: uwiChain.id }
export const gates = { address: GATES_ADDRESS, abi: gatesAbi, chainId: uwiChain.id }

const HASHSCAN = 'https://hashscan.io/testnet'
export const explorer = {
  tx: (hash) => `${HASHSCAN}/transaction/${hash}`,
  account: (address) => `${HASHSCAN}/account/${address}`,
  contract: (address) => `${HASHSCAN}/contract/${address}`,
}
