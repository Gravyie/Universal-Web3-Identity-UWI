import { uwiAbi } from './abi'
import { uwiChain } from './web3'

export const UWI_ADDRESS =
  import.meta.env.VITE_UWI_CONTRACT_ADDRESS || '0xc010C027c557dB20F5A0cE653Cca257A3De24843'

export { uwiAbi }

export const uwiContract = { address: UWI_ADDRESS, abi: uwiAbi, chainId: uwiChain.id }

const EXPLORER = 'https://hashscan.io/testnet'

export const explorer = {
  tx: (hash) => `${EXPLORER}/transaction/${hash}`,
  address: (address) => `${EXPLORER}/account/${address}`,
  contract: () => `${EXPLORER}/contract/${UWI_ADDRESS}`,
}

export const HBAR_FAUCET = 'https://portal.hedera.com/faucet'
