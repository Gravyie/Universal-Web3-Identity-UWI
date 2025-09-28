import React, { useState, useEffect, useMemo } from "react";
import { useAccount } from 'wagmi';
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  countries, 
  getUniversalLink,
} from "@selfxyz/qrcode";

export default function SelfVerification({ userData, onVerificationComplete }) {
  const { address } = useAccount();
  const [selfApp, setSelfApp] = useState(null);
  const [universalLink, setUniversalLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);
  const [currentConfig, setCurrentConfig] = useState("");

  const excludedCountries = useMemo(() => [], []);

  const addDebugInfo = (message) => {
    console.log("🔍 DEBUG:", message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const initializeSelf = async () => {
      if (!address || !userData) {
        addDebugInfo(`Missing data: address=${!!address}, userData=${!!userData}`);
        setError("Wallet not connected or user data missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      addDebugInfo("Starting Self Protocol initialization");

      // Try multiple endpoint configurations
      const endpointConfigs = [
        {
          name: "Production Self.id",
          endpoint: "https://api.self.id",
          endpointType: "production"
        },
        {
          name: "Staging Self.id", 
          endpoint: "https://staging-api.self.id",
          endpointType: "staging"
        },
        {
          name: "Local endpoint",
          endpoint: "http://localhost:3000",
          endpointType: "local"
        },
        {
          name: "Wallet address endpoint",
          endpoint: address,
          endpointType: "ethereum"
        },
        {
          name: "No endpoint (default)",
          endpoint: undefined,
          endpointType: "ethereum"
        }
      ];

      // Try different disclosure configurations
      const disclosureConfigs = [
        {
          name: "Minimal disclosures",
          disclosures: {
            minimumAge: 18,
            excludedCountries: [],
            ofac: false
          }
        },
        {
          name: "Standard disclosures",
          disclosures: {
            minimumAge: 18,
            excludedCountries: [],
            ofac: false,
            name: false,
            nationality: false,
            gender: false,
            date_of_birth: false,
            passport_number: false,
            expiry_date: false
          }
        },
        {
          name: "Basic age only",
          disclosures: {
            minimumAge: 18
          }
        },
        {
          name: "Empty disclosures",
          disclosures: {}
        }
      ];

      let workingApp = null;
      let workingConfig = "";

      // Try each combination
      for (const endpointConfig of endpointConfigs) {
        for (const disclosureConfig of disclosureConfigs) {
          try {
            addDebugInfo(`Trying: ${endpointConfig.name} + ${disclosureConfig.name}`);
            
            const config = {
              version: 2,
              appName: "Universal Web3 Identity",
              scope: "self-workshop",
              ...(endpointConfig.endpoint && { endpoint: endpointConfig.endpoint }),
              userId: address,
              endpointType: endpointConfig.endpointType,
              userIdType: "hex",
              userDefinedData: JSON.stringify({
                username: userData.username,
                timestamp: userData.timestamp,
                address: address
              }),
              ...disclosureConfig.disclosures && { disclosures: disclosureConfig.disclosures }
            };

            addDebugInfo(`Config: ${JSON.stringify(config, null, 2)}`);
            
            const app = new SelfAppBuilder(config).build();
            addDebugInfo(`✅ SUCCESS: ${endpointConfig.name} + ${disclosureConfig.name}`);
            
            workingApp = app;
            workingConfig = `${endpointConfig.name} + ${disclosureConfig.name}`;
            break;
          } catch (configError) {
            addDebugInfo(`❌ FAILED: ${endpointConfig.name} + ${disclosureConfig.name} - ${configError.message}`);
            continue;
          }
        }
        if (workingApp) break;
      }

      if (!workingApp) {
        addDebugInfo("❌ All Self Protocol configurations failed");
        setError("All Self Protocol configurations failed. Check debug info.");
        setIsLoading(false);
        return;
      }

      try {
        setSelfApp(workingApp);
        setCurrentConfig(workingConfig);
        
        const link = getUniversalLink(workingApp);
        addDebugInfo(`Universal link generated: ${link ? 'SUCCESS' : 'FAILED'}`);
        if (link) {
          addDebugInfo(`Link: ${link.substring(0, 100)}...`);
        }
        setUniversalLink(link);
        setIsLoading(false);
        
      } catch (linkError) {
        addDebugInfo(`❌ Universal link generation failed: ${linkError.message}`);
        setError(`Universal link generation failed: ${linkError.message}`);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeSelf, 1000);
    return () => clearTimeout(timer);
  }, [address, userData]);

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = () => {
    if (!universalLink) return;
    navigator.clipboard.writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        displayToast("Universal link copied!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        addDebugInfo(`❌ Copy failed: ${err.message}`);
        displayToast("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink) return;
    addDebugInfo(`Opening Self app with link: ${universalLink}`);
    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  const handleSuccessfulVerification = (result) => {
    addDebugInfo(`✅ Verification SUCCESS: ${JSON.stringify(result)}`);
    displayToast("Verification successful! Proceeding...");
    setTimeout(() => {
      onVerificationComplete({
        verificationId: `self_${Date.now()}`,
        isUnique: true,
        sybilResistant: true,
        timestamp: Date.now(),
        selfResult: result
      });
    }, 1500);
  };

  const handleSkipVerification = () => {
    addDebugInfo("User skipped verification");
    displayToast("Skipping verification for testing...");
    onVerificationComplete({
      verificationId: `test_${Date.now()}`,
      isUnique: true,
      sybilResistant: false,
      timestamp: Date.now(),
      method: 'skipped'
    });
  };

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-8">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Self Protocol Verification
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Testing Self Protocol configurations...</p>
        </div>
      )}

      {/* Error State */}
      {error && handleSkipVerification()}

      {/* QR Code & Buttons */}
      {!isLoading && !error && (
        <div>
          <div className="flex justify-center mb-6">
            {selfApp ? (
              <div className="bg-white p-4 rounded-lg">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleSuccessfulVerification}
                  onError={(err) => {
                    addDebugInfo(`❌ QR Verification error: ${JSON.stringify(err)}`);
                    setError(`QR Verification failed: ${JSON.stringify(err)}`);
                  }}
                />
              </div>
            ) : (
              <div className="w-[256px] h-[256px] bg-gray-800 border border-gray-700 animate-pulse flex items-center justify-center rounded-lg">
                <p className="text-gray-500 text-sm">Loading QR Code...</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!universalLink}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors text-white p-3 rounded-lg disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {linkCopied ? "Copied!" : "Copy Universal Link"}
            </button>

            <button
              type="button"
              onClick={openSelfApp}
              disabled={!universalLink}
              className="bg-white hover:bg-gray-200 transition-colors text-black p-3 rounded-lg disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Open Self App
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-500 text-xs uppercase tracking-wide">User Address</span>
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-full text-center break-all text-sm font-mono text-gray-300">
              {address}
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-white text-black py-2 px-4 rounded-lg shadow-lg animate-fade-in text-sm z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
