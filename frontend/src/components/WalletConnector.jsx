import React from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export default function WalletConnector() {
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()

  return (
    <div className="p-8 bg-black border border-green-500 rounded max-w-md mx-auto select-none">
      <h2 className="text-green-400 text-3xl font-mono font-bold mb-6">
        Connect Your Wallet
      </h2>
      {!isConnected ? (
        <>
          <button onClick={() => open()} className="bg-green-500 text-black px-10 py-4 font-mono font-bold rounded hover:bg-green-600 transition">
            Connect Wallet
          </button>
          <p className="mt-5 text-green-600">
            Connect MetaMask, WalletConnect or others
          </p>
        </>
      ) : (
        <p className="text-green-400 font-mono">
          Wallet Connected: {address?.slice(0,6)}...{address?.slice(-4)}
        </p>
      )}
    </div>
  )
}
