import React, { useState } from 'react'
import { useAccount } from 'wagmi'

function IdentityForm({ onFormSubmit }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const { address } = useAccount()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!username.trim()) setError('Username is required')
    else if (username.trim().length < 3) setError('Min 3 characters')
    else if (username.trim().length > 30) setError('Max 30 characters')
    else if (!/^[a-zA-Z0-9_ ]+$/.test(username.trim())) setError('Letters, numbers, underscores only')
    else {
      setError('')
      onFormSubmit({
        username: username.trim(),
        walletAddress: address,
        timestamp: Date.now()
      })
    }
  }

  return (
    <div className="p-8 bg-black border border-green-500 max-w-md mx-auto rounded select-none">
      <h2 className="text-green-400 text-3xl font-mono font-bold mb-6">Create Your Identity</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-green-600 font-mono mb-2">Connected Wallet</label>
          <div className="border border-green-500 p-3 rounded font-mono select-all">
            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '(none)'}
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-green-600 font-mono mb-2">Username *</label>
          <input 
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-3 font-mono rounded border border-green-600 bg-black text-green-400 placeholder-green-700"
            placeholder="Enter unique username"
            maxLength={30}
          />
        </div>

        {error && <p className="text-red-600 font-mono">{error}</p>}

        <button 
          type="submit" 
          disabled={!username.trim()}
          className="w-full py-3 bg-green-500 text-black font-mono font-bold rounded hover:bg-green-600 transition disabled:bg-gray-700 disabled:text-gray-300"
        >
          Continue to Verification
        </button>
      </form>
    </div>
  )
}

export default IdentityForm
