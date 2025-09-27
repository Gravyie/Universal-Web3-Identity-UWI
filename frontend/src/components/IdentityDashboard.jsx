import React from 'react'
import { useAccount } from 'wagmi'

function IdentityDashboard({ userData }) {
  const { address } = useAccount()

  const compatibleDApps = [
    {
      name: "DeFi Protocol",
      category: "Finance",
      description: "Access age-verified DeFi without KYC",
      icon: "💰",
      status: "Ready"
    },
    {
      name: "DAO Governance",
      category: "Governance", 
      description: "Vote in DAOs with human verification",
      icon: "🗳️",
      status: "Ready"
    },
    {
      name: "Social Network",
      category: "Social",
      description: "Join Sybil-resistant social platforms",
      icon: "👥",
      status: "Ready"
    },
    {
      name: "Gaming Platform",
      category: "Gaming",
      description: "Play games with verified human players",
      icon: "🎮",
      status: "Ready"
    },
    {
      name: "NFT Marketplace",
      category: "NFTs",
      description: "Trade NFTs with verified identity",
      icon: "🖼️",
      status: "Ready"
    },
    {
      name: "Airdrops",
      category: "Rewards",
      description: "Claim airdrops as verified human",
      icon: "🎁",
      status: "Ready"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Main Identity Card */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-500/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{userData.username}</h2>
              <p className="text-gray-300">Universal Web3 Identity</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Verified
            </span>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
              🛡️ Sybil Resistant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Token ID</h3>
            <p className="text-xl font-bold text-cyan-400">#{userData.tokenId}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Wallet Address</h3>
            <p className="text-lg font-mono text-white">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Created</h3>
            <p className="text-lg text-white">{new Date(userData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verification Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Self Protocol Verification</span>
              <span className="text-green-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Zero-Knowledge Proof</span>
              <span className="text-green-400">✓ Generated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Age Verification (≥18)</span>
              <span className="text-green-400">✓ Confirmed</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Sybil Resistance</span>
              <span className="text-green-400">✓ One Human, One Identity</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Privacy Protection</span>
              <span className="text-green-400">✓ No Data Stored</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Blockchain Status</span>
              <span className="text-green-400">✓ On-Chain</span>
            </div>
          </div>
        </div>

        {userData.transactionHash && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Transaction Hash:</p>
            <p className="text-cyan-400 text-xs font-mono break-all">
              {userData.transactionHash}
            </p>
          </div>
        )}
      </div>

      {/* Compatible dApps */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">Use Your UWI Across dApps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compatibleDApps.map((dapp, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{dapp.icon}</span>
                <div>
                  <h4 className="text-white font-semibold">{dapp.name}</h4>
                  <p className="text-xs text-gray-400">{dapp.category}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-3">{dapp.description}</p>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                {dapp.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.open('https://opensea.io', '_blank')}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>View on OpenSea</span>
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}?verify=${address}`)
            alert('Verification link copied!')
          }}
          className="flex-1 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>Share Identity</span>
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Create Another</span>
        </button>
      </div>
    </div>
  )
}

export default IdentityDashboard
