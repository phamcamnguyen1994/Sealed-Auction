"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useTheme } from "../contexts/ThemeContext";
import { ImageUpload } from "./ImageUpload";

interface AuctionInfo {
  id: string;
  contractAddress: string;
  name: string;
  description: string;
  createdAt: number;
  endTime: number;
  status: 'active' | 'ended' | 'finalized';
  bidCount: number;
  highestBid?: string;
  winner?: string;
  seller?: string;
  creator?: string;
  imageHash?: string;
  imageUrl?: string;
}

interface AuctionMarketplaceProps {
  onClose?: () => void;
}

export const AuctionMarketplace = ({ onClose }: AuctionMarketplaceProps) => {
  const { theme, toggleTheme } = useTheme();
  const [auctions, setAuctions] = useState<AuctionInfo[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [isCreatingAuction, setIsCreatingAuction] = useState(false);
  const [newAuctionName, setNewAuctionName] = useState("");
  const [newAuctionDescription, setNewAuctionDescription] = useState("");
  const [newAuctionDuration, setNewAuctionDuration] = useState(300); // 5 minutes default
  const [newAuctionImage, setNewAuctionImage] = useState<string | null>(null);
  const [newAuctionImageHash, setNewAuctionImageHash] = useState<string>("");
  const [registryContract, setRegistryContract] = useState<ethers.Contract | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended' | 'finalized'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [auctionsPerPage] = useState(9);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Handle IPFS image upload
  const handleImageUploaded = (ipfsHash: string, imageUrl: string) => {
    setNewAuctionImageHash(ipfsHash);
    setNewAuctionImage(imageUrl);
  };
  
  // Registry contract address (deployed on Sepolia)
  const REGISTRY_ADDRESS = "0xeE00ba349b4CAe6eC1a0e48e0aF6c6Bc72Ff8b65";

  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
  } = useMetaMaskEthersSigner();

  // Initialize Registry contract
  useEffect(() => {
    if (ethersReadonlyProvider) {
      const loadRegistryContract = async () => {
        try {
          const registryData = await import('../contracts/AuctionRegistry.json');
          const contract = new ethers.Contract(
            REGISTRY_ADDRESS,
            registryData.abi,
            ethersReadonlyProvider
          );
          setRegistryContract(contract);
          console.log("✅ Registry contract loaded:", REGISTRY_ADDRESS);
          console.log("🌐 Network:", (ethersReadonlyProvider as any).network);
          console.log("🔗 Contract instance:", contract);
        } catch (error) {
          console.error("❌ Failed to load Registry contract:", error);
        }
      };
      loadRegistryContract();
    }
  }, [ethersReadonlyProvider]);

  // Load auctions from Registry contract (on-chain only)
  useEffect(() => {
    if (registryContract) {
      loadAuctionsFromRegistry("component-mount");
    } else {
      console.log("Registry contract not loaded, no fallback");
      setAuctions([]);
    }
  }, [registryContract]);

  const loadAuctionsFromRegistry = async (source = "unknown") => {
    if (!registryContract) {
      console.log("❌ Registry contract not loaded, no fallback");
      return;
    }
    
    try {
      console.log("🔄 Loading auctions from Registry...");
      console.log("📍 Registry address:", "0xeE00ba349b4CAe6eC1a0e48e0aF6c6Bc72Ff8b65");
      console.log("🌐 Current network chainId:", chainId);
      console.log("🔗 Provider:", (ethersReadonlyProvider as any)?.network);
      console.log("🎯 Called from:", source);
      
      // Debug RPC endpoint
      if (ethersReadonlyProvider && 'connection' in ethersReadonlyProvider) {
        console.log("🌐 RPC endpoint:", (ethersReadonlyProvider as any).connection?.url);
      } else if (ethersReadonlyProvider && 'provider' in ethersReadonlyProvider) {
        console.log("🌐 RPC endpoint:", (ethersReadonlyProvider as any).provider?.connection?.url);
      } else {
        console.log("🌐 RPC endpoint: MetaMask BrowserProvider (no direct URL)");
      }
      
      // First check if Registry has any auctions
      const totalAuctions = await registryContract.getTotalAuctions();
      console.log("📊 Total auctions in Registry:", Number(totalAuctions));
      console.log("⏰ Timestamp:", new Date().toISOString());
      console.log("🔍 Environment:", process.env.NODE_ENV || 'development');
      console.log("🔍 NEXT_PUBLIC_RPC_URL:", process.env.NEXT_PUBLIC_RPC_URL || 'not set');
      console.log("🔍 NEXT_PUBLIC_CHAIN_ID:", process.env.NEXT_PUBLIC_CHAIN_ID || 'not set');
      
      if (Number(totalAuctions) === 0) {
        console.log("❌ No auctions found in Registry");
        setAuctions([]);
        return;
      }
      
      // Get all auctions
      const allAuctions = await registryContract.getAllAuctions();
      console.log("📋 Raw auctions data from Registry:", allAuctions);
      console.log("📊 Total auctions returned:", allAuctions.length);
      
      // Debug: Check each auction address individually (skip if function doesn't exist)
      try {
        for (let i = 0; i < Number(totalAuctions); i++) {
          try {
            const auctionAddress = await registryContract.getAuctionAddress(i);
            const auctionInfo = await registryContract.getAuctionByAddress(auctionAddress);
            console.log(`🔍 Individual check - Auction ${i}:`, {
              address: auctionAddress,
              name: auctionInfo.name,
              description: auctionInfo.description
            });
          } catch (error) {
            console.log(`❌ Error checking auction ${i}:`, error);
          }
        }
      } catch (error) {
        console.log("⚠️ getAuctionAddress function not available, skipping individual checks");
      }
      
      if (!allAuctions || allAuctions.length === 0) {
        console.log("No auctions returned from getAllAuctions");
        setAuctions([]);
        return;
      }
      
      const formattedAuctions: AuctionInfo[] = await Promise.all(
        allAuctions.map(async (auction: any, index: number) => {
        console.log(`📋 Auction ${index}:`, auction);
        
        // Handle different data structures
        const contractAddress = auction.contractAddress || auction[0];
        const name = auction.name || auction[2] || `Auction ${index + 1}`;
        const description = auction.description || auction[3] || '';
        const createdAt = Number(auction.createdAt || auction[4]) * 1000;
          
          // Load real-time data from SealedAuction contract
          let endTime = Number(auction.endTime || auction[5]) * 1000;
          let bidCount = Number(auction.bidCount || auction[7] || 0);
          let isActive = auction.isActive !== undefined ? auction.isActive : auction[6];
          let realSeller = auction.creator || auction[1] || ''; // Default to Registry creator
          
          // Initialize image variables
          let imageHash = '';
          let imageUrl = '';
          
          if (contractAddress && ethersReadonlyProvider) {
            try {
              // Load SealedAuction contract data
              const auctionData = await import('../contracts/SealedAuction.json');
              const auctionContract = new ethers.Contract(
                contractAddress,
                auctionData.abi,
                ethersReadonlyProvider
              );
              
              // Get real-time state from contract
              const state = await auctionContract.getState();
              endTime = Number(state._endTime) * 1000;
              bidCount = Number(state._bids);
              isActive = !state.isEnded && endTime > Date.now();
              
              // Get real seller from SealedAuction contract
              const seller = await auctionContract.seller();
              realSeller = seller;
              
              // Get image hash from contract (if available)
              try {
                // Try to get image hash from contract
                if (auctionContract.imageHash) {
                  imageHash = await auctionContract.imageHash();
                  if (imageHash && imageHash !== '') {
                    imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
                  }
                }
              } catch (e) {
                console.log('No imageHash function in contract or no image set');
              }
              
              console.log(`🔍 Real-time data for ${contractAddress}:`, {
                endTime: new Date(endTime).toLocaleString(),
                bidCount,
                isActive,
                isEnded: state.isEnded,
                realSeller: seller
              });
            } catch (error) {
              console.log(`⚠️ Could not load real-time data for ${contractAddress}:`, error);
            }
          }
        
        return {
          id: contractAddress || `auction-${index}`,
          contractAddress: contractAddress || '',
          name: name,
          description: description,
          createdAt: createdAt,
          endTime: endTime,
          status: isActive ? 'active' : 'ended',
          bidCount: bidCount,
          seller: realSeller, // Use real seller from SealedAuction contract
          creator: realSeller, // Also add as creator
          imageHash: imageHash,
          imageUrl: imageUrl
        };
        })
      );
      
      // Debug: Log all contract addresses before deduplication
      console.log("🔍 Contract addresses before deduplication:", 
        formattedAuctions.map(a => a.contractAddress)
      );
      
      // Remove duplicates based on contract address
      const uniqueAuctions = formattedAuctions.filter((auction, index, self) => 
        index === self.findIndex(a => a.contractAddress === auction.contractAddress)
      );
      
      console.log("🔍 Before deduplication:", formattedAuctions.length);
      console.log("✅ After deduplication:", uniqueAuctions.length);
      console.log("🔍 Contract addresses after deduplication:", 
        uniqueAuctions.map(a => a.contractAddress)
      );
      
      setAuctions(uniqueAuctions);
      console.log("✅ Loaded auctions from Registry:", uniqueAuctions.length);
      console.log("📋 Final auctions list:", uniqueAuctions);
    } catch (error) {
      console.error("❌ Failed to load auctions from Registry:", error);
      setAuctions([]);
    }
  };

  // No localStorage - auctions are loaded from Registry only

  // Create new auction function
  const createNewAuction = async () => {
    if (!ethersSigner) {
      alert("Please connect your wallet first");
      return;
    }

    if (chainId !== 11155111) {
      alert("Please switch to Sepolia Testnet to create auctions");
      return;
    }

    if (!newAuctionName.trim()) {
      alert("Please enter an auction name");
      return;
    }

    // Check if wallet has enough ETH for deployment
    try {
      if (ethersReadonlyProvider && 'getBalance' in ethersReadonlyProvider) {
        const balance = await (ethersReadonlyProvider as any).getBalance(ethersSigner.address);
        const balanceInEth = ethers.formatEther(balance || 0);
        console.log("Wallet balance:", balanceInEth, "ETH");
        
        if (parseFloat(balanceInEth) < 0.001) {
          alert("Insufficient ETH balance. Please get some Sepolia ETH from a faucet.");
          return;
        }
      }
    } catch (balanceError) {
      console.warn("Could not check balance:", balanceError);
    }

    setIsCreatingAuction(true);
    try {
      // Import AuctionFactory ABI and bytecode for single-transaction creation
      const factoryData = await import('../contracts/AuctionFactory.json');
      const abi = factoryData.abi;
      const bytecode = factoryData.bytecode;
      const factoryAddress = factoryData.address;
      
      console.log("Contract data loaded:", {
        hasAbi: !!abi,
        hasBytecode: !!bytecode,
        abiLength: abi?.length,
        bytecodeLength: bytecode?.length
      });
      
      if (!abi) {
        throw new Error("Invalid contract data: missing ABI");
      }

      if (!bytecode) {
        throw new Error("Invalid contract data: missing bytecode");
      }

      if (!newAuctionDuration || newAuctionDuration <= 0) {
        throw new Error("Invalid auction duration");
      }

      // Use AuctionFactory to create auction and register in one transaction
      console.log("Creating auction using AuctionFactory with duration:", newAuctionDuration);
      console.log("📍 Factory address:", factoryAddress);
      
      const factoryContract = new ethers.Contract(
        factoryAddress,
        abi,
        ethersSigner
      );

      console.log("Creating auction via factory...");
      
      // Retry logic for nonce issues
      let tx;
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: any = null;
      
      while (retryCount < maxRetries) {
        try {
          tx = await factoryContract.createAuction(
            newAuctionDuration,
            newAuctionName,
            newAuctionDescription,
            newAuctionImageHash || "" // Add IPFS hash as 4th parameter
          );
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          console.log(`Create auction attempt ${retryCount + 1} failed:`, {
            code: error.code,
            message: error.message,
            reason: error.reason
          });
          
          if (error.code === 'NONCE_EXPIRED' || error.message?.includes('nonce')) {
            retryCount++;
            console.log(`Nonce error, retrying... (${retryCount}/${maxRetries})`);
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error; // Re-throw if it's not a nonce error
        }
      }
      
      if (!tx) {
        const errorMessage = lastError 
          ? `Failed to create auction after ${maxRetries} retries. Last error: ${lastError.message || lastError.reason || 'Unknown error'}`
          : `Failed to create auction after ${maxRetries} retries`;
        throw new Error(errorMessage);
      }
      
      console.log("Auction creation transaction:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Auction creation confirmed");
      
      // Get auction address from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          return parsed?.name === 'AuctionCreated';
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error("Could not find AuctionCreated event");
      }
      
      const parsedEvent = factoryContract.interface.parseLog(event);
      const contractAddress = parsedEvent?.args.auctionAddress;
      console.log("New auction created at:", contractAddress);

      // Auction is automatically registered by AuctionFactory
      console.log("✅ Auction created and registered in one transaction!");
      console.log("⏰ Creation completed at:", new Date().toISOString());
      
      // Reload auctions from Registry after successful creation
      console.log("🔄 Reloading auctions from Registry after creation...");
      console.log("⏰ Reload started at:", new Date().toISOString());
      await loadAuctionsFromRegistry("after-creation");
      console.log("✅ Auctions reloaded from Registry");
      console.log("⏰ Reload completed at:", new Date().toISOString());

      // No localStorage - all data is on-chain via Registry contract

      // Add to local auctions list for immediate display
      const newAuction: AuctionInfo = {
        id: contractAddress,
        contractAddress: contractAddress,
        name: newAuctionName,
        description: newAuctionDescription,
        createdAt: Date.now(),
        endTime: Date.now() + (newAuctionDuration * 1000),
        status: 'active',
        bidCount: 0,
        imageHash: newAuctionImageHash,
        imageUrl: newAuctionImage
      };
      
      setAuctions(prev => [newAuction, ...prev]);

      // Reset form
      setNewAuctionName("");
      setNewAuctionDescription("");
      setNewAuctionDuration(300);
      setNewAuctionImage(null);
      setNewAuctionImageHash("");
      
      alert(`🎉 New auction "${newAuctionName}" created successfully!\n\n📍 Contract Address: ${contractAddress}\n✅ Created and registered in ONE transaction!\n\n🚀 Auction is now live on the blockchain and visible to all users.`);
      
    } catch (error: any) {
      console.error("Failed to create auction:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        data: error?.data
      });
      
      // Provide more helpful error messages based on error type
      let errorMessage = "Failed to create auction";
      if (error?.message?.includes("insufficient funds")) {
        errorMessage = "❌ Insufficient funds for gas fees. Please add more ETH to your wallet.";
      } else if (error?.message?.includes("user rejected")) {
        errorMessage = "❌ Transaction was rejected by user. Please try again.";
      } else if (error?.message?.includes("nonce")) {
        errorMessage = "❌ Transaction nonce error. Please wait a moment and try again.";
      } else if (error?.message?.includes("network")) {
        errorMessage = "❌ Network error. Please check your connection and try again.";
      } else {
        errorMessage = `❌ ${error?.message || error?.reason || "Unknown error occurred"}`;
      }
      
      alert(`${errorMessage}\n\nPlease check console for technical details.`);
    } finally {
      setIsCreatingAuction(false);
    }
  };

  // Get auction status
  const getAuctionStatus = (auction: AuctionInfo) => {
    const now = Date.now();
    if (auction.status === 'finalized') return 'finalized';
    if (now > auction.endTime) return 'ended';
    return 'active';
  };

  // Filter and sort auctions
  const filteredAndSortedAuctions = auctions
    .filter(auction => {
    const matchesSearch = auction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getAuctionStatus(auction) === statusFilter;
    return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt; // Newest first
        case 'oldest':
          return a.createdAt - b.createdAt; // Oldest first
        case 'name':
          return a.name.localeCompare(b.name); // Alphabetical
        default:
          return b.createdAt - a.createdAt;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAuctions.length / auctionsPerPage);
  const startIndex = (currentPage - 1) * auctionsPerPage;
  const endIndex = startIndex + auctionsPerPage;
  const paginatedAuctions = filteredAndSortedAuctions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Format time remaining
  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = endTime - now;
    if (remaining <= 0) return "Ended";
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isConnected) {
  return (
    <div className="w-full mx-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔐 Auction Marketplace</h1>
          <p className="text-gray-600 mb-8">Connect your wallet to start creating and participating in sealed auctions</p>
          <button
            onClick={connect}
            className={`${
              theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 hover:from-gray-600 hover:to-gray-700' :
              theme === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700' :
              'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            } px-8 py-4 rounded-lg font-semibold transition-all`}
          >
            Connect to MetaMask
          </button>
        </div>
      </div>
    );
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
    <div className={`w-full mx-8 p-6 transition-colors duration-300 relative overflow-hidden ${
      theme === 'dark' ? 'bg-gradient-to-br from-green-950 to-emerald-900' : 
      theme === 'orange' ? 'bg-gradient-to-br from-orange-100 to-amber-50' : 
      'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30'
    }`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-blue-300 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-purple-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-blue-200 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-ping opacity-30"></div>
      </div>
      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <h1 className={`text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-fade-in-up`}>
            <span className="inline-block animate-bounce">🔐</span> Auction Marketplace
          </h1>
          <button
            onClick={toggleTheme}
            className={`${
              theme === 'dark' ? 'bg-green-800/50 backdrop-blur-sm text-green-100 border border-green-600' : 
              theme === 'orange' ? 'bg-orange-600/20 backdrop-blur-sm text-white border border-orange-300/30' :
              'bg-gray-800 text-white border border-gray-600'
            } px-4 py-2 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:scale-105 hover:shadow-xl animate-fade-in-right delay-100`}
            title={`Current: ${theme === 'dark' ? 'Forest' : theme.charAt(0).toUpperCase() + theme.slice(1)} - Click to cycle themes`}
          >
            <span>{
              theme === 'dark' ? '🌲' : 
              theme === 'orange' ? '🧡' : 
              '☀️'
            }</span>
            <span className="hidden md:inline">{theme === 'dark' ? 'Forest' : theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
          </button>
        </div>
        <p className={`text-xl ${getTextSecondary()} mb-2 animate-fade-in-up delay-200`}>Create and participate in confidential sealed auctions</p>
        <p className={`text-sm ${getTextMuted()} animate-fade-in-up delay-300`}>Powered by FHEVM technology for secure, private bidding</p>
      </div>

      {/* Create New Auction Section - Collapsible */}
      <div className={`${getCardBg()} rounded-xl shadow-lg border ${getCardBorder()} mb-8 animate-fade-in-up delay-400 hover:shadow-xl transition-all duration-300`}>
        <div 
          className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300"
          onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${getTextPrimary()} flex items-center space-x-2`}>
              <span className="animate-bounce">🚀</span>
              <span>Create New Auction</span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getTextMuted()}`}>
                {isCreateFormOpen ? 'Click to collapse' : 'Click to expand'}
              </span>
              <div className={`transform transition-transform duration-200 ${isCreateFormOpen ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </div>
          </div>
        </div>
        
        {isCreateFormOpen && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auction Name</label>
                <input
                  type="text"
                  value={newAuctionName}
                  onChange={(e) => setNewAuctionName(e.target.value)}
                  placeholder="e.g., Rare NFT Collection"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={newAuctionDuration}
                  onChange={(e) => setNewAuctionDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={60}>1 minute (testing)</option>
                  <option value={300}>5 minutes (testing)</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                  <option value={86400}>1 day</option>
                  <option value={259200}>3 days</option>
                  <option value={604800}>1 week</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={newAuctionDescription}
                onChange={(e) => setNewAuctionDescription(e.target.value)}
                placeholder="Describe what's being auctioned..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Auction Image (optional)</label>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImageUrl={newAuctionImage || undefined}
                disabled={isCreatingAuction}
              />
            </div>
            <button
              onClick={createNewAuction}
              disabled={isCreatingAuction || !newAuctionName.trim()}
              className={`mt-4 ${
                theme === 'dark' ? 'bg-gradient-to-r from-green-700 to-emerald-800 text-green-100 hover:from-green-600 hover:to-emerald-700' :
                theme === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700' :
                'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              } px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
            >
              {isCreatingAuction ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Create Auction</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Auctions List */}
      <div className={`${getCardBg()} rounded-xl shadow-lg border ${getCardBorder()} p-6 animate-fade-in-up delay-500 hover:shadow-xl transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${getTextPrimary()} flex items-center space-x-2`}>
            <span className="animate-pulse">🏪</span>
            <span>All Auctions</span>
          </h2>
          <button
            onClick={() => {
              // Load from Registry contract only (on-chain data)
              if (registryContract) {
                console.log("🔄 Refresh button clicked - loading from Registry");
                loadAuctionsFromRegistry("refresh-button");
              } else {
                console.log("❌ Registry contract not available");
                setAuctions([]);
              }
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transform flex items-center space-x-2 hover:scale-105"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search auctions by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getInputBg()}`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}>🔍</span>
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getInputBg()}`}
              >
                <option value="all">All Status</option>
                <option value="active">🟢 Active</option>
                <option value="ended">🟡 Ended</option>
                <option value="finalized">⚪ Finalized</option>
              </select>
            </div>
            
            {/* Sort By */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getInputBg()}`}
              >
                <option value="newest">🕒 Newest First</option>
                <option value="oldest">🕐 Oldest First</option>
                <option value="name">🔤 Name A-Z</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className={`text-sm ${getTextMuted()}`}>
            Showing {paginatedAuctions.length} of {filteredAndSortedAuctions.length} auctions (Page {currentPage} of {totalPages})
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </div>
        </div>
        
        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className={`text-xl font-semibold mb-2 ${getTextSecondary()}`}>No auctions yet</h3>
            <p className={getTextMuted()}>Create your first auction to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedAuctions.map((auction, index) => {
              const status = getAuctionStatus(auction);
              const isSelected = selectedAuction === auction.id;
              
              return (
                <div
                  key={`${auction.contractAddress}-${index}`}
                  className={`group relative border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up ${
                    isSelected 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg' 
                      : 'border-gray-200 hover:border-purple-300 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedAuction(auction.id)}
                >
                  {/* Auction Image */}
                  <div className="relative h-32 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {(() => {
                      // Check for IPFS image
                      if (auction.imageUrl) {
                        return (
                          <img
                            src={auction.imageUrl}
                            alt={auction.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to IPFS gateway if direct URL fails
                              const target = e.target as HTMLImageElement;
                              if (auction.imageHash && !target.src.includes('gateway.pinata.cloud')) {
                                target.src = `https://gateway.pinata.cloud/ipfs/${auction.imageHash}`;
                              }
                            }}
                          />
                        );
                      }
                      return (
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2 opacity-60">🎨</div>
                          <div className="text-xs font-medium">No Image</div>
                          <div className="text-xs opacity-75">No image available</div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 truncate text-base leading-tight group-hover:text-purple-700 transition-colors">{auction.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        status === 'active' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                        status === 'ended' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                        'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                      }`}>
                        {status === 'active' ? '🟢 Active' : status === 'ended' ? '🟡 Ended' : '⚪ Finalized'}
                      </span>
                    </div>
                    
                    {auction.description && (
                      <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${getTextSecondary()}`}>{auction.description}</p>
                    )}
                    
                    <div className={`grid grid-cols-2 gap-2 text-xs mb-3 ${getTextMuted()}`}>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        <span className="text-blue-500">📅</span>
                        <span className="font-medium text-xs">{formatDate(auction.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        <span className="text-orange-500">⏰</span>
                        <span className="font-medium text-xs">{getTimeRemaining(auction.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        <span className="text-green-500">💰</span>
                        <span className="font-medium text-xs">{auction.bidCount} bids</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        <span className="text-purple-500">📋</span>
                        <span className="font-medium text-xs truncate">{auction.contractAddress ? `${auction.contractAddress.slice(0, 6)}...${auction.contractAddress.slice(-4)}` : 'N/A'}</span>
                      </div>
                    </div>
                  
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Set this auction as active and switch to auction view
                          if (auction.contractAddress) {
                            // Trigger a custom event to notify the parent component (on-chain only)
                            window.dispatchEvent(new CustomEvent('auction-selected', {
                              detail: {
                                contractAddress: auction.contractAddress,
                                auctionId: auction.id,
                                auctionName: auction.name,
                                auctionDescription: auction.description,
                                auctionEndTime: auction.endTime,
                                auctionCreatedAt: auction.createdAt,
                                auctionBidCount: auction.bidCount,
                                auctionSeller: auction.seller || auction.creator, // Add seller info
                                autoRefresh: true // Flag to trigger auto-refresh
                              }
                            }));
                          } else {
                            alert('Invalid auction contract address');
                          }
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transform hover:scale-105 animate-glow"
                      >
                        🚀 Open Auction
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transform'
              }`}
            >
              ← Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transform'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
