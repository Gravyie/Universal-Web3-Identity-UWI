import { useMemo } from 'react'
import { useBytecode, useReadContract } from 'wagmi'
import { getAddress, isAddress } from 'viem'
import { uwiContract } from '../config/contract'
import { decodeTokenUri } from '../lib/identity'

/**
 * Reads a wallet's UWI credential from the contract.
 * status: 'idle' (no/invalid address) | 'loading' | 'none' | 'found' | 'no-contract' | 'error'
 */
export function useIdentity(address) {
  const valid = Boolean(address) && isAddress(address, { strict: false })
  // viem rejects mis-checksummed input, so normalise whatever the user pasted.
  const account = valid ? getAddress(address.toLowerCase()) : undefined

  const tokenIdQuery = useReadContract({
    ...uwiContract,
    functionName: 'getIdentityTokenId',
    args: [account],
    query: { enabled: valid },
  })

  const tokenId = tokenIdQuery.data
  const hasToken = typeof tokenId === 'bigint' && tokenId > 0n

  const dataQuery = useReadContract({
    ...uwiContract,
    functionName: 'getIdentityData',
    args: [tokenId],
    query: { enabled: hasToken },
  })

  const uriQuery = useReadContract({
    ...uwiContract,
    functionName: 'tokenURI',
    args: [tokenId],
    query: { enabled: hasToken, staleTime: Infinity },
  })

  const metadata = useMemo(() => decodeTokenUri(uriQuery.data), [uriQuery.data])

  let status = 'idle'
  if (valid) {
    // viem's ContractFunctionZeroDataError: the address has no code at all.
    if (tokenIdQuery.error?.walk?.((e) => e.name === 'ContractFunctionZeroDataError')) status = 'no-contract'
    else if (tokenIdQuery.isError || dataQuery.isError) status = 'error'
    else if (tokenIdQuery.isLoading || (hasToken && dataQuery.isLoading)) status = 'loading'
    else if (hasToken && dataQuery.data) status = 'found'
    else if (tokenIdQuery.isSuccess && !hasToken) status = 'none'
    else status = 'loading'
  }

  const identity = dataQuery.data
    ? {
        tokenId: tokenId.toString(),
        username: dataQuery.data.username,
        createdAt: Number(dataQuery.data.createdAt) * 1000,
        isVerified: dataQuery.data.isVerified,
        isSybilResistant: dataQuery.data.isSybilResistant,
        verificationHash: dataQuery.data.zkProofHash,
      }
    : null

  const refetch = async () => {
    await tokenIdQuery.refetch()
    await dataQuery.refetch()
  }

  return {
    status,
    identity,
    metadata,
    error: tokenIdQuery.error ?? dataQuery.error,
    refetch,
  }
}

export function useTotalSupply() {
  return useReadContract({
    ...uwiContract,
    functionName: 'totalSupply',
    query: { refetchInterval: 30_000 },
  })
}

/** false when there's no bytecode at the configured address (e.g. after a testnet reset). */
export function useContractDeployed() {
  const { data, isSuccess } = useBytecode({ address: uwiContract.address, chainId: uwiContract.chainId })
  return isSuccess ? Boolean(data && data !== '0x') : undefined
}
