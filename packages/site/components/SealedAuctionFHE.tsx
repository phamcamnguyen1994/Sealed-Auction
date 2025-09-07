"use client";

import { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSealedAuctionFHE } from "@/hooks/useSealedAuctionFHE";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { AuctionMarketplace } from "./AuctionMarketplace";
import { useTheme } from "../contexts/ThemeContext";

/*
 * Main SealedAuction React component with FHE operations
 *  - "Refresh" button: allows you to get the current auction state.
 *  - "Place Bid" button: allows you to place a sealed bid using FHE operations.
 *  - "Finalize" button: allows you to finalize the auction.
 */
export const SealedAuctionFHE = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { theme, toggleTheme } = useTheme();
  const [bidAmount, setBidAmount] = useState<number>(70);
  const [showMarketplace, setShowMarketplace] = useState<boolean>(false);
  const [currentContractAddress, setCurrentContractAddress] = useState<string | null>(null);
  const [auctionItem, setAuctionItem] = useState<{
    name: string;
    description: string;
    image: string | null;
    category: string;
    seller: string;
  }>({
    name: "Loading...",
    description: "Loading auction information...",
    image: null,
    category: "Unknown",
    seller: "0x8d30010878d95C7EeF78e543Ee2133db846633b8" // Default seller address
  });
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true, // use enabled to dynamically create the instance on-demand
  });

  //////////////////////////////////////////////////////////////////////////////
  // useFHECounter is a custom hook containing all the FHECounter logic, including
  // - calling the FHECounter contract
  // - encrypting FHE inputs
  // - decrypting FHE handles
  //////////////////////////////////////////////////////////////////////////////

  const sealedAuction = useSealedAuctionFHE({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage, // is global, could be invoked directly in useSealedAuctionFHE hook
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  //////////////////////////////////////////////////////////////////////////////
  // UI Stuff:
  // --------
  // A basic page containing
  // - A bunch of debug values allowing you to better visualize the React state
  // - 1x "Decrypt" button (to decrypt the latest FHECounter count handle)
  // - 1x "Increment" button (to increment the FHECounter)
  // - 1x "Decrement" button (to decrement the FHECounter)
  //////////////////////////////////////////////////////////////////////////////

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";



  // Get seller address from contract (if available)
  const [contractSeller, setContractSeller] = useState<string | null>(null);
  
  // Check if current user is the seller
  const isSeller = useMemo(() => {
    const sellerAddress = contractSeller || auctionItem.seller;
    return ethersSigner?.address?.toLowerCase() === sellerAddress.toLowerCase();
  }, [ethersSigner?.address, contractSeller, auctionItem.seller]);

  // Listen for auction selection from marketplace
  useEffect(() => {
    const handleAuctionSelected = (event: any) => {
      const { contractAddress, auctionId } = event.detail;
      console.log('Auction selected:', { contractAddress, auctionId });
      setCurrentContractAddress(contractAddress);
      // Force refresh of the sealed auction hook
      window.location.reload();
    };

    const handleAuctionDataLoaded = (event: any) => {
      const auctionData = event.detail;
      console.log('Auction data loaded:', auctionData);
      
      // Update auction item with loaded data
      setAuctionItem(prev => ({
        ...prev,
        name: auctionData.name || prev.name,
        description: auctionData.description || prev.description,
        image: auctionData.image || prev.image
      }));
    };

    window.addEventListener('auction-selected', handleAuctionSelected);
    window.addEventListener('auction-data-loaded', handleAuctionDataLoaded);
    
    // Load active contract address from localStorage on mount
    if (typeof window !== 'undefined') {
      const activeContractAddress = localStorage.getItem('active-contract-address');
      if (activeContractAddress) {
        setCurrentContractAddress(activeContractAddress);
        // Load auction info from Registry
        loadAuctionInfoFromRegistry(activeContractAddress);
      } else {
        // If no active auction, try to load from default contract
        if (sealedAuction.contractAddress) {
          loadAuctionInfoFromRegistry(sealedAuction.contractAddress);
        }
      }
    }

    return () => {
      window.removeEventListener('auction-selected', handleAuctionSelected);
      window.removeEventListener('auction-data-loaded', handleAuctionDataLoaded);
    };
  }, []);

  // Load auction info from Registry and localStorage
  const loadAuctionInfoFromRegistry = async (contractAddress: string) => {
    if (!ethersReadonlyProvider) return;
    
    try {
      // First try to load from localStorage (includes image)
      const localAuctionData = localStorage.getItem(`auction-${contractAddress}`);
      if (localAuctionData) {
        const auctionData = JSON.parse(localAuctionData);
        console.log('Auction data from localStorage:', auctionData);
        
        setAuctionItem(prev => ({
          ...prev,
          name: auctionData.name || prev.name,
          description: auctionData.description || prev.description,
          image: auctionData.image || prev.image,
          seller: prev.seller // Keep existing seller
        }));
        return;
      }
      
      // Fallback to Registry if no localStorage data
      try {
        const registryData = await import('../contracts/AuctionRegistry.json');
        const registryContract = new ethers.Contract(
          "0x74b7dF65eeb26E977Ce17567A18088030C3363Df",
          registryData.abi,
          ethersReadonlyProvider
        );
        
        const auctionInfo = await registryContract.getAuctionByAddress(contractAddress);
        console.log('Auction info from Registry:', auctionInfo);
        
        // Update auction item with info from Registry
        setAuctionItem(prev => ({
          ...prev,
          name: auctionInfo.name || `Auction ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
          description: auctionInfo.description || "Auction created on the blockchain",
          seller: auctionInfo.creator || prev.seller
        }));
      } catch (registryError) {
        console.log('Registry not available, using contract address as name');
        // Final fallback - use contract address as name
        setAuctionItem(prev => ({
          ...prev,
          name: `Auction ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
          description: "Auction created on the blockchain",
          seller: prev.seller
        }));
      }
      
    } catch (error) {
      console.error('Failed to load auction info:', error);
    }
  };

  // Load auction info when contract address changes
  useEffect(() => {
    if (sealedAuction.contractAddress && ethersReadonlyProvider) {
      // Load auction info from Registry/localStorage
      loadAuctionInfoFromRegistry(sealedAuction.contractAddress);
      
      // Try to get seller from contract
      const contract = new ethers.Contract(
        sealedAuction.contractAddress,
        sealedAuction.contractAddress ? require('../contracts/SealedAuction.json').abi : [],
        ethersReadonlyProvider
      );
      
      contract.seller()
        .then((seller: string) => {
          setContractSeller(seller);
          // Update auction item with real seller
          setAuctionItem(prev => ({
            ...prev,
            seller: seller
          }));
        })
        .catch(() => {
          // Contract doesn't have seller() method or other error
          // Keep using default seller
        });
    }
  }, [sealedAuction.contractAddress, ethersReadonlyProvider]);




  if (!isConnected) {
    return (
      <div className="mx-auto">
        <button
          className={buttonClass}
          disabled={isConnected}
          onClick={connect}
        >
          <span className="text-4xl p-6">Connect to MetaMask</span>
        </button>
      </div>
    );
  }

  if (sealedAuction.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  // Show marketplace if toggled
  if (showMarketplace) {
    return <AuctionMarketplace onClose={() => setShowMarketplace(false)} />;
  }

  // Theme-aware styling functions
  const getCardBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900/95 backdrop-blur-sm border border-gray-800';
      case 'orange': return 'bg-orange-50/95 backdrop-blur-sm';
      default: return 'bg-white/95 backdrop-blur-sm';
    }
  };
  
  const getCardBorder = () => {
    switch (theme) {
      case 'dark': return 'border-gray-700';
      case 'orange': return 'border-orange-200';
      default: return 'border-gray-200';
    }
  };
  
  const getTextPrimary = () => {
    switch (theme) {
      case 'dark': return 'text-gray-100';
      case 'orange': return 'text-orange-900';
      default: return 'text-gray-900';
    }
  };
  
  const getTextSecondary = () => {
    switch (theme) {
      case 'dark': return 'text-gray-300';
      case 'orange': return 'text-orange-700';
      default: return 'text-gray-600';
    }
  };
  
  const getTextMuted = () => {
    switch (theme) {
      case 'dark': return 'text-gray-400';
      case 'orange': return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };
  
  const getInputBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400';
      case 'orange': return 'bg-orange-100 border-orange-300 text-orange-900 placeholder-orange-500';
      default: return 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
    }
  };

  return (
    <div className={`grid w-full gap-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-950' : 
      theme === 'orange' ? 'bg-gradient-to-br from-orange-100 to-amber-50' : 
      'bg-gray-50'
    }`}>
      <div className={`col-span-full mx-20 bg-gradient-to-r ${
        theme === 'dark' ? 'from-gray-800 to-gray-900' : 
        theme === 'orange' ? 'from-orange-500 to-amber-600' : 
        'from-purple-600 to-blue-600'
      } text-white rounded-xl shadow-lg border border-gray-700`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🔐 Sealed Auction</h1>
              <p className={`text-xl ${
                theme === 'dark' ? 'text-gray-200' : 
                theme === 'orange' ? 'text-orange-100' :
                'text-blue-50'
              }`}>Confidential Bidding with FHEVM</p>
      </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`${
                  theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm text-gray-100 border border-gray-600' : 
                  theme === 'orange' ? 'bg-orange-600/20 backdrop-blur-sm text-white border border-orange-300/30' :
                  'bg-gray-800 text-white border border-gray-600'
                } px-4 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 shadow-lg`}
                title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} - Click to cycle themes`}
              >
                <span>{
                  theme === 'dark' ? '🌙' : 
                  theme === 'orange' ? '🧡' : 
                  '☀️'
                }</span>
                <span className="hidden md:inline">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
              </button>
              <button
                onClick={() => setShowMarketplace(!showMarketplace)}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <span>🏪</span>
                <span>{showMarketplace ? 'Hide' : 'Show'} Marketplace</span>
              </button>
              <div className="text-right">
                <div className="text-sm text-blue-200 mb-1">Powered by</div>
                <div className="text-lg font-semibold">Zama FHEVM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Simplified Info Section */}
      <div className={`col-span-full mx-20 mt-4 px-5 pb-4 rounded-lg border-2 ${
        theme === 'dark' ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-gray-700' : 
        theme === 'orange' ? 'bg-gradient-to-r from-orange-100/80 to-amber-50/80 border-orange-300' :
        'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className={`font-semibold text-lg ${getTextPrimary()}`}>🌐 Network</h3>
            <p className={`text-sm ${getTextSecondary()}`}>
              {chainId === 11155111 ? "Sepolia Testnet" : "Wrong Network"}
            </p>
            <p className={`text-xs font-mono ${getTextMuted()}`}>{chainId}</p>
            {chainId !== 11155111 && (
              <p className="text-xs text-red-500">⚠️ Switch to Sepolia</p>
            )}
          </div>
          <div className="text-center">
            <h3 className={`font-semibold text-lg ${getTextPrimary()}`}>👤 Account</h3>
            <p className={`text-sm truncate ${getTextSecondary()}`}>
              {ethersSigner ? `${ethersSigner.address.slice(0, 6)}...${ethersSigner.address.slice(-4)}` : "Not connected"}
            </p>
            {ethersSigner && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).ethereum && (window as any).ethereum.disconnect) {
                    (window as any).ethereum.disconnect();
                  }
                  // Force page reload to reset state
                  window.location.reload();
                }}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
          <div className="text-center">
            <h3 className={`font-semibold text-lg ${getTextPrimary()}`}>🔗 Contract</h3>
            <p className={`text-sm truncate ${getTextSecondary()}`}>
              {sealedAuction.contractAddress ? `${sealedAuction.contractAddress.slice(0, 6)}...${sealedAuction.contractAddress.slice(-4)}` : "Not deployed"}
            </p>
            <p className="text-xs text-green-600 font-semibold">✅ Deployed</p>
            <p className="text-xs text-blue-600 mt-1">
              🔗 <a href={`https://sepolia.etherscan.io/address/${sealedAuction.contractAddress}`} target="_blank" rel="noopener noreferrer" className="underline">View on Etherscan</a>
            </p>
          </div>
        </div>
      </div>


      {/* Auction Info Display */}
      <div className="col-span-full mx-20 px-6 py-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auction Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 overflow-hidden">
              {auctionItem.image ? (
                <img 
                  src={auctionItem.image} 
                  alt={auctionItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏺</div>
                    <p className={`font-semibold ${getTextMuted()}`}>No Image</p>
                    <p className={`text-sm ${getTextMuted()}`}>No image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auction Details */}
          <div className="space-y-4">
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${getTextPrimary()}`}>{auctionItem.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">
                  {auctionItem.category}
                </span>
                {isSeller && (
                  <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    👑 You are the seller
                  </span>
        )}
      </div>
              <div className={`text-sm ${getTextSecondary()}`}>
                <span className="font-medium">Seller:</span> {auctionItem.seller.slice(0, 6)}...{auctionItem.seller.slice(-4)}
              </div>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-2 ${getTextPrimary()}`}>Description</h4>
              <p className={`leading-relaxed ${getTextSecondary()}`}>{auctionItem.description}</p>
            </div>

            {/* Auction Status */}
            {sealedAuction.state && (
              <div className="mb-6">
                <h4 className={`font-semibold mb-4 text-lg ${getTextPrimary()}`}>📊 Auction Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Status */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-gray-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-2xl mb-2">
                      {sealedAuction.state.isBidding ? '🟢' : sealedAuction.state.isEnded ? '🔴' : '🟠'}
                    </div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Status</div>
                    <div className={`text-sm font-bold mt-1 ${
                      sealedAuction.state.isBidding ? 'text-green-600' : 
                      sealedAuction.state.isEnded ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {sealedAuction.state.isBidding ? 'Active' : 
                       sealedAuction.state.isEnded ? 'Ended' : 'Expired'}
                    </div>
                  </div>

                  {/* Time Left */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-gray-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-2xl mb-2">⏰</div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Time Left</div>
                    <div className={`text-sm font-bold mt-1 ${
                      sealedAuction.state.isBidding ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sealedAuction.state.isBidding ? 
                        `${Math.max(0, Math.floor((Number(sealedAuction.state._endTime) - Date.now()/1000) / 60))} min` : 
                        sealedAuction.state.isEnded ? "Ended" : "Expired"}
                    </div>
                  </div>

                  {/* Total Bids */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-gray-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-2xl mb-2">📊</div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Bids</div>
                    <div className="text-sm font-bold mt-1 text-blue-600">{sealedAuction.state._bids}</div>
                  </div>
                </div>
              </div>
            )}


            {/* Bidding Controls */}
            <div className="mt-6 space-y-4">
              {/* Bid Amount Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${getTextSecondary()}`}>
                  Bid Amount (ETH)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getInputBg()}`}
                  placeholder="Enter bid amount"
                  min="0"
                  step="0.001"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Refresh Button */}
        <button
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    sealedAuction.canRefresh
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canRefresh}
                  onClick={sealedAuction.refreshState}
                >
                  🔄 Refresh
        </button>

                {/* Place Bid Button */}
        <button
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    sealedAuction.canPlaceBid
                      ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      : sealedAuction.isPlacingBid
                        ? 'bg-yellow-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canPlaceBid}
                  onClick={() => sealedAuction.placeBid(bidAmount)}
                >
                  {sealedAuction.canPlaceBid
                    ? "💰 Place Bid"
                    : sealedAuction.isPlacingBid
                      ? "⏳ Placing..."
                      : "❌ Cannot bid"}
        </button>

                {/* Finalize Button */}
        <button
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    sealedAuction.canFinalize
                      ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      : sealedAuction.isFinalizing
                        ? 'bg-yellow-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canFinalize}
                  onClick={sealedAuction.finalize}
                >
                  {sealedAuction.canFinalize
                    ? "🏁 Finalize"
                    : sealedAuction.isFinalizing
                      ? "⏳ Finalizing..."
                      : "❌ Cannot finalize"}
        </button>
              </div>

              {/* Get Results Directly Button - Only show when auction ended */}
              {sealedAuction.state?.isEnded && (
                <div className="text-center">
        <button
                    onClick={sealedAuction.getResultsDirectly}
                    className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    🔍 Get Results Directly
        </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Bypass permission check to get results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


        {/* Results Section */}
        {(sealedAuction.highestBidHandle || sealedAuction.winnerHandle) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🏅 Auction Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">Highest Bid</h4>
                  {sealedAuction.clearHighestBid ? (
                    <div>
                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        {typeof sealedAuction.clearHighestBid.clear === 'bigint' 
                          ? (() => {
                              const value = Number(sealedAuction.clearHighestBid.clear);
                              // If value is very small (likely wei), convert to ETH
                              if (value >= 1e18) {
                                return (value / 1e18).toFixed(4) + ' ETH';
                              } else {
                                // If value is small, display as is (might be a different unit)
                                return value.toLocaleString() + ' units';
                              }
                            })()
                          : sealedAuction.clearHighestBid.clear + ' ETH'
                        }
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        Raw: {sealedAuction.clearHighestBid.clear.toString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-mono text-blue-600 break-all">
                      {sealedAuction.highestBidHandle || "Not available"}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">Winner</h4>
                  {sealedAuction.clearWinner ? (
                    <div>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        {sealedAuction.clearWinner.clear}
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        Encrypted: {sealedAuction.winnerHandle}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-mono text-green-600 break-all">
                      {sealedAuction.winnerHandle || "Not available"}
                    </p>
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Grant View Permission Section - Only show if auction is finalized but no results */}
        {sealedAuction.state?.isEnded && !sealedAuction.highestBidHandle && !sealedAuction.winnerHandle && (
          <div className="mt-6">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className={`text-lg font-semibold mb-2 ${getTextPrimary()}`}>View Permission Required</h3>
                <p className={`text-sm mb-4 ${getTextSecondary()}`}>
                  Auction is finalized but you need permission to view results. Only the seller can grant this permission.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <strong>Note:</strong> The seller needs to call <code>grantView(your_address)</code> on the contract to allow you to see the results.
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-300 mb-4">
                  <p className="text-sm font-mono text-gray-700">
                    Your address: {ethersSigner?.address || "Not connected"}
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        )}
        
        {/* Message Bar */}
      {sealedAuction.message && (
        <div className="col-span-full mx-20">
          <div className={`${
            theme === 'dark' ? 'bg-gray-900' : 
            theme === 'orange' ? 'bg-orange-100' :
            'bg-gray-100'
          } ${getTextPrimary()} rounded-lg p-4 shadow-lg border ${getCardBorder()}`}>
            <div className="flex items-center">
              <div className="text-2xl mr-3">💬</div>
              <div>
                <h4 className={`font-semibold text-sm ${getTextMuted()} uppercase tracking-wide`}>Status Message</h4>
                <p className={`${getTextPrimary()} font-mono text-sm break-all`}>{sealedAuction.message}</p>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
};
