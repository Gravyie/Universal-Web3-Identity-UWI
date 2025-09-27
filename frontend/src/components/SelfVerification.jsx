"use client";

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

  // Cache excluded countries list
  const excludedCountries = useMemo(() => [countries.UNITED_STATES], []);

  // User ID for Self app (Ethereum zero address or use wallet address if needed)
  const userId = address || "0x0000000000000000000000000000000000000000";

  useEffect(() => {
    if (!address || !userData) return;

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.VITE_REOWN_PROJECT_ID || "Universal Web3 Identity",
        scope: "self-workshop", // Keep consistent with your contract and backend setup
        endpoint: process.env.VITE_UWI_CONTRACT_ADDRESS,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // Example logo url
        userId: userId,
        endpointType: "celo_alfajores",  // use your actual network here
        userIdType: "hex",
        userDefinedData: JSON.stringify({
          username: userData.username,
          timestamp: userData.timestamp
        }),
        disclosures: {
          minimumAge: 18,
          excludedCountries: excludedCountries,
          ofac: false,
          name: true,
          nationality: true,
          gender: true,
          date_of_birth: true,
          passport_number: true,
          expiry_date: true,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [address, userData, userId, excludedCountries]);

  // Toast helper
  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Copy universal link to clipboard
  const copyToClipboard = () => {
    if (!universalLink) return;

    navigator.clipboard.writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        displayToast("Universal link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        displayToast("Failed to copy link");
      });
  };

  // Open Self app in new tab
  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  // Handle successful verification event
  const handleSuccessfulVerification = () => {
    displayToast("Verification successful! Proceeding...");
    setTimeout(() => {
      onVerificationComplete({
        verificationId: `self_${Date.now()}`,
        isUnique: true,
        sybilResistant: true,
        timestamp: Date.now()
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
          Self Protocol Verification
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Scan QR code with the Self Protocol App to verify your identity
        </p>
      </div>

      {/* QR Code & Buttons */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="flex justify-center mb-4 sm:mb-6">
          {selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={() => {
                displayToast("Verification Failed");
              }}
            />
          ) : (
            <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse flex items-center justify-center">
              <p className="text-gray-500 text-sm">Loading QR Code...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!universalLink}
            className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors text-white p-2 rounded-md text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {linkCopied ? "Copied!" : "Copy Universal Link"}
          </button>

          <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink}
            className="flex-1 bg-blue-600 hover:bg-blue-500 transition-colors text-white p-2 rounded-md text-sm sm:text-base mt-2 sm:mt-0 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Open Self App
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-gray-500 text-xs uppercase tracking-wide">User Address</span>
          <div className="bg-gray-100 rounded-md px-3 py-2 w-full text-center break-all text-sm font-mono text-gray-800 border border-gray-200">
            {userId ? userId : <span className="text-gray-400">Not connected</span>}
          </div>
        </div>

        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg animate-fade-in text-sm">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
