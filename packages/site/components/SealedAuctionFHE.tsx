"use client";

import { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSealedAuctionFHE } from "@/hooks/useSealedAuctionFHE";
import { errorNotDeployed } from "./ErrorNotDeployed";

/*
 * Main SealedAuction React component with FHE operations
 *  - "Refresh" button: allows you to get the current auction state.
 *  - "Place Bid" button: allows you to place a sealed bid using FHE operations.
 *  - "Finalize" button: allows you to finalize the auction.
 */
export const SealedAuctionFHE = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const [bidAmount, setBidAmount] = useState<number>(70);
  const [auctionItem, setAuctionItem] = useState<{
    name: string;
    description: string;
    image: string | null;
    category: string;
    seller: string;
  }>({
    name: "Ancient Dragon Scroll",
    description: "A mysterious scroll containing ancient dragon magic. Believed to be over 1000 years old.",
    image: null,
    category: "Antique Artifact",
    seller: "0x8d30010878d95C7EeF78e543Ee2133db846633b8" // Default seller address
  });
  const {
    provider,
    chainId,
    accounts,
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
    status: fhevmStatus,
    error: fhevmError,
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

  // Preset auction items
  const presetItems = [
    {
      name: "Ancient Dragon Scroll",
      description: "A mysterious scroll containing ancient dragon magic. Believed to be over 1000 years old.",
      category: "Antique Artifact",
      emoji: "🏺"
    },
    {
      name: "Rare Charizard Card",
      description: "First edition holographic Charizard Pokémon card. Mint condition, extremely rare.",
      category: "Trading Card",
      emoji: "🔥"
    },
    {
      name: "Mystical Crystal Orb",
      description: "A glowing crystal orb said to hold the power of the ancients. Radiates mysterious energy.",
      category: "Mystical Item",
      emoji: "🔮"
    },
    {
      name: "Golden Pharaoh Mask",
      description: "Ancient Egyptian pharaoh's ceremonial mask. Made of pure gold with intricate hieroglyphs.",
      category: "Historical Artifact",
      emoji: "👑"
    }
  ];

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAuctionItem(prev => ({
          ...prev,
          image: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Get seller address from contract (if available)
  const [contractSeller, setContractSeller] = useState<string | null>(null);
  
  // Check if current user is the seller
  const isSeller = useMemo(() => {
    const sellerAddress = contractSeller || auctionItem.seller;
    return ethersSigner?.address?.toLowerCase() === sellerAddress.toLowerCase();
  }, [ethersSigner?.address, contractSeller, auctionItem.seller]);

  // Try to get seller from contract
  useEffect(() => {
    if (sealedAuction.contractAddress && ethersReadonlyProvider) {
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

  // Handle preset item selection
  const handlePresetItem = (item: typeof presetItems[0]) => {
    setAuctionItem({
      name: item.name,
      description: item.description,
      category: item.category,
      image: null,
      seller: auctionItem.seller
    });
  };

  const titleClass = "font-semibold text-black text-lg mt-4";

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

  return (
    <div className="grid w-full gap-4">
      <div className="col-span-full mx-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🔐 Sealed Auction</h1>
              <p className="text-xl text-blue-100">Confidential Bidding with FHEVM</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200 mb-1">Powered by</div>
              <div className="text-lg font-semibold">Zama FHEVM</div>
            </div>
          </div>
        </div>
      </div>
      {/* Simplified Info Section */}
      <div className="col-span-full mx-20 mt-4 px-5 pb-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-700">🌐 Network</h3>
            <p className="text-sm text-gray-600">Sepolia Testnet</p>
            <p className="text-xs text-gray-500 font-mono">{chainId}</p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-700">👤 Account</h3>
            <p className="text-sm text-gray-600 truncate">
              {ethersSigner ? `${ethersSigner.address.slice(0, 6)}...${ethersSigner.address.slice(-4)}` : "Not connected"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-700">🔗 Contract</h3>
            <p className="text-sm text-gray-600 truncate">
              {sealedAuction.contractAddress ? `${sealedAuction.contractAddress.slice(0, 6)}...${sealedAuction.contractAddress.slice(-4)}` : "Not deployed"}
            </p>
            <p className="text-xs text-green-600 font-semibold">✅ Deployed</p>
          </div>
        </div>
      </div>

      {/* Auction Item Display */}
      <div className="col-span-full mx-20 px-6 py-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🏺 Auction Item</h2>
          <p className="text-gray-600">What's being auctioned today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Image */}
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
                    <div className="text-6xl mb-4">
                      {presetItems.find(item => item.name === auctionItem.name)?.emoji || "🏺"}
                    </div>
                    <p className="text-gray-500 font-semibold">No Image</p>
                    <p className="text-sm text-gray-400">Upload an image</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upload Controls - Only for Seller */}
            {isSeller ? (
              <div className="mt-4 space-y-2">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-center font-semibold">
                    📷 Upload Image
                  </div>
                </label>
                
                {/* Preset Items */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Or choose a preset:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {presetItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handlePresetItem(item)}
                        className="p-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors text-xs"
                      >
                        <div className="text-lg mb-1">{item.emoji}</div>
                        <div className="font-semibold text-gray-700 truncate">{item.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="text-2xl mb-2">🔒</div>
                  <p className="text-sm text-gray-600">
                    Only the seller can manage this item
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Seller: {auctionItem.seller.slice(0, 6)}...{auctionItem.seller.slice(-4)}
                  </p>
                </div>
      </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{auctionItem.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-semibold">
                  {auctionItem.category}
                </span>
                {isSeller && (
                  <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    👑 You are the seller
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Seller:</span> {auctionItem.seller.slice(0, 6)}...{auctionItem.seller.slice(-4)}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">{auctionItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-semibold text-gray-800">1 Hour</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-semibold text-gray-800">Sealed Bid</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Auction Card */}
      <div className="col-span-full mx-20 px-6 py-6 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">🏆 Sealed Auction</h2>
          <p className="text-gray-600">Place encrypted bids in this confidential auction</p>
        </div>

        {/* Auction Status Card */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          {sealedAuction.state ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {sealedAuction.state.isBidding ? '🟢' : sealedAuction.state.isEnded ? '🔴' : '🟡'}
                </div>
                <h3 className="font-semibold text-lg text-gray-700">Status</h3>
                <p className={`text-lg font-bold ${
                  sealedAuction.state.isBidding ? 'text-green-600' : 
                  sealedAuction.state.isEnded ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {sealedAuction.state.isBidding ? 'Active' : 
                   sealedAuction.state.isEnded ? 'Ended' : 'Unknown'}
                </p>
              </div>

              {/* Time Left */}
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold text-lg text-gray-700">Time Left</h3>
                <p className={`text-lg font-bold ${
                  sealedAuction.state.isBidding ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sealedAuction.state.isBidding ? 
                    `${Math.max(0, Math.floor((Number(sealedAuction.state._endTime) - Date.now()/1000) / 60))} min` : 
                    "Ended"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ends: {new Date(Number(sealedAuction.state._endTime) * 1000).toLocaleTimeString()}
                </p>
              </div>

              {/* Total Bids */}
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-lg text-gray-700">Total Bids</h3>
                <p className="text-2xl font-bold text-blue-600">{sealedAuction.state._bids}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Auction Data</h3>
              <p className="text-gray-600">Click "Refresh State" to load current information</p>
            </div>
          )}
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
      </div>
      {/* Action Buttons */}
      <div className="col-span-full mx-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Refresh State Button */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Refresh State</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get the latest auction information from blockchain
              </p>
        <button
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  sealedAuction.canRefresh
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!sealedAuction.canRefresh}
                onClick={sealedAuction.refreshState}
              >
                {sealedAuction.canRefresh ? "Refresh State" : "Not Available"}
        </button>
              
              {/* Get Results Directly Button - Only show when auction ended */}
              {sealedAuction.state?.isEnded && (
                <div className="mt-4">
        <button
                    onClick={sealedAuction.getResultsDirectly}
                    className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
                    🔍 Get Results Directly
        </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Bypass permission check to get results
                  </p>
                </div>
              )}
            </div>
      </div>

          {/* Place Bid Button */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Place Bid</h3>
              <p className="text-sm text-gray-600 mb-4">
                Place a sealed bid (only during active auction)
              </p>
              <div className="space-y-3">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  placeholder="70"
                />
        <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    sealedAuction.canPlaceBid
                      ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                      : sealedAuction.isPlacingBid
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!sealedAuction.canPlaceBid}
                  onClick={() => sealedAuction.placeBid(bidAmount)}
                >
                  {sealedAuction.canPlaceBid
                    ? "💸 Place Bid"
                    : sealedAuction.isPlacingBid
                      ? "⏳ Placing..."
                      : "❌ Cannot bid"}
        </button>
              </div>
            </div>
          </div>

          {/* Finalize Button */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-3">🏁</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Finalize Auction</h3>
              <p className="text-sm text-gray-600 mb-4">
                End the auction and reveal results (after time expires)
              </p>
        <button
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  sealedAuction.canFinalize
                    ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                    : sealedAuction.isFinalizing
                      ? 'bg-yellow-500 text-white'
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
          </div>
        </div>
        </div>
        
        {/* Grant View Permission Section - Only show if auction is finalized but no results */}
        {sealedAuction.state?.isEnded && !sealedAuction.highestBidHandle && !sealedAuction.winnerHandle && (
          <div className="mt-6">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">View Permission Required</h3>
                <p className="text-sm text-gray-600 mb-4">
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
          <div className="bg-gray-900 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💬</div>
              <div>
                <h4 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Status Message</h4>
                <p className="text-white font-mono text-sm break-all">{sealedAuction.message}</p>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
    );
  };
