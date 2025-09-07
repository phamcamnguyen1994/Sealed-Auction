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
      const contractFactory = new ethers.ContractFactory(
        contractData.default.abi,
        contractData.default.bytecode,
        ethersSigner
      );

      console.log("Deploying new auction contract...");
      
      const contract = await contractFactory.deploy(newAuctionDuration);
      await contract.waitForDeployment();
      
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
      <div className="max-w-4xl mx-auto p-6">
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🔐 Auction Marketplace</h1>
        <p className="text-xl text-gray-600">Create and participate in confidential sealed auctions</p>
      </div>

      {/* Create New Auction Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Auction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
            <select
              value={newAuctionDuration}
              onChange={(e) => setNewAuctionDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={60}>1 minute (testing)</option>
              <option value={300}>5 minutes (testing)</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={86400}>24 hours</option>
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
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => setNewAuctionImage(null)}
                  className="text-red-500 hover:text-red-700 text-sm"
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
        
        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No auctions yet</h3>
            <p className="text-gray-500">Create your first auction to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => {
              const status = getAuctionStatus(auction);
              const isSelected = selectedAuction === auction.id;
              
              return (
                <div
                  key={auction.id}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAuction(auction.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{auction.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'active' ? 'bg-green-100 text-green-800' :
                      status === 'ended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                  
                  {auction.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>
                  )}
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>Contract: {auction.contractAddress ? `${auction.contractAddress.slice(0, 6)}...${auction.contractAddress.slice(-4)}` : 'N/A'}</div>
                    <div>Created: {formatDate(auction.createdAt)}</div>
                    <div>Time left: {getTimeRemaining(auction.endTime)}</div>
                    <div>Bids: {auction.bidCount}</div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
