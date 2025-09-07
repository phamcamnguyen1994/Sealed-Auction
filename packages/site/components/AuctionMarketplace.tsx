"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";

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
  const REGISTRY_ADDRESS = "0x74b7dF65eeb26E977Ce17567A18088030C3363Df";

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

  // Load auctions from Registry contract
  useEffect(() => {
    if (registryContract) {
      loadAuctionsFromRegistry();
    }
  }, [registryContract]);

  const loadAuctionsFromRegistry = async () => {
    if (!registryContract) return;
    
    try {
      console.log("Loading auctions from Registry...");
      
      // First check if Registry has any auctions
      const totalAuctions = await registryContract.getTotalAuctions();
      console.log("Total auctions in Registry:", Number(totalAuctions));
      
      if (Number(totalAuctions) === 0) {
        console.log("No auctions found in Registry");
        setAuctions([]);
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
      // Set empty array on error
      setAuctions([]);
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
      // Import contract ABI and bytecode from contracts folder
      const contractData = await import('../contracts/SealedAuction.json');
      console.log("Contract data loaded:", {
        hasAbi: !!(contractData.default?.abi || contractData.abi),
        hasBytecode: !!(contractData.default?.bytecode || contractData.bytecode),
        abiLength: (contractData.default?.abi || contractData.abi)?.length,
        bytecodeLength: (contractData.default?.bytecode || contractData.bytecode)?.length,
        format: contractData.default ? 'old' : 'new'
      });
      
      // Validate contract data - check both old and new format
      const abi = contractData.default?.abi || contractData.abi;
      const bytecode = contractData.default?.bytecode || contractData.bytecode;
      
      if (!abi || !bytecode) {
        throw new Error("Invalid contract data: missing ABI or bytecode");
      }
      
      if (!bytecode.startsWith('0x')) {
        throw new Error("Invalid bytecode: must start with 0x");
      }
      
      let contractFactory;
      try {
        contractFactory = new ethers.ContractFactory(
          abi,
          bytecode,
          ethersSigner
        );
        console.log("Contract factory created successfully:", !!contractFactory);
      } catch (factoryError: any) {
        console.error("Failed to create contract factory:", factoryError);
        throw new Error(`Failed to create contract factory: ${factoryError?.message || factoryError}`);
      }

      console.log("Deploying new auction contract with duration:", newAuctionDuration);
      
      // Validate duration
      if (!newAuctionDuration || newAuctionDuration <= 0) {
        throw new Error("Invalid auction duration");
      }
      
      let contract;
      try {
        contract = await contractFactory.deploy(newAuctionDuration);
        console.log("Contract deployment transaction sent:", contract.deploymentTransaction()?.hash);
      } catch (deployError: any) {
        console.error("Failed to deploy contract:", deployError);
        throw new Error(`Failed to deploy contract: ${deployError?.message || deployError}`);
      }
      
      await contract.waitForDeployment();
      console.log("Contract deployment confirmed");
      
      const contractAddress = await contract.getAddress();
      console.log("New auction deployed at:", contractAddress);

      // Register auction in Registry contract
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
          
          // Reload auctions from Registry
          await loadAuctionsFromRegistry();
          
        } catch (error) {
          console.error("Failed to register auction in Registry:", error);
          alert("Auction created but failed to register in marketplace. Please try again.");
        }
      }

      // Save auction data including image to localStorage
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

      // Reset form
      setNewAuctionName("");
      setNewAuctionDescription("");
      setNewAuctionDuration(300);
      setNewAuctionImage(null);
      
      alert(`New auction "${newAuctionName}" created successfully!\nContract Address: ${contractAddress}`);
      
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
    <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔐 Auction Marketplace</h1>
          <p className="text-gray-600 mb-8">Connect your wallet to start creating and participating in sealed auctions</p>
          <button
            onClick={connect}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Connect to MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🔐 Auction Marketplace</h1>
        <p className="text-xl text-gray-600">Create and participate in confidential sealed auctions</p>
      </div>

      {/* Create New Auction Section - Collapsible */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Auction</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
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
              className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">All Auctions</h2>
          <button
            onClick={loadAuctionsFromRegistry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">🟢 Active</option>
                <option value="ended">🟡 Ended</option>
                <option value="finalized">⚪ Finalized</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-gray-500">
            Showing {filteredAuctions.length} of {auctions.length} auctions
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </div>
        </div>
        
        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No auctions yet</h3>
            <p className="text-gray-500">Create your first auction to get started!</p>
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
                        <div className="text-center text-gray-400">
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
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
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
                            
                            // Switch back to auction view
                            if (onClose) {
                              onClose();
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
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
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
