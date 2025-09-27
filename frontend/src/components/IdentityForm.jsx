import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { mintIdentityNFT } from '../utils/contacts'


function IdentityForm({ onIdentityCreated }) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { address } = useAccount()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create identity metadata
      const identityData = {
        username: username.trim(),
        walletAddress: address,
        createdAt: new Date().toISOString(),
        version: '1.0'
      }

      // For now, we'll simulate the SBT minting process
      // In production, this would call your smart contract
      const result = await mintIdentityNFT(identityData)

      onIdentityCreated({
        ...identityData,
        tokenId: result.tokenId,
        transactionHash: result.hash
      })
    } catch (err) {
      setError('Failed to create identity. Please try again.')
      console.error('Identity creation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Identity</h2>
        <p className="text-gray-300">Enter your details to mint your Universal Web3 Identity</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Connected Wallet
          </label>
          <div className="bg-gray-800/50 rounded-lg p-3 text-gray-400">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Enter your username"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Identity...
            </div>
          ) : (
            'Create Universal Identity'
          )}
        </button>
      </form>
    </div>
  )
}

export default IdentityForm
