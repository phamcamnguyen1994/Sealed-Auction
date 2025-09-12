"use client";

import { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSealedAuctionFHE } from "@/hooks/useSealedAuctionFHE";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { AuctionMarketplace } from "./AuctionMarketplace";
import { HowItWorks } from "./HowItWorks";
import { useTheme } from "../contexts/ThemeContext";

interface SealedAuctionFHEProps {
  auctionAddress?: string;
  auctionImage?: string;
  onBack?: () => void;
  onShowHowItWorks?: () => void;
}

/*
 * Main SealedAuction React component with FHE operations
 *  - "Refresh" button: allows you to get the current auction state.
 *  - "Place Bid" button: allows you to place a sealed bid using FHE operations.
 *  - "Finalize" button: allows you to finalize the auction.
 */
export const SealedAuctionFHE = ({ 
  auctionAddress, 
  auctionImage, 
  onBack, 
  onShowHowItWorks 
}: SealedAuctionFHEProps) => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { theme, toggleTheme } = useTheme();
  const [bidAmount, setBidAmount] = useState<number>(70);
  const [showMarketplace, setShowMarketplace] = useState<boolean>(false);
  const [currentContractAddress, setCurrentContractAddress] = useState<string | null>(auctionAddress || null);
  const [isDisconnected, setIsDisconnected] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [auctionItem, setAuctionItem] = useState<{
    name: string;
    description: string;
    image: string | null;
    category: string;
    seller: string;
    endTime?: number;
    createdAt?: number;
    bidCount?: number;
  }>({
    name: "Welcome to Sealed Auction",
    description: "Select an auction from the marketplace to view details and place bids",
    image: auctionImage || null,
    category: "Welcome",
    seller: "" // Empty seller address by default
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
  // useSealedAuctionFHE is a custom hook containing all the SealedAuction logic, including
  // - calling the SealedAuction contract
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
    currentContractAddress, // Pass the current contract address
  });

  //////////////////////////////////////////////////////////////////////////////
  // UI Stuff:
  // --------
  // A basic page containing
  // - A bunch of debug values allowing you to better visualize the React state
  // - 1x "Refresh" button (to get the current auction state)
  // - 1x "Place Bid" button (to place a sealed bid using FHE operations)
  // - 1x "Finalize" button (to finalize the auction)
  //////////////////////////////////////////////////////////////////////////////

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";



  // Get seller address from contract (if available)
  const [contractSeller, setContractSeller] = useState<string | null>(null);
  
  // Load seller address from contract when contract address changes
  useEffect(() => {
    const loadSellerFromContract = async () => {
      if (!currentContractAddress || !ethersReadonlyProvider) {
        setContractSeller(null);
        return;
      }
      
      try {
        const contractData = await import('../contracts/SealedAuction.json');
        const contract = new ethers.Contract(
          currentContractAddress,
          contractData.abi,
          ethersReadonlyProvider
        );
        
        const sellerAddress = await contract.seller();
        console.log('🏪 Loaded seller address from contract:', sellerAddress);
        setContractSeller(sellerAddress);
      } catch (error) {
        console.log('❌ Failed to load seller from contract:', error);
        setContractSeller(null);
      }
    };
    
    loadSellerFromContract();
  }, [currentContractAddress, ethersReadonlyProvider]);
  
  // Check if current user is the seller
  const isSeller = useMemo(() => {
    const sellerAddress = contractSeller || auctionItem.seller;
    // Only return true if we have a valid seller address and it matches current user
    if (!sellerAddress || !ethersSigner?.address) {
      return false;
    }
    return ethersSigner.address.toLowerCase() === sellerAddress.toLowerCase();
  }, [ethersSigner?.address, contractSeller, auctionItem.seller]);

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

  // Listen for connect wallet event from hero section
  useEffect(() => {
    const handleConnectWallet = () => {
      setIsDisconnected(false);
      connect();
    };

    window.addEventListener('connect-wallet', handleConnectWallet);
    return () => {
      window.removeEventListener('connect-wallet', handleConnectWallet);
    };
  }, [connect]);

  // Listen for auction selection from marketplace
  useEffect(() => {
    const handleAuctionSelected = (event: any) => {
      const { 
        contractAddress, 
        auctionId, 
        auctionName, 
        auctionDescription, 
        auctionImage,
        auctionEndTime, 
        auctionCreatedAt, 
        auctionBidCount,
        auctionSeller,
        autoRefresh 
      } = event.detail;
      
      console.log('🎯 Auction selected event received:', { 
        contractAddress, 
        auctionId, 
        auctionName, 
        auctionDescription,
        auctionImage,
        autoRefresh 
      });
      console.log('🎯 Setting current contract address to:', contractAddress);
      
      setCurrentContractAddress(contractAddress);
      
      // Update auction item immediately with data from marketplace
      setAuctionItem(prev => ({
        ...prev,
        name: auctionName || `Auction ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
        description: auctionDescription || "Auction created on the blockchain",
        image: auctionImage || prev.image, // Use marketplace image first
        endTime: auctionEndTime || prev.endTime,
        createdAt: auctionCreatedAt || prev.createdAt,
        bidCount: auctionBidCount || prev.bidCount,
        seller: auctionSeller || prev.seller // Add seller from marketplace
      }));
      
      // Close marketplace and show auction details
      setShowMarketplace(false);
      
      // Still try to load additional info from Registry (on-chain only)
      loadAuctionInfoFromRegistry(contractAddress);
      
      // Auto-refresh if requested
      if (autoRefresh) {
        console.log('🔄 Auto-refresh triggered after auction selection');
        // Delay auto-refresh to allow component to mount first
        setTimeout(() => {
          console.log('🔄 Executing auto-refresh...');
          // Trigger refresh by dispatching a custom event
          window.dispatchEvent(new CustomEvent('trigger-refresh'));
        }, 1500); // 1.5 second delay to ensure component is ready
      }
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

    const handleTriggerRefresh = () => {
      console.log('🔄 Trigger refresh event received');
      if (sealedAuction.refreshState) {
        console.log('🔄 Executing refresh...');
        sealedAuction.refreshState();
      }
    };

    window.addEventListener('auction-selected', handleAuctionSelected);
    window.addEventListener('auction-data-loaded', handleAuctionDataLoaded);
    window.addEventListener('trigger-refresh', handleTriggerRefresh);
    
    // No localStorage - only load from Registry when auction is selected
    console.log('🔄 Component mounted, waiting for auction selection...');

    return () => {
      window.removeEventListener('auction-selected', handleAuctionSelected);
      window.removeEventListener('auction-data-loaded', handleAuctionDataLoaded);
      window.removeEventListener('trigger-refresh', handleTriggerRefresh);
    };
  }, [sealedAuction]);

  // Load auction info from SealedAuction contract (real-time data)
  const loadAuctionInfoFromRegistry = async (contractAddress: string) => {
    if (!ethersReadonlyProvider) return;
    
    console.log('🔍 Loading auction info for contract:', contractAddress);
    
    try {
      // Load from SealedAuction contract for real-time data
      const auctionData = await import('../contracts/SealedAuction.json');
      const auctionContract = new ethers.Contract(
        contractAddress,
        auctionData.abi,
        ethersReadonlyProvider
      );
      
      // Get seller address from contract
      const sellerAddress = await auctionContract.seller();
      console.log('✅ Seller address from contract:', sellerAddress);
      
      // Try to get additional info from Registry if available
      try {
        const registryData = await import('../contracts/AuctionRegistry.json');
        const registryContract = new ethers.Contract(
          registryData.address,
          registryData.abi,
          ethersReadonlyProvider
        );
        
        const auctionInfo = await registryContract.getAuctionByAddress(contractAddress);
        console.log('✅ Auction info from Registry:', auctionInfo);
        
        // Load image from contract if available
        let imageUrl = null;
        try {
          const auctionData = await import('../contracts/SealedAuction.json');
          const auctionContract = new ethers.Contract(
            contractAddress,
            auctionData.abi,
            ethersReadonlyProvider
          );
          
          const imageHash = await auctionContract.imageHash();
          if (imageHash && imageHash !== '') {
            imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
            console.log('🖼️ Loaded image from contract:', { imageHash, imageUrl });
          }
        } catch (e) {
          console.log('⚠️ Could not load image from contract:', e);
        }

        // Update auction item with info from both sources
        setAuctionItem(prev => ({
          ...prev,
          name: prev.name || auctionInfo.name || `Auction ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
          description: prev.description || auctionInfo.description || "Auction created on the blockchain",
          seller: prev.seller || auctionInfo.creator || sellerAddress, // Keep marketplace data first, then registry, then contract
          image: prev.image || imageUrl // Keep marketplace image first, fallback to contract image
        }));
      } catch (registryError) {
        console.log('⚠️ Registry not available, using contract data only');
        // Load image from contract if available (fallback case)
        let imageUrl = null;
        try {
          const auctionData = await import('../contracts/SealedAuction.json');
          const auctionContract = new ethers.Contract(
            contractAddress,
            auctionData.abi,
            ethersReadonlyProvider
          );
          
          const imageHash = await auctionContract.imageHash();
          if (imageHash && imageHash !== '') {
            imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
            console.log('🖼️ Loaded image from contract (fallback):', { imageHash, imageUrl });
          }
        } catch (e) {
          console.log('⚠️ Could not load image from contract (fallback):', e);
        }

        // Update with contract data only
        setAuctionItem(prev => ({
          ...prev,
          name: prev.name || `Auction ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
          description: prev.description || "Auction created on the blockchain",
          seller: prev.seller || sellerAddress, // Keep marketplace data first, then contract
          image: prev.image || imageUrl // Keep marketplace image first, fallback to contract image
        }));
      }
    } catch (error) {
      console.log('❌ Could not load auction info:', error);
      // Keep existing data
    }
  };




  if (!isConnected || isDisconnected) {
    return null; // Don't render anything, let the hero section handle it
  }

  // Don't show error if no contract is selected - just show marketplace
  if (sealedAuction.isDeployed === false && !currentContractAddress) {
    return <AuctionMarketplace onClose={() => setShowMarketplace(false)} />;
  }
  
  if (sealedAuction.isDeployed === false && currentContractAddress) {
    return errorNotDeployed(chainId);
  }

  // Show marketplace if toggled OR if no auction is selected
  if (showMarketplace || (!currentContractAddress && isConnected)) {
    return <AuctionMarketplace onClose={() => setShowMarketplace(false)} />;
  }

  // Theme-aware styling functions
  const getCardBg = () => {
    switch (theme) {
      case 'dark': return 'bg-green-900/95 backdrop-blur-sm border border-green-800';
      case 'orange': return 'bg-orange-50/95 backdrop-blur-sm';
      default: return 'bg-white/95 backdrop-blur-sm';
    }
  };
  
  const getCardBorder = () => {
    switch (theme) {
      case 'dark': return 'border-green-700';
      case 'orange': return 'border-orange-200';
      default: return 'border-gray-200';
    }
  };
  
  const getTextPrimary = () => {
    switch (theme) {
      case 'dark': return 'text-green-100';
      case 'orange': return 'text-orange-900';
      default: return 'text-gray-900';
    }
  };
  
  const getTextSecondary = () => {
    switch (theme) {
      case 'dark': return 'text-green-200';
      case 'orange': return 'text-orange-700';
      default: return 'text-gray-600';
    }
  };
  
  const getTextMuted = () => {
    switch (theme) {
      case 'dark': return 'text-green-300';
      case 'orange': return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };
  
  const getInputBg = () => {
    switch (theme) {
      case 'dark': return 'bg-green-800 border-green-600 text-green-100 placeholder-green-400';
      case 'orange': return 'bg-orange-100 border-orange-300 text-orange-900 placeholder-orange-500';
      default: return 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
    }
  };

  return (
    <div className={`grid w-full gap-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-to-br from-green-950 to-emerald-900' : 
      theme === 'orange' ? 'bg-gradient-to-br from-orange-100 to-amber-50' : 
      'bg-gray-50'
    }`}>
      <div className={`col-span-full mx-8 bg-gradient-to-r ${
        theme === 'dark' ? 'from-green-800 to-emerald-700' : 
        theme === 'orange' ? 'from-orange-500 to-amber-600' : 
        'from-purple-600 to-blue-600'
      } text-white rounded-xl shadow-lg border border-green-700`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
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
                onClick={() => {
                  setShowHowItWorks(true);
                  onShowHowItWorks?.();
                }}
                className={`${
                  theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm text-gray-100 border border-gray-600' : 
                  theme === 'orange' ? 'bg-orange-600/20 backdrop-blur-sm text-white border border-orange-300/30' :
                  'bg-gray-800 text-white border border-gray-600'
                } px-4 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:scale-105 hover:shadow-xl`}
                title="Learn how FHE auctions work"
              >
                <span>📚</span>
                <span className="hidden md:inline">How It Works</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`${
                  theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm text-gray-100 border border-gray-600' : 
                  theme === 'orange' ? 'bg-orange-600/20 backdrop-blur-sm text-white border border-orange-300/30' :
                  'bg-gray-800 text-white border border-gray-600'
                } px-4 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:scale-105 hover:shadow-xl`}
                title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} - Click to cycle themes`}
              >
                <span>{
                  theme === 'dark' ? '🌙' : 
                  theme === 'orange' ? '🧡' : 
                  '☀️'
                }</span>
                <span className="hidden md:inline">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 hover:scale-105 hover:shadow-lg"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={() => setShowMarketplace(!showMarketplace)}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2 hover:scale-105 hover:shadow-lg"
              >
                <span>🏪</span>
                <span>{showMarketplace ? 'Hide' : 'Browse'} Marketplace</span>
              </button>
            </div>
          </div>
          
          {/* Connection Info moved here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>🌐 Network</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-blue-100'}`}>
                {chainId === 11155111 ? "Sepolia Testnet" : "Wrong Network"}
              </p>
              <p className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-blue-200'}`}>{chainId}</p>
              {chainId !== 11155111 && (
                <p className="text-xs text-red-300">⚠️ Switch to Sepolia</p>
              )}
            </div>
            <div className="text-center">
              <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>👤 Account</h3>
              <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-blue-100'}`}>
                {ethersSigner ? `${ethersSigner.address.slice(0, 6)}...${ethersSigner.address.slice(-4)}` : "Not connected"}
              </p>
              {ethersSigner && (
                <button
                  onClick={() => {
                    // Set disconnected state
                    setIsDisconnected(true);
                    
                    // Clear localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('active-contract-address');
                      localStorage.removeItem('wallet-connected');
                      localStorage.setItem('user-disconnected', 'true');
                      // Dispatch event to notify page.tsx
                      const event = new CustomEvent('wallet-disconnected');
                      window.dispatchEvent(event);
                    }
                  }}
                  className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
            <div className="text-center">
              <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>🔗 Contract</h3>
              <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-blue-100'}`}>
                {sealedAuction.contractAddress ? `${sealedAuction.contractAddress.slice(0, 6)}...${sealedAuction.contractAddress.slice(-4)}` : "Not deployed"}
              </p>
              <p className="text-xs text-green-300 font-semibold">✅ Deployed</p>
              <p className="text-xs text-blue-200 mt-1">
                🔗 <a href={`https://sepolia.etherscan.io/address/${sealedAuction.contractAddress}`} target="_blank" rel="noopener noreferrer" className="underline">View on Etherscan</a>
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Auction Info Display */}
      <div className={`col-span-full mx-4 px-8 py-8 rounded-xl border-2 shadow-lg transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-green-800 to-emerald-700 border-green-600' 
          : theme === 'orange'
          ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
      }`}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Auction Image */}
          <div className="relative">
            <div className={`aspect-square rounded-xl border-2 overflow-hidden transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-green-700 to-emerald-600 border-green-500' 
                : theme === 'orange'
                ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
            }`}>
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
          <div className="space-y-6">
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
                <span className="font-medium">Seller:</span> {
                  (contractSeller || auctionItem.seller) ? 
                    `${(contractSeller || auctionItem.seller).slice(0, 6)}...${(contractSeller || auctionItem.seller).slice(-4)}` :
                    "Loading..."
                }
              </div>
              <div className={`text-xs ${getTextSecondary()}`}>
                <span className="font-medium">Contract:</span> {
                  currentContractAddress ? 
                    `${currentContractAddress.slice(0, 6)}...${currentContractAddress.slice(-4)}` :
                    "Loading..."
                }
              </div>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-2 ${getTextPrimary()}`}>Description</h4>
              <p className={`leading-relaxed ${getTextSecondary()}`}>{auctionItem.description}</p>
              
              {/* Welcome message when no auction is selected */}
              {!currentContractAddress && (
                <div className={`mt-4 p-4 rounded-xl shadow-sm animate-fade-in-up delay-300 border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-green-700 to-emerald-600 border-green-500' 
                    : theme === 'orange'
                    ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300'
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                }`}>
                  <div className={`flex items-center space-x-3 ${
                    theme === 'dark' ? 'text-gray-200' : 
                    theme === 'orange' ? 'text-orange-800' : 
                    'text-blue-800'
                  }`}>
                    <span className="text-3xl animate-bounce">👋</span>
                    <div>
                      <h5 className={`font-semibold text-lg ${
                        theme === 'dark' ? 'text-gray-100' : 
                        theme === 'orange' ? 'text-orange-900' : 
                        'text-blue-900'
                      }`}>Welcome to Sealed Auction!</h5>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 
                        theme === 'orange' ? 'text-orange-700' : 
                        'text-blue-600'
                      }`}>
                        Click "Browse Marketplace" above to explore available auctions and start bidding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auction Status */}
            {sealedAuction.state && (
              <div className="mb-6">
                <h4 className={`font-semibold mb-4 text-lg ${getTextPrimary()} animate-fade-in-up`}>📊 Auction Status</h4>
                <div className="grid grid-cols-3 gap-6">
                  {/* Status */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-green-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up delay-100`}>
                    <div className="text-2xl mb-2">
                      {(() => {
                        if (sealedAuction.state.isEnded) return '🔴';
                        if (sealedAuction.blockTimestamp && Number(sealedAuction.state._endTime) <= sealedAuction.blockTimestamp) return '🟠';
                        return '🟢';
                      })()}
                    </div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Status</div>
                    <div className={`text-sm font-bold mt-1 ${
                      (() => {
                        if (sealedAuction.state.isEnded) return 'text-red-600';
                        if (sealedAuction.blockTimestamp && Number(sealedAuction.state._endTime) <= sealedAuction.blockTimestamp) return 'text-orange-600';
                        return 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        if (sealedAuction.state.isEnded) return 'Ended';
                        if (sealedAuction.blockTimestamp && Number(sealedAuction.state._endTime) <= sealedAuction.blockTimestamp) return 'Expired';
                        return 'Active';
                      })()}
                    </div>
                  </div>

                  {/* Time Left */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-green-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up delay-200`}>
                    <div className="text-2xl mb-2">⏰</div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Time Left</div>
                    <div className={`text-sm font-bold mt-1 ${
                      (() => {
                        if (sealedAuction.state.isEnded) return 'text-red-600';
                        if (sealedAuction.blockTimestamp && Number(sealedAuction.state._endTime) <= sealedAuction.blockTimestamp) return 'text-red-600';
                        return 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        if (sealedAuction.state.isEnded) return "Ended";
                        if (sealedAuction.blockTimestamp) {
                          const timeLeft = Math.max(0, Math.floor((Number(sealedAuction.state._endTime) - sealedAuction.blockTimestamp) / 60));
                          return timeLeft > 0 ? `${timeLeft} min` : "Expired";
                        }
                        return "Loading...";
                      })()}
                    </div>
                  </div>

                  {/* Total Bids */}
                  <div className={`text-center p-4 ${getCardBg()} rounded-lg border-2 ${
                    theme === 'dark' ? 'border-green-600' : 
                    theme === 'orange' ? 'border-orange-300' :
                    'border-blue-200'
                  } shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up delay-300`}>
                    <div className="text-2xl mb-2">📊</div>
                    <div className={`text-xs ${getTextMuted()} font-medium uppercase tracking-wide`}>Bids</div>
                    <div className="text-sm font-bold mt-1 text-blue-600">{sealedAuction.state._bids}</div>
                  </div>
                </div>
              </div>
            )}


            {/* Bidding Controls */}
            <div className="mt-8 space-y-6 animate-fade-in-up delay-400">
              {/* Bid Amount Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${getTextSecondary()}`}>
                  💰 Bid Amount (ETH)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ${getInputBg()} hover:shadow-md focus:shadow-lg`}
                  placeholder="Enter bid amount"
                  min="0"
                  step="0.001"
                />
              </div>

              {/* Action Buttons - Only show when auction is selected */}
              {currentContractAddress && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-500">
                {/* Refresh Button */}
        <button
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    sealedAuction.canRefresh
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canRefresh}
                  onClick={sealedAuction.refreshState}
                >
                  🔄 Refresh
        </button>

                {/* Place Bid Button */}
        <button
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    sealedAuction.canPlaceBid
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105'
                      : sealedAuction.isPlacingBid
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white animate-pulse'
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
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    sealedAuction.canFinalize
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105'
                      : sealedAuction.isFinalizing
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canFinalize}
                  onClick={sealedAuction.finalize}
                >
                  {sealedAuction.canFinalize
                    ? "🏁 Finalize"
                    : sealedAuction.isFinalizing
                      ? "⏳ Finalizing..."
                      : sealedAuction.state?.isEnded
                        ? "✅ Finalized"
                        : "❌ Cannot finalize"}
        </button>
                </div>
              )}

              {/* Get Results Directly Button - Only show when auction ended */}
              {sealedAuction.state?.isEnded && (
                <div className="text-center space-y-2">
                  <button
                    onClick={sealedAuction.getResultsDirectly}
                    className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    🔍 Get Results Directly
                  </button>
                  <p className="text-xs text-gray-500">
                    Bypass permission check to get results
                  </p>
                  
                  {sealedAuction.sellerAddress && 
                   sealedAuction.sellerAddress.toLowerCase() === sealedAuction.ethersSigner?.address?.toLowerCase() && (
                    <>
                      <button
                        onClick={sealedAuction.getBiddersFromEvents}
                        className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        📋 Get Bidders from Events
                      </button>
                      <p className="text-xs text-gray-500">
                        Seller only: Query on-chain events to see all bidders
                      </p>
                      
                      <button
                        onClick={sealedAuction.grantViewToAllBidders}
                        className="py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        🔑 Grant View to All Bidders
                      </button>
                      <p className="text-xs text-gray-500">
                        Seller only: Grant FHE decrypt permissions to all bidders (1 transaction)
                      </p>
                    </>
                  )}
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
        <div className="col-span-full mx-8">
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

      {/* How It Works Modal */}
      <HowItWorks 
        isVisible={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />
    </div>
  );
};
