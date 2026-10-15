// Plain constants with no wallet-library imports, so the landing page can use
// them without pulling in the wallet stack.
const env = import.meta.env

export const CHAIN_ID = 296
export const RPC_URL = 'https://testnet.hashio.io/api'
export const REGISTRY_ADDRESS = env.VITE_REGISTRY_ADDRESS || '0xd8EE88623fc33942E554A852530d3CeaB15c39d9'
export const GATES_ADDRESS = env.VITE_GATES_ADDRESS || '0xC20e25084E041A3638Adb713712888262Daa0C9C'

const HASHSCAN = 'https://hashscan.io/testnet'
export const explorer = {
  tx: (hash) => `${HASHSCAN}/transaction/${hash}`,
  account: (address) => `${HASHSCAN}/account/${address}`,
  contract: (address) => `${HASHSCAN}/contract/${address}`,
}
