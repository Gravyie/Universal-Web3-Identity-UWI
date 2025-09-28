import React from 'react'
import { useWriteContract, useAccount } from 'wagmi'
import { mintIdentityNFT } from '../utils/contracts'

export default function ManualMintTest() {
  const { writeContract } = useWriteContract()
  const { address } = useAccount()

  const handleMintTest = async () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }

    const testIdentityData = {
      walletAddress: address,
      username: 'TestUser',
      zkProofHash: `zk_proof_test_${Date.now()}`
    }

    try {
      const result = await mintIdentityNFT(writeContract, testIdentityData)
      console.log('Mint transaction result:', result)
      alert('Mint transaction sent! Please confirm in your wallet.')
    } catch (error) {
      console.error('Minting test failed:', error)
      alert(`Minting test failed: ${error.message}`)
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleMintTest}
        className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-lg transition duration-200"
      >
        Test Mint Identity NFT
      </button>
    </div>
  )
}
