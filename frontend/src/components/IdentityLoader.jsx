import React, { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { checkUserIdentity } from '../utils/contracts'

export default function IdentityLoader({ onIdentityLoaded }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadIdentity = async () => {
      if (!isConnected || !address || !publicClient) return
      setLoading(true)
      setError(null)

      try {
        const identity = await checkUserIdentity(
          async (params) => await publicClient.readContract(params),
          address
        )

        if (identity.hasIdentity) {
          onIdentityLoaded({
            ...identity,
            createdAt: identity.createdAt ? Number(identity.createdAt) : Date.now()
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(loadIdentity, 1000)
    return () => clearTimeout(timer)
  }, [address, isConnected, publicClient, onIdentityLoaded])

  if (loading) return <p className="text-green-500 font-mono">Checking for existing identity...</p>

  if (error) return <p className="text-red-600 font-mono select-none">Error loading identity: {error}</p>

  return null
}
