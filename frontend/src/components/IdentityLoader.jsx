import React, { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { checkUserIdentity } from '../utils/contracts'

export default function IdentityLoader({ onIdentityLoaded }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient() // wagmi RPC read client
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadIdentity = async () => {
      if (!isConnected || !address) return
      setLoading(true)
      setError(null)

      try {
        const identity = await checkUserIdentity(
          (params) => publicClient.callContract(params),
          address
        )
        if (identity.hasIdentity) {
          onIdentityLoaded(identity)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadIdentity()
  }, [address, isConnected, publicClient, onIdentityLoaded])

  if (loading) return <p>Loading your identity...</p>
  if (error) return <p>Error loading identity: {error}</p>

  return null
}
