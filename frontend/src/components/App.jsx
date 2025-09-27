import React, { useState, useEffect } from 'react'
import WalletConnector from './WalletConnector'
import IdentityForm from './IdentityForm'
import SelfVerification from './SelfVerification'
import IdentityMinting from './IdentityMinting'
import IdentityDashboard from './IdentityDashboard'
import IdentityLoader from './IdentityLoader'  // New import
import { useAccount } from 'wagmi'

function App() {
  const [currentStep, setCurrentStep] = useState('connect')
  const [userData, setUserData] = useState({})
  const [verificationData, setVerificationData] = useState(null)
  const { isConnected } = useAccount()

  // Auto-advance from wallet connection if no identity loaded yet
  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setCurrentStep('form')
    }
  }, [isConnected, currentStep])

  // Handle identity loaded (existing user logging in)
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Universal Web3 Identity
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create your unified, Sybil-resistant digital identity for the decentralized web
          </p>
        </div>

        {/* IdentityLoader mounts always to check if user already has identity */}
        <IdentityLoader onIdentityLoaded={handleIdentityLoaded} />

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 'connect', label: 'Connect Wallet', icon: '🔗' },
              { step: 'form', label: 'Enter Details', icon: '📝' },
              { step: 'verify', label: 'Self Verify', icon: '🛡️' },
              { step: 'minting', label: 'Mint SBT', icon: '⚡' },
              { step: 'dashboard', label: 'UWI Ready', icon: '🎉' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep === item.step 
                    ? 'bg-blue-500 border-blue-400 text-white'
                    : getCurrentStepIndex(currentStep) > index
                    ? 'bg-green-500 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === item.step ? 'text-blue-300' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                {index < 4 && <div className="w-8 h-0.5 bg-gray-600 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 'connect' && (
            <WalletConnector />
          )}
          {currentStep === 'form' && (
            <IdentityForm onFormSubmit={handleFormSubmit} />
          )}
          {currentStep === 'verify' && (
            <SelfVerification 
              userData={userData} 
              onVerificationComplete={handleVerificationComplete} 
            />
          )}
          {currentStep === 'minting' && (
            <IdentityMinting 
              userData={userData}
              verificationData={verificationData}
              onMintingComplete={handleMintingComplete}
            />
          )}
          {currentStep === 'dashboard' && (
            <IdentityDashboard userData={userData} />
          )}
        </div>
      </div>
    </div>
  )
}


// Helper function to get step index
function getCurrentStepIndex(step) {
  const steps = ['connect', 'form', 'verify', 'minting', 'dashboard']
  return steps.indexOf(step)
}


export default App
