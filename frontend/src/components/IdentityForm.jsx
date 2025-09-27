import React, { useState } from 'react'
import { useAccount } from 'wagmi'

function IdentityForm({ onFormSubmit }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const { address } = useAccount()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Username is required')
      return
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    
    if (username.trim().length > 20) {
      setError('Username must be less than 20 characters')
      return
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }
    
    setError('')
    onFormSubmit({
      username: username.trim(),
      walletAddress: address,
      timestamp: Date.now()
    })
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
        <p className="text-gray-300">Choose your username for your Universal Web3 Identity</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Connected Wallet
          </label>
          <div className="bg-gray-800/50 rounded-lg p-3 text-gray-400 font-mono text-sm">
            {address?.slice(0, 8)}...{address?.slice(-6)}
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
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200"
            placeholder="Enter your unique username"
            maxLength={20}
          />
          <p className="text-xs text-gray-400 mt-1">
            3-20 characters, letters, numbers, and underscores only
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300">
            {error}
          </div>
        )}

        <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-purple-300">
              <p className="font-semibold mb-1">Next: Self Protocol Verification</p>
              <p>You'll verify your humanity using zero-knowledge proofs with your passport or ID. No personal data is stored or revealed.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!username.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Continue to Verification
        </button>
      </form>
    </div>
  )
}

export default IdentityForm
