import React from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

function WalletConnector() {
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 text-lg">
            Connect your Web3 wallet (MetaMask, WalletConnect, or other)
            to start creating your Universal Web3 Identity
          </p>
        </div>

        {!isConnected ? (
          <div className="space-y-6">
            <button
              onClick={() => open()}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-xl text-lg transition duration-200 transform hover:scale-105 shadow-lg"
            >
              Connect Wallet
            </button>

            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-2">🔒 What happens next:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Connect your MetaMask, WalletConnect, or other wallet</li>
                  <li>Enter your desired username</li>
                  <li>Complete Self Protocol identity verification</li>
                  <li>Mint your Soulbound Identity Token</li>
                  <li>Use your UWI across compatible dApps</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-lg mb-2">✓ Wallet Connected</p>
              <p className="text-white font-mono text-sm">
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
            <p className="text-gray-300">Proceeding to identity creation...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletConnector
