import React from 'react'

function IdentityDisplay({ identity }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">🎉 Identity Created!</h2>
        <p className="text-gray-300">Your Universal Web3 Identity has been successfully minted</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Identity Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Username:</span>
            <span className="text-white font-semibold">{identity.username}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Wallet:</span>
            <span className="text-white font-mono text-sm">
              {identity.walletAddress?.slice(0, 6)}...{identity.walletAddress?.slice(-4)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Token ID:</span>
            <span className="text-cyan-400 font-semibold">#{identity.tokenId}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Created:</span>
            <span className="text-white text-sm">
              {new Date(identity.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {identity.transactionHash && (
          <div className="mt-6 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
            <p className="text-xs text-cyan-400 font-mono break-all">
              {identity.transactionHash}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200"
        >
          Create Another Identity
        </button>
      </div>
    </div>
  )
}

export default IdentityDisplay
