import { useCallback } from 'react'
import { useAccount, usePublicClient, useSignMessage, useSignTypedData, useSwitchChain } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { demoMessage, typedData } from '../config/abi'
import { GATES_ADDRESS, REGISTRY_ADDRESS, gates, registry, uwiChain } from '../config/chain'
import { ApiError, api } from '../lib/api'

const DEADLINE_SECONDS = 15 * 60

function normalize(error) {
  if (error instanceof ApiError) return error
  const text = `${error?.shortMessage ?? ''} ${error?.message ?? ''}`
  if (/user (rejected|denied)|rejected the request|request rejected/i.test(text)) {
    return new ApiError('Rejected', 'You cancelled the request in your wallet.')
  }
  if (/chain|network/i.test(text) && /switch|mismatch/i.test(text)) {
    return new ApiError('WrongNetwork', `Switch your wallet to ${uwiChain.name} and try again.`)
  }
  return new ApiError('Wallet', error?.shortMessage ?? 'Your wallet returned an error.')
}

/**
 * Every write in UWI is gasless: the wallet signs, the relayer submits, the
 * contract verifies the signature. This hook wraps that loop for each action.
 */
export function useGasless() {
  const { address, chainId } = useAccount()
  const client = usePublicClient({ chainId: uwiChain.id })
  const { switchChainAsync } = useSwitchChain()
  const { signTypedDataAsync } = useSignTypedData()
  const { signMessageAsync } = useSignMessage()
  const queryClient = useQueryClient()

  const run = useCallback(
    async (fn) => {
      try {
        const result = await fn()
        // Every read may have changed: credentials, gates, counts.
        await queryClient.invalidateQueries()
        return result
      } catch (error) {
        throw normalize(error)
      }
    },
    [queryClient],
  )

  // Wallets refuse typed data whose domain chain differs from the active chain.
  const ensureChain = useCallback(async () => {
    if (chainId !== uwiChain.id) await switchChainAsync({ chainId: uwiChain.id })
  }, [chainId, switchChainAsync])

  const deadline = () => BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS)
  const nonce = (contract) => client.readContract({ ...contract, functionName: 'nonces', args: [address] })

  const createDemoCredential = useCallback(
    (username) =>
      run(async () => {
        const issuedAt = new Date().toISOString()
        const signature = await signMessageAsync({ message: demoMessage({ address, username, issuedAt }) })
        return api.demo({ address, username, issuedAt, signature })
      }),
    [run, signMessageAsync, address],
  )

  const joinGate = useCallback(
    (gateId) =>
      run(async () => {
        await ensureChain()
        const d = deadline()
        const signature = await signTypedDataAsync({
          domain: typedData.gatesDomain(uwiChain.id, GATES_ADDRESS),
          types: { JoinGate: typedData.types.JoinGate },
          primaryType: 'JoinGate',
          message: { gateId: BigInt(gateId), account: address, nonce: await nonce(gates), deadline: d },
        })
        return api.relay('join', { gateId: String(gateId), account: address, deadline: d.toString(), signature })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, ensureChain, signTypedDataAsync, address, client],
  )

  const createGate = useCallback(
    (params) =>
      run(async () => {
        await ensureChain()
        const d = deadline()
        const p = {
          name: params.name,
          description: params.description,
          closesAt: BigInt(params.closesAt ?? 0),
          capacity: Number(params.capacity ?? 0),
          strict: Boolean(params.strict),
        }
        const signature = await signTypedDataAsync({
          domain: typedData.gatesDomain(uwiChain.id, GATES_ADDRESS),
          types: { CreateGate: typedData.types.CreateGate },
          primaryType: 'CreateGate',
          message: { creator: address, ...p, nonce: await nonce(gates), deadline: d },
        })
        const res = await api.relay('createGate', {
          creator: address,
          params: { ...p, closesAt: p.closesAt.toString() },
          deadline: d.toString(),
          signature,
        })
        return { ...res, gateId: res.result }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, ensureChain, signTypedDataAsync, address, client],
  )

  const closeGate = useCallback(
    (gateId) =>
      run(async () => {
        await ensureChain()
        const d = deadline()
        const signature = await signTypedDataAsync({
          domain: typedData.gatesDomain(uwiChain.id, GATES_ADDRESS),
          types: { CloseGate: typedData.types.CloseGate },
          primaryType: 'CloseGate',
          message: { gateId: BigInt(gateId), creator: address, nonce: await nonce(gates), deadline: d },
        })
        return api.relay('closeGate', { gateId: String(gateId), creator: address, deadline: d.toString(), signature })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, ensureChain, signTypedDataAsync, address, client],
  )

  const revokeCredential = useCallback(
    (tokenId) =>
      run(async () => {
        await ensureChain()
        const d = deadline()
        const signature = await signTypedDataAsync({
          domain: typedData.registryDomain(uwiChain.id, REGISTRY_ADDRESS),
          types: { Revoke: typedData.types.Revoke },
          primaryType: 'Revoke',
          message: { tokenId: BigInt(tokenId), nonce: await nonce(registry), deadline: d },
        })
        return api.relay('revoke', { tokenId: String(tokenId), deadline: d.toString(), signature })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, ensureChain, signTypedDataAsync, address, client],
  )

  return { createDemoCredential, joinGate, createGate, closeGate, revokeCredential }
}
