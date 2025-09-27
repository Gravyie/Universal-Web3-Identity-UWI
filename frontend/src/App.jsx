import React, { useState } from 'react'
import WalletConnector from './components/WalletConnector'
import IdentityForm from './components/IdentityForm'
import IdentityDisplay from './components/IdentityDisplay'

function App() {
  const [currentStep, setCurrentStep] = useState('connect') // connect, form, display
  const [userIdentity, setUserIdentity] = useState(null)

  const handleWalletConnected = () => {
    setCurrentStep('form')
  }

  const handleIdentityCreated = (identity) => {
    setUserIdentity(identity)
    setCurrentStep('display')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Universal Web3 Identity
          </h1>
          <p className="text-xl text-gray-300">
            Create your unified digital identity for the decentralized web
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {currentStep === 'connect' && (
            <WalletConnector onWalletConnected={handleWalletConnected} />
          )}
          {currentStep === 'form' && (
            <IdentityForm onIdentityCreated={handleIdentityCreated} />
          )}
          {currentStep === 'display' && (
            <IdentityDisplay identity={userIdentity} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
