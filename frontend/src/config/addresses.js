// Plain constants with no wallet-library imports, so the landing page can use
// them without pulling in the wallet stack.
import { DEFAULT_GATES_ADDRESS, DEFAULT_REGISTRY_ADDRESS } from './deployment'

const env = import.meta.env

export const RPC_URL = 'https://testnet.hashio.io/api'
export const REGISTRY_ADDRESS = env.VITE_REGISTRY_ADDRESS || DEFAULT_REGISTRY_ADDRESS
export const GATES_ADDRESS = env.VITE_GATES_ADDRESS || DEFAULT_GATES_ADDRESS

const HASHSCAN = 'https://hashscan.io/testnet'
export const explorer = {
  tx: (hash) => `${HASHSCAN}/transaction/${hash}`,
  account: (address) => `${HASHSCAN}/account/${address}`,
  contract: (address) => `${HASHSCAN}/contract/${address}`,
}
