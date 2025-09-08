"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useTheme } from "../contexts/ThemeContext";

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
  const [registryContract, setRegistryContract] = useState<ethers.Contract | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended' | 'finalized'>('all');

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewAuctionImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
          console.log("Registry contract loaded:", REGISTRY_ADDRESS);
        } catch (error) {
          console.error("Failed to load Registry contract:", error);
        }
      };
      loadRegistryContract();
    }
  }, [ethersReadonlyProvider]);

  // Load auctions from Registry contract (primary) and localStorage (fallback)
  useEffect(() => {
    if (registryContract) {
      loadAuctionsFromRegistry();
    } else {
      // Fallback to localStorage if Registry contract is not available
      const savedAuctions = localStorage.getItem('sealed-auctions');
      if (savedAuctions) {
        try {
          const parsedAuctions = JSON.parse(savedAuctions);
          setAuctions(parsedAuctions);
          console.log("Loaded auctions from localStorage (fallback):", parsedAuctions.length);
        } catch (error) {
          console.error("Failed to parse saved auctions:", error);
          setAuctions([]);
        }
      } else {
        setAuctions([]);
      }
    }
  }, [registryContract]);

  const loadAuctionsFromRegistry = async () => {
    if (!registryContract) {
      console.log("Registry contract not loaded, falling back to localStorage");
      // Fallback to localStorage if Registry contract is not available
      const savedAuctions = localStorage.getItem('sealed-auctions');
      if (savedAuctions) {
        try {
          const parsedAuctions = JSON.parse(savedAuctions);
          setAuctions(parsedAuctions);
          console.log("Loaded auctions from localStorage:", parsedAuctions.length);
        } catch (error) {
          console.error("Failed to parse saved auctions:", error);
          setAuctions([]);
        }
      } else {
        setAuctions([]);
      }
      return;
    }
    
    try {
      console.log("Loading auctions from Registry...");
      
      // First check if Registry has any auctions
      const totalAuctions = await registryContract.getTotalAuctions();
      console.log("Total auctions in Registry:", Number(totalAuctions));
      
      if (Number(totalAuctions) === 0) {
        console.log("No auctions found in Registry, falling back to localStorage");
        // Fallback to localStorage if Registry is empty
        const savedAuctions = localStorage.getItem('sealed-auctions');
        if (savedAuctions) {
          try {
            const parsedAuctions = JSON.parse(savedAuctions);
            setAuctions(parsedAuctions);
            console.log("Loaded auctions from localStorage:", parsedAuctions.length);
          } catch (error) {
            console.error("Failed to parse saved auctions:", error);
            setAuctions([]);
          }
        } else {
          setAuctions([]);
        }
        return;
      }
      
      // Get all auctions
      const allAuctions = await registryContract.getAllAuctions();
      console.log("Raw auctions data:", allAuctions);
      
      if (!allAuctions || allAuctions.length === 0) {
        console.log("No auctions returned from getAllAuctions");
        setAuctions([]);
        return;
      }
      
      const formattedAuctions: AuctionInfo[] = allAuctions.map((auction: any, index: number) => {
        console.log(`Auction ${index}:`, auction);
        
        // Handle different data structures
        const contractAddress = auction.contractAddress || auction[0];
        const name = auction.name || auction[2] || `Auction ${index + 1}`;
        const description = auction.description || auction[3] || '';
        const createdAt = Number(auction.createdAt || auction[4]) * 1000;
        const endTime = Number(auction.endTime || auction[5]) * 1000;
        const isActive = auction.isActive !== undefined ? auction.isActive : auction[6];
        const bidCount = Number(auction.bidCount || auction[7] || 0);
        
        return {
          id: contractAddress || `auction-${index}`,
          contractAddress: contractAddress || '',
          name: name,
          description: description,
          createdAt: createdAt,
          endTime: endTime,
          status: isActive && endTime > Date.now() ? 'active' : 'ended',
          bidCount: bidCount
        };
      });
      
      setAuctions(formattedAuctions);
      console.log("Loaded auctions:", formattedAuctions.length);
    } catch (error) {
      console.error("Failed to load auctions from Registry:", error);
      console.log("Falling back to localStorage due to Registry error");
      // Fallback to localStorage on error
      const savedAuctions = localStorage.getItem('sealed-auctions');
      if (savedAuctions) {
        try {
          const parsedAuctions = JSON.parse(savedAuctions);
          setAuctions(parsedAuctions);
          console.log("Loaded auctions from localStorage after Registry error:", parsedAuctions.length);
        } catch (parseError) {
          console.error("Failed to parse saved auctions:", parseError);
          setAuctions([]);
        }
      } else {
        setAuctions([]);
      }
    }
  };

  // Save auctions to localStorage whenever auctions change
  useEffect(() => {
    localStorage.setItem('sealed-auctions', JSON.stringify(auctions));
  }, [auctions]);

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
      // Import contract ABI and bytecode from contracts folder (now has bytecode)
      const contractData = await import('../contracts/SealedAuction.json');
      const abi = contractData.abi;
      const bytecode = contractData.bytecode;
      
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

      // Deploy real SealedAuction contract
      console.log("Deploying SealedAuction contract with duration:", newAuctionDuration);
      
      const contractFactory = new ethers.ContractFactory(
        abi,
        bytecode,
        ethersSigner
      );

      console.log("Deploying contract...");
      const contract = await contractFactory.deploy(newAuctionDuration);
      
      console.log("Contract deployment transaction:", contract.deploymentTransaction()?.hash);
      
      await contract.waitForDeployment();
      console.log("Contract deployment confirmed");
      
      const contractAddress = await contract.getAddress();
      console.log("New auction deployed at:", contractAddress);

      // Register auction in Registry contract for cross-user sharing
      if (registryContract && ethersSigner) {
        try {
          console.log("Registering auction in Registry...");
          const registryWithSigner = registryContract.connect(ethersSigner) as any;
          const endTime = Math.floor((Date.now() + (newAuctionDuration * 1000)) / 1000); // Convert to seconds
          
          const tx = await registryWithSigner.registerAuction(
            contractAddress,
            newAuctionName,
            newAuctionDescription,
            endTime
          );
          
          await tx.wait();
          console.log("Auction registered in Registry:", tx.hash);
          
          // Reload auctions from Registry to show the new auction
          await loadAuctionsFromRegistry();
          
        } catch (error: any) {
          console.error("Failed to register auction in Registry:", error);
          console.error("Error details:", {
            message: error?.message,
            code: error?.code,
            reason: error?.reason,
            data: error?.data
          });
          
          // Show more detailed error message
          const errorMsg = error?.message || error?.reason || "Unknown error";
          alert(`Auction created but failed to register in marketplace.\n\nError: ${errorMsg}\n\nPlease check console for details and try again.`);
        }
      }

      // Save auction data including image to localStorage (always save, even if Registry failed)
      const auctionData = {
        contractAddress,
        name: newAuctionName,
        description: newAuctionDescription,
        image: newAuctionImage,
        createdAt: Date.now(),
        endTime: Date.now() + (newAuctionDuration * 1000)
      };
      
      // Save to localStorage for auction view to access
      localStorage.setItem(`auction-${contractAddress}`, JSON.stringify(auctionData));
      localStorage.setItem('active-contract-address', contractAddress);

      // Add to local auctions list for immediate display
      const newAuction: AuctionInfo = {
        id: contractAddress,
        contractAddress: contractAddress,
        name: newAuctionName,
        description: newAuctionDescription,
        createdAt: Date.now(),
        endTime: Date.now() + (newAuctionDuration * 1000),
        status: 'active',
        bidCount: 0
      };
      
      setAuctions(prev => [newAuction, ...prev]);

      // Reset form
      setNewAuctionName("");
      setNewAuctionDescription("");
      setNewAuctionDuration(300);
      setNewAuctionImage(null);
      
      alert(`New auction "${newAuctionName}" created and deployed successfully!\n\nContract Address: ${contractAddress}\n\nAuction is now live on the blockchain and visible to all users.`);
      
    } catch (error: any) {
      console.error("Failed to create auction:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        data: error?.data
      });
      alert(`Failed to create auction: ${error?.message || error}. Please check console for details.`);
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

  // Filter auctions based on search and status
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getAuctionStatus(auction) === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className={`w-full mx-8 p-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-950' : 
      theme === 'orange' ? 'bg-gradient-to-br from-orange-100 to-amber-50' : 
      'bg-gray-50'
    }`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <h1 className={`text-4xl font-bold mb-2 ${getTextPrimary()}`}>🔐 Auction Marketplace</h1>
          <button
            onClick={toggleTheme}
            className={`${
              theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm text-gray-100 border border-gray-600' : 
              theme === 'orange' ? 'bg-orange-600/20 backdrop-blur-sm text-white border border-orange-300/30' :
              'bg-gray-800 text-white border border-gray-600'
            } px-4 py-2 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 shadow-lg`}
            title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} - Click to cycle themes`}
          >
            <span>{
              theme === 'dark' ? '🌙' : 
              theme === 'orange' ? '🧡' : 
              '☀️'
            }</span>
            <span className="hidden md:inline">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
          </button>
        </div>
        <p className={`text-xl ${getTextSecondary()}`}>Create and participate in confidential sealed auctions</p>
      </div>

      {/* Create New Auction Section - Collapsible */}
      <div className={`${getCardBg()} rounded-xl shadow-lg border ${getCardBorder()} mb-8`}>
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${getTextPrimary()}`}>Create New Auction</h2>
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
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="auction-image-upload"
                />
                <label
                  htmlFor="auction-image-upload"
                  className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors"
                >
                  📷 Upload Image
                </label>
                {newAuctionImage && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={newAuctionImage}
                      alt="Auction preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                    />
                    <button
                      onClick={() => setNewAuctionImage(null)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={createNewAuction}
              disabled={isCreatingAuction || !newAuctionName.trim()}
              className={`mt-4 ${
                theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 hover:from-gray-600 hover:to-gray-700' :
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
      <div className={`${getCardBg()} rounded-xl shadow-lg border ${getCardBorder()} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${getTextPrimary()}`}>All Auctions</h2>
          <button
            onClick={() => {
              // Load from Registry contract (primary) or localStorage (fallback)
              if (registryContract) {
                loadAuctionsFromRegistry();
              } else {
                // Fallback to localStorage if Registry contract is not available
                const savedAuctions = localStorage.getItem('sealed-auctions');
                if (savedAuctions) {
                  try {
                    const parsedAuctions = JSON.parse(savedAuctions);
                    setAuctions(parsedAuctions);
                    console.log("Refreshed auctions from localStorage (fallback):", parsedAuctions.length);
                  } catch (error) {
                    console.error("Failed to parse saved auctions:", error);
                    setAuctions([]);
                  }
                } else {
                  setAuctions([]);
                }
              }
            }}
            className={`${
              theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' :
              theme === 'orange' ? 'bg-orange-500 text-white hover:bg-orange-600' :
              'bg-blue-600 text-white hover:bg-blue-700'
            } px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2`}
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
          </div>
          
          {/* Results Count */}
          <div className={`text-sm ${getTextMuted()}`}>
            Showing {filteredAuctions.length} of {auctions.length} auctions
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
            {filteredAuctions.map((auction) => {
              const status = getAuctionStatus(auction);
              const isSelected = selectedAuction === auction.id;
              
              return (
                <div
                  key={auction.id}
                  className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAuction(auction.id)}
                >
                  {/* Auction Image */}
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    {(() => {
                      // Try to get image from localStorage
                      const localAuctionData = localStorage.getItem(`auction-${auction.contractAddress}`);
                      if (localAuctionData) {
                        try {
                          const data = JSON.parse(localAuctionData);
                          if (data.image) {
                            return (
                              <img
                                src={data.image}
                                alt={auction.name}
                                className="w-full h-full object-cover"
                              />
                            );
                          }
                        } catch (e) {
                          console.log('Error parsing local auction data:', e);
                        }
                      }
                      return (
                        <div className={`text-center ${getTextMuted()}`}>
                          <div className="text-4xl mb-2">🖼️</div>
                          <div className="text-sm">No Image</div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate text-lg">{auction.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                        status === 'ended' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {status === 'active' ? '🟢 Active' : status === 'ended' ? '🟡 Ended' : '⚪ Finalized'}
                      </span>
                    </div>
                    
                    {auction.description && (
                      <p className={`text-sm mb-3 line-clamp-2 ${getTextSecondary()}`}>{auction.description}</p>
                    )}
                    
                    <div className={`grid grid-cols-2 gap-2 text-xs mb-3 ${getTextMuted()}`}>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{formatDate(auction.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>⏰</span>
                        <span>{getTimeRemaining(auction.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>💰</span>
                        <span>{auction.bidCount} bids</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📋</span>
                        <span className="truncate">{auction.contractAddress ? `${auction.contractAddress.slice(0, 6)}...${auction.contractAddress.slice(-4)}` : 'N/A'}</span>
                      </div>
                    </div>
                  
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Set this auction as active and switch to auction view
                          if (auction.contractAddress) {
                            localStorage.setItem('active-auction', auction.id);
                            localStorage.setItem('active-contract-address', auction.contractAddress);
                            
                            // Try to load auction data from localStorage
                            const localAuctionData = localStorage.getItem(`auction-${auction.contractAddress}`);
                            if (localAuctionData) {
                              const auctionData = JSON.parse(localAuctionData);
                              // Update auction item in parent component
                              window.dispatchEvent(new CustomEvent('auction-data-loaded', {
                                detail: auctionData
                              }));
                            }
                            
                            // Trigger a custom event to notify the parent component
                            window.dispatchEvent(new CustomEvent('auction-selected', {
                              detail: {
                                contractAddress: auction.contractAddress,
                                auctionId: auction.id
                              }
                            }));
                          } else {
                            alert('Invalid auction contract address');
                          }
                        }}
                        className={`w-full ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' :
                          theme === 'orange' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                          'bg-purple-600 text-white hover:bg-purple-700'
                        } py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Open Auction
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
