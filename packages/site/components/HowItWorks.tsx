"use client";

import { useState } from "react";

interface HowItWorksProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HowItWorks = ({ isVisible, onClose }: HowItWorksProps) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "FHE Encryption",
      description: "Your bid is encrypted using Fully Homomorphic Encryption before being submitted to the blockchain",
      details: [
        "Bid amount is converted to encrypted format (euint64)",
        "Encryption happens client-side using FHEVM SDK",
        "Even you cannot decrypt your own bid once encrypted",
        "Smart contract receives only encrypted ciphertext"
      ],
      icon: "🔐",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Confidential Comparison",
      description: "The smart contract compares encrypted bids without ever seeing the actual amounts",
      details: [
        "Uses FHE.select() for confidential branching",
        "Compares encrypted values: bid > highestBid?",
        "Updates encrypted highest bid and winner",
        "All operations happen on encrypted data"
      ],
      icon: "⚖️",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Sealed Storage",
      description: "Encrypted results are stored on-chain, completely hidden from everyone",
      details: [
        "highestBidEnc: encrypted highest bid amount",
        "winnerEnc: encrypted winner address",
        "No one can see the actual values",
        "Even the contract creator cannot decrypt"
      ],
      icon: "📦",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Controlled Decryption",
      description: "Only authorized parties can decrypt results after the auction ends",
      details: [
        "Seller can finalize auction after time expires",
        "FHE.allow() grants decryption permissions",
        "Results are revealed to authorized viewers",
        "Winner and amount are finally disclosed"
      ],
      icon: "🔓",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const technicalDetails = [
    {
      title: "FHEVM Technology",
      description: "Fully Homomorphic Encryption Virtual Machine enables computation on encrypted data",
      features: [
        "Zero-knowledge computations",
        "Privacy-preserving smart contracts",
        "Cryptographic security guarantees",
        "Ethereum-compatible execution"
      ]
    },
    {
      title: "Smart Contract Architecture",
      description: "Three-layer architecture for maximum security and functionality",
      features: [
        "SealedAuction: Core auction logic with FHE",
        "AuctionFactory: Creates and deploys auctions",
        "AuctionRegistry: Tracks and manages all auctions"
      ]
    },
    {
      title: "Security Model",
      description: "Multiple layers of security ensure complete privacy and fairness",
      features: [
        "Cryptographic encryption of all sensitive data",
        "Time-based auction finalization",
        "Permission-based result viewing",
        "No front-running or MEV attacks possible"
      ]
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">How Sealed Auction Works</h2>
              <p className="text-gray-600">Understanding FHE-powered confidential bidding</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Step-by-step Process */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">The FHE Auction Process</h3>
            
            {/* Step Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveStep(index)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 ${
                      activeStep === index
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-glow'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:shadow-md'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Step Content */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 mb-8 animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${steps[activeStep].color} rounded-xl flex items-center justify-center mr-6`}>
                  <span className="text-3xl">{steps[activeStep].icon}</span>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{steps[activeStep].title}</h4>
                  <p className="text-gray-600 text-lg">{steps[activeStep].description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Key Points:</h5>
                  <ul className="space-y-2">
                    {steps[activeStep].details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Visual Diagram */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h5 className="font-semibold text-gray-900 mb-4">Visual Flow:</h5>
                  <div className="space-y-4">
                    {activeStep === 0 && (
                      <>
                        <div className="flex items-center animate-fade-in">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-blue-600 text-sm">💰</span>
                          </div>
                          <span className="text-sm text-gray-600">User enters bid amount</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.2s'}}>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-blue-600 text-sm">🔐</span>
                          </div>
                          <span className="text-sm text-gray-600">FHEVM encrypts the bid</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-blue-600 text-sm">📤</span>
                          </div>
                          <span className="text-sm text-gray-600">Encrypted bid sent to contract</span>
                        </div>
                      </>
                    )}
                    
                    {activeStep === 1 && (
                      <>
                        <div className="flex items-center animate-fade-in">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-purple-600 text-sm">⚖️</span>
                          </div>
                          <span className="text-sm text-gray-600">Contract compares encrypted bids</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.2s'}}>
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-purple-600 text-sm">🔄</span>
                          </div>
                          <span className="text-sm text-gray-600">Updates encrypted highest bid</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-purple-600 text-sm">👑</span>
                          </div>
                          <span className="text-sm text-gray-600">Updates encrypted winner</span>
                        </div>
                      </>
                    )}
                    
                    {activeStep === 2 && (
                      <>
                        <div className="flex items-center animate-fade-in">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-green-600 text-sm">📦</span>
                          </div>
                          <span className="text-sm text-gray-600">Encrypted data stored on-chain</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.2s'}}>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-green-600 text-sm">🔒</span>
                          </div>
                          <span className="text-sm text-gray-600">No one can see the values</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-green-600 text-sm">⏰</span>
                          </div>
                          <span className="text-sm text-gray-600">Auction continues until timer expires</span>
                        </div>
                      </>
                    )}
                    
                    {activeStep === 3 && (
                      <>
                        <div className="flex items-center animate-fade-in">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-orange-600 text-sm">⏰</span>
                          </div>
                          <span className="text-sm text-gray-600">Auction timer expires</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.2s'}}>
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-orange-600 text-sm">🔓</span>
                          </div>
                          <span className="text-sm text-gray-600">Seller finalizes auction</span>
                        </div>
                        <div className="flex items-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                            <span className="text-orange-600 text-sm">🏆</span>
                          </div>
                          <span className="text-sm text-gray-600">Results revealed to authorized viewers</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                disabled={activeStep === steps.length - 1}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Technical Details */}
          <div className="border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Technical Deep Dive</h3>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {technicalDetails.map((detail, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{detail.title}</h4>
                  <p className="text-gray-600 mb-4">{detail.description}</p>
                  <ul className="space-y-2">
                    {detail.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div className="border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Code Example</h3>
            <div className="bg-gray-900 rounded-xl p-6 text-green-400 font-mono text-sm overflow-x-auto">
              <div className="mb-4">
                <span className="text-blue-400">// Place encrypted bid</span>
              </div>
              <div className="mb-2">
                <span className="text-purple-400">function</span> <span className="text-yellow-400">placeBid</span>(<span className="text-orange-400">externalEuint64</span> bidCt, <span className="text-orange-400">bytes</span> inputProof) <span className="text-purple-400">external</span> {'{'}
              </div>
              <div className="ml-4 mb-2">
                <span className="text-blue-400">// Convert external ciphertext to internal</span>
              </div>
              <div className="ml-4 mb-2">
                <span className="text-orange-400">euint64</span> bid = <span className="text-yellow-400">FHE.fromExternal</span>(bidCt, inputProof);
              </div>
              <div className="ml-4 mb-2">
                <span className="text-blue-400">// Confidential comparison</span>
              </div>
              <div className="ml-4 mb-2">
                <span className="text-orange-400">ebool</span> better = <span className="text-yellow-400">FHE.lt</span>(highestBidEnc, bid);
              </div>
              <div className="ml-4 mb-2">
                <span className="text-blue-400">// Update encrypted state</span>
              </div>
              <div className="ml-4 mb-2">
                highestBidEnc = <span className="text-yellow-400">FHE.select</span>(better, bid, highestBidEnc);
              </div>
              <div className="ml-4 mb-2">
                winnerEnc = <span className="text-yellow-400">FHE.select</span>(better, <span className="text-yellow-400">FHE.asEaddress</span>(<span className="text-orange-400">msg.sender</span>), winnerEnc);
              </div>
              <div className="mb-2">
                {'}'}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why FHE Auctions?</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl text-white">🛡️</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Complete Privacy</h4>
                    <p className="text-gray-600">Your bid amount is never revealed during the auction, preventing strategic manipulation.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl text-white">⚖️</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Fair Competition</h4>
                    <p className="text-gray-600">No front-running or MEV attacks possible since bids are encrypted.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl text-white">🔬</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Research-Grade Security</h4>
                    <p className="text-gray-600">Built on cutting-edge FHEVM technology with cryptographic guarantees.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl text-white">🚀</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Future of Auctions</h4>
                    <p className="text-gray-600">Demonstrates the potential of confidential blockchain applications.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
