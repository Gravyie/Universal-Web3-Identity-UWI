import React, { useState, useEffect } from 'react'
import WalletConnector from './WalletConnector'
import IdentityForm from './IdentityForm'
import SelfVerification from './SelfVerification'
import IdentityMinting from './IdentityMinting'
import IdentityDashboard from './IdentityDashboard'
import IdentityLoader from './IdentityLoader'
import { useAccount } from 'wagmi'

function App() {
  const [currentStep, setCurrentStep] = useState('connect')
  const [userData, setUserData] = useState({})
  const [verificationData, setVerificationData] = useState(null)
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setCurrentStep('form')
    }
  }, [isConnected, currentStep])

  const handleIdentityLoaded = (identityData) => {
    setUserData(identityData)
    setCurrentStep('dashboard')
  }

  const handleFormSubmit = (formData) => {
    setUserData(formData)
    setCurrentStep('verify')
  }

  const handleVerificationComplete = (selfData) => {
    setVerificationData(selfData)
    setCurrentStep('minting')
  }

  const handleMintingComplete = (identityData) => {
    setUserData(prev => ({ ...prev, ...identityData }))
    setCurrentStep('dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12 select-none">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            Universal Web3 Identity
          </h1>
          <p className="text-xl text-green-600 max-w-2xl mx-auto">
            Create your unified, Sybil-resistant digital identity for the decentralized web
          </p>
        </header>

        <IdentityLoader onIdentityLoaded={handleIdentityLoaded} />

        <nav aria-label="Progress" className="max-w-4xl mx-auto mb-12 flex items-center justify-center space-x-6 overflow-x-auto">
          {[
            { step: 'connect', label: 'Connect' },
            { step: 'form', label: 'Details' },
            { step: 'verify', label: 'Verify' },
            { step: 'minting', label: 'Mint' },
            { step: 'dashboard', label: 'Ready' }
          ].map(({ step, label }) => (
            <div key={step} className={`cursor-default rounded-full px-4 py-2 text-lg ${step === currentStep ? 'bg-green-600 text-black font-bold' : 'border border-green-600 text-green-600'}`}>
              {label}
            </div>
          ))}
        </nav>

        <main className="max-w-2xl mx-auto">
          {currentStep === 'connect' && <WalletConnector />}
          {currentStep === 'form' && <IdentityForm onFormSubmit={handleFormSubmit} />}
          {currentStep === 'verify' && <SelfVerification userData={userData} onVerificationComplete={handleVerificationComplete} />}
          {currentStep === 'minting' && <IdentityMinting userData={userData} verificationData={verificationData} onMintingComplete={handleMintingComplete} />}
          {currentStep === 'dashboard' && <IdentityDashboard userData={userData} />}
        </main>
      </div>
    </div>
  )
}

export default App
