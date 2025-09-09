"use client";

import { SealedAuctionFHE } from "@/components/SealedAuctionFHE";
import { HowItWorks } from "@/components/HowItWorks";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useState, useEffect } from "react";

export default function Home() {
  const { isConnected } = useMetaMaskEthersSigner();
  const [isDisconnected, setIsDisconnected] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user was disconnected
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDisconnected = localStorage.getItem('user-disconnected');
      if (wasDisconnected === 'true') {
        setIsDisconnected(true);
        localStorage.removeItem('user-disconnected');
      }
    }
  }, []);

  // Listen for disconnect events
  useEffect(() => {
    const handleDisconnect = () => {
      setIsDisconnected(true);
    };

    window.addEventListener('wallet-disconnected', handleDisconnect);
    return () => {
      window.removeEventListener('wallet-disconnected', handleDisconnect);
    };
  }, []);

  // Show loading state until component is mounted
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Sealed Auction...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Hero Section - Show when wallet not connected or disconnected */}
      {(!isConnected || isDisconnected) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-800 mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Powered by Zama FHEVM Technology
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The Future of{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Confidential Auctions
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              Experience the world's first fully homomorphic encrypted auction platform. 
              Your bids remain completely private until the auction ends, ensuring fair competition 
              and protecting your strategic information.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Live on Sepolia Testnet
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Built on Ethereum
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                FHEVM Powered
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  setIsDisconnected(false);
                  const event = new CustomEvent('connect-wallet');
                  window.dispatchEvent(event);
                }}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <span className="mr-3">🦊</span>
                Connect to MetaMask
              </button>
              
              <button
                onClick={() => setShowHowItWorks(true)}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-gray-200 hover:border-blue-300"
              >
                <span className="mr-3">📚</span>
                How It Works
              </button>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Column - Main Features */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl text-white">🔐</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Zero-Knowledge Bidding</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Your bid amounts are encrypted using fully homomorphic encryption. 
                  Even the smart contract cannot see your bid until the auction ends, 
                  ensuring complete privacy and preventing front-running.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl text-white">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Instant Decryption</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  When the auction timer expires, all bids are automatically decrypted 
                  and the winner is determined instantly. No manual intervention required.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl text-white">🛡️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Cryptographically Secure</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Built on Ethereum with FHEVM technology, leveraging cutting-edge 
                  cryptographic primitives for maximum security and transparency.
                </p>
              </div>
            </div>

            {/* Right Column - Project Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">About This Project</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  This is a demonstration of the world's first fully homomorphic encrypted 
                  auction system. Built as a proof-of-concept for confidential blockchain 
                  transactions using Zama's FHEVM technology.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-600">Research-grade cryptography</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    <span className="text-gray-600">Ethereum smart contracts</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-600">Real-time encryption/decryption</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Connect Wallet</h4>
                      <p className="text-sm text-gray-600">Connect your MetaMask wallet to Sepolia testnet</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-sm font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Place Encrypted Bid</h4>
                      <p className="text-sm text-gray-600">Your bid is encrypted using FHEVM before submission</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-sm font-bold text-green-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Automatic Results</h4>
                      <p className="text-sm text-gray-600">Bids are decrypted and winner determined automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Technology Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-white">🔷</span>
                </div>
                <h4 className="font-semibold text-gray-900">Ethereum</h4>
                <p className="text-sm text-gray-600">Smart Contracts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-white">🔐</span>
                </div>
                <h4 className="font-semibold text-gray-900">FHEVM</h4>
                <p className="text-sm text-gray-600">Homomorphic Encryption</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-white">⚛️</span>
                </div>
                <h4 className="font-semibold text-gray-900">React</h4>
                <p className="text-sm text-gray-600">Frontend Framework</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-white">🔧</span>
                </div>
                <h4 className="font-semibold text-gray-900">Hardhat</h4>
                <p className="text-sm text-gray-600">Development Tools</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Application */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-8 items-center sm:items-start w-full ${isConnected ? 'pt-8' : ''}`}>
          <SealedAuctionFHE />
        </div>
      </div>

      {/* How It Works Modal */}
      <HowItWorks 
        isVisible={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">Powered by <span className="font-semibold text-gray-900">FHEVM</span> and <span className="font-semibold text-gray-900">Ethereum</span></p>
            <p className="text-sm mb-4">Built with Next.js, TypeScript, and Tailwind CSS</p>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-3">
                Created by <span className="font-medium text-gray-700">Ho Sy Thoang</span>
              </p>
              <div className="flex justify-center space-x-6">
                <a 
                  href="https://github.com/phamcamnguyen1994" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/yoshinokuna" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a 
                  href="https://discord.gg/hosythoang" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-500 transition-colors"
                  title="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
