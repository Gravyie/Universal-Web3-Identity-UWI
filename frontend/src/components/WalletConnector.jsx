import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

function WalletConnector({ onWalletConnected }) {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()

  React.useEffect(() => {
    if (isConnected && address) {
      onWalletConnected()
    }
  }, [isConnected, address, onWalletConnected])

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-300">
            Connect your Web3 wallet to start creating your Universal Web3 Identity
          </p>
        </div>

        {!isConnected ? (
          <button
            onClick={() => open()}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 transform hover:scale-105"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-center">
            <p className="text-green-400 mb-4">✓ Wallet Connected</p>
            <p className="text-gray-300 text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletConnector
