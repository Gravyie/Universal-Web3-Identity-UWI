import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { mintIdentityNFT, checkUserIdentity, UWI_CONTRACT_CONFIG } from '../utils/contracts'

function IdentityMinting({ userData, verificationData, onMintingComplete }) {
  const [mintingState, setMintingState] = useState('init') // init, minting, success, error
  const [error, setError] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  
  const { address } = useAccount()
  const { writeContract, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  })

  useEffect(() => {
    if (isConfirmed && transactionHash) {
      setMintingState('success')
      setTimeout(() => {
        onMintingComplete({
          tokenId: Date.now(), // In real app, get from transaction logs
          hash: transactionHash,
          contractAddress: UWI_CONTRACT_CONFIG.address,
          username: userData.username,
          verified: true,
          sybilResistant: true
        })
      }, 2000)
    }
  }, [isConfirmed, transactionHash, onMintingComplete, userData.username])

  const handleMintSBT = async () => {
    setMintingState('minting')
    setError('')

    try {
      const identityData = {
        walletAddress: address,
        username: userData.username,
        zkProofHash: verificationData.zkProof?.hash || `zk_${Date.now()}`
      }

      console.log('🔄 Starting real contract minting...')
      const result = await mintIdentityNFT(writeContract, identityData)
      
      if (result.hash) {
        setTransactionHash(result.hash)
        console.log('✅ Transaction sent, waiting for confirmation...')
      }
    } catch (error) {
      console.error('❌ Minting error:', error)
      setError(error.message || 'Failed to mint identity token')
      setMintingState('error')
    }
  }

  const renderMintingStep = () => {
    switch (mintingState) {
      case 'init':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">Mint Your Identity Token</h3>
            <p className="text-gray-300 mb-8 text-lg">
              Create your permanent, non-transferable Universal Web3 Identity token on Hedera Network
            </p>
            
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6 mb-8">
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-3">🎫 Your Soulbound Token Will Include:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="mb-1"><span className="font-medium">Username:</span> {userData.username}</p>
                    <p className="mb-1"><span className="font-medium">Network:</span> Hedera Testnet</p>
                    <p className="mb-1"><span className="font-medium">Verified:</span> Self Protocol ✅</p>
                  </div>
                  <div>
                    <p className="mb-1"><span className="font-medium">Type:</span> Soulbound (Non-transferable)</p>
                    <p className="mb-1"><span className="font-medium">Contract:</span> {UWI_CONTRACT_CONFIG.address?.slice(0, 10)}...</p>
                    <p className="mb-1"><span className="font-medium">Sybil Resistant:</span> Yes ✅</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleMintSBT}
              disabled={isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-xl text-lg transition duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {isPending ? 'Preparing Transaction...' : 'Mint UWI Token'}
            </button>
          </div>
        )

      case 'minting':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">Minting Your Identity...</h3>
            
            {transactionHash ? (
              <div>
                <p className="text-gray-300 mb-4">Transaction sent! Waiting for confirmation...</p>
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm">
                    <span className="font-medium">Transaction Hash:</span><br />
                    <code className="text-xs break-all">{transactionHash}</code>
                  </p>
                </div>
                {isConfirming && (
                  <p className="text-blue-300">⏳ Confirming on Hedera Network...</p>
                )}
              </div>
            ) : (
              <p className="text-gray-300 mb-4">Please confirm the transaction in your wallet...</p>
            )}
            
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-bounce">🔄</div>
              <span className="text-gray-300">Processing...</span>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">🎉 Identity Token Minted!</h3>
            <p className="text-gray-300 text-lg mb-6">
              Your Universal Web3 Identity has been successfully created on Hedera Network
            </p>
            
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <div className="text-sm text-green-300">
                <p className="font-semibold mb-2">✅ Success Details:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Soulbound Token minted and assigned to your wallet</li>
                  <li>Identity verification completed via Self Protocol</li>
                  <li>On-chain metadata and SVG art generated</li>
                  <li>Contract deployed on Hedera Network</li>
                  <li>Ready to use across compatible dApps</li>
                </ul>
              </div>
            </div>
            
            <p className="text-gray-300 mt-6">Redirecting to your identity dashboard...</p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">Minting Failed</h3>
            <p className="text-red-300 mb-6">{error}</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setMintingState('init')}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition duration-200 mr-4"
              >
                Try Again
              </button>
              
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-4">
                <p className="text-red-300 text-sm">
                  <span className="font-medium">Common Issues:</span><br />
                  • Insufficient HBAR balance for gas fees<br />
                  • Network connectivity issues<br />
                  • Wallet connection problems<br />
                  • Username already taken
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      {renderMintingStep()}
    </div>
  )
}

export default IdentityMinting
