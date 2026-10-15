import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, defineChain, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ERROR_MESSAGES, gatesAbi, registryAbi } from '../../src/config/abi.js'
import { DEFAULT_CHAIN_ID, DEFAULT_GATES_ADDRESS, DEFAULT_REGISTRY_ADDRESS } from '../../src/config/deployment.js'

const env = process.env

export const config = {
  chainId: Number(env.VITE_CHAIN_ID || DEFAULT_CHAIN_ID),
  rpcUrl: env.RPC_URL || env.VITE_RPC_URL || 'https://testnet.hashio.io/api',
  // same defaults as the app, so the API works with no address variables set
  registry: env.VITE_REGISTRY_ADDRESS || DEFAULT_REGISTRY_ADDRESS,
  gates: env.VITE_GATES_ADDRESS || DEFAULT_GATES_ADDRESS,
  // Demo credentials exist so testnet can be tried without a passport. They are
  // off by default on Hedera mainnet (295); set DEMO_ISSUANCE to override.
  demoIssuance: env.DEMO_ISSUANCE ? env.DEMO_ISSUANCE !== 'false' : Number(env.VITE_CHAIN_ID || DEFAULT_CHAIN_ID) !== 295,
  self: {
    endpoint: env.SELF_ENDPOINT || env.VITE_SELF_ENDPOINT || '',
    scope: env.SELF_SCOPE || env.VITE_SELF_SCOPE || 'uwi-identity',
    endpointType: env.VITE_SELF_ENDPOINT_TYPE || 'staging_https',
  },
}

export const chain = defineChain({
  id: config.chainId,
  name: config.chainId === 296 ? 'Hedera Testnet' : `Chain ${config.chainId}`,
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
})

export const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) })

const attestor = env.ATTESTOR_PRIVATE_KEY ? privateKeyToAccount(env.ATTESTOR_PRIVATE_KEY) : null
const walletClient = attestor ? createWalletClient({ chain, transport: http(config.rpcUrl), account: attestor }) : null

export const attestorAddress = attestor?.address ?? null

export const registry = { address: config.registry, abi: registryAbi }
export const gates = { address: config.gates, abi: gatesAbi }

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Turns a viem error into a stable { code, message } pair. */
export function explain(error) {
  if (error instanceof ApiError) return { code: error.code, message: error.message }
  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError)
    const name = revert?.data?.errorName
    if (name) return { code: name, message: ERROR_MESSAGES[name] ?? name }
    if (/insufficient (funds|balance)/i.test(error.message)) {
      return { code: 'RelayerOutOfGas', message: 'The issuing service is out of HBAR. Please try again later.' }
    }
    return { code: 'ChainError', message: error.shortMessage ?? 'The network rejected the transaction.' }
  }
  return { code: 'Internal', message: 'Something went wrong on our side.' }
}

const MIRROR = env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com'

/**
 * Hashio's eth_getTransactionReceipt can lag the network by tens of seconds,
 * while Hedera's mirror node usually knows within a couple. Poll both and take
 * whichever answers first.
 */
async function confirm(hash, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const [rpc, mirror] = await Promise.allSettled([
      publicClient.getTransactionReceipt({ hash }),
      fetch(`${MIRROR}/api/v1/contracts/results/${hash}`).then((r) => (r.ok ? r.json() : null)),
    ])
    if (rpc.status === 'fulfilled' && rpc.value) return rpc.value.status
    const m = mirror.status === 'fulfilled' ? mirror.value : null
    if (m?.result) return m.result === 'SUCCESS' ? 'success' : 'reverted'
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new ApiError(504, 'Pending', 'The network is slow to confirm. Your action was submitted; refresh in a minute.')
}

/**
 * Simulate (so reverts surface as readable errors before any gas is spent),
 * send from the attestor and wait for the receipt. Retries once on a nonce
 * race, which happens when two serverless instances send at the same moment.
 */
export async function sendAsAttestor(contract, functionName, args) {
  if (!walletClient) throw new ApiError(503, 'NotConfigured', 'Issuance is not configured (ATTESTOR_PRIVATE_KEY missing).')
  const { request, result } = await publicClient.simulateContract({ ...contract, functionName, args, account: attestor })
  // Hedera's estimate ignores SSTORE-clear refunds, so storage-freeing calls
  // (revoke, recover) run out of gas at the raw estimate. Hedera bills at least
  // 80% of the limit, so the margin is kept modest.
  const estimate = await publicClient.estimateContractGas({ ...contract, functionName, args, account: attestor })
  request.gas = (estimate * 150n) / 100n
  // viem's EIP-1559 fee guess misreads Hedera's block fee data and can price a
  // tx below the network minimum. Hedera's real price comes from eth_gasPrice.
  request.type = 'legacy'
  request.gasPrice = await publicClient.getGasPrice()
  delete request.maxFeePerGas
  delete request.maxPriorityFeePerGas

  for (let attempt = 0; ; attempt++) {
    try {
      const hash = await walletClient.writeContract(request)
      const status = await confirm(hash)
      if (status !== 'success') throw new ApiError(502, 'Reverted', 'The transaction reverted on-chain.')
      return { hash, result }
    } catch (error) {
      const nonceRace = /nonce|replacement transaction|already known/i.test(error?.message ?? '')
      if (nonceRace && attempt < 2) continue
      throw error
    }
  }
}
