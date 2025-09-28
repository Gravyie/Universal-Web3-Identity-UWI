import React, { useState } from 'react'

export default function IdentityMinting({ userData, verificationData, onMintingComplete }) {
  const [isMinting, setIsMinting] = useState(false)

  const handleMint = () => {
    setIsMinting(true)
    setTimeout(() => {
      onMintingComplete({
        tokenId: `mock_token_${Date.now()}`,
        username: userData.username,
        verified: true,
        sybilResistant: true,
        createdAt: Date.now()
      })
    }, 3000)
  }

  return (
    <div>
      {isMinting ? (
        <p className="text-green-500">Minting identity token... please wait.</p>
      ) : (
        <div className='flex justify-center items-center'>
        <button className="bg-green-600 hover:bg-green-700 text-black font-mono font-bold py-3 px-6 rounded" onClick={handleMint}>
          Mint Identity Token
        </button>
        </div>
      )}
    </div>
  )
}
