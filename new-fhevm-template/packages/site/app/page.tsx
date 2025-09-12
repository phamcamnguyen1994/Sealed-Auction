"use client";

import { AuctionMarketplace } from "@/components/AuctionMarketplace";
import { SealedAuctionFHE } from "@/components/SealedAuctionFHE";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { useState } from "react";

export default function Home() {
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [auctionImage, setAuctionImage] = useState<string | undefined>(undefined);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleAuctionSelected = (auctionAddress: string, auctionImage?: string) => {
    setSelectedAuction(auctionAddress);
    setAuctionImage(auctionImage);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header onShowHowItWorks={() => setShowHowItWorks(true)} />
      
      <div className="container mx-auto px-4 py-8">
        {!selectedAuction ? (
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              🏆 Sealed Auction Marketplace
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of confidential bidding with Fully Homomorphic Encryption. 
              Place bids without revealing your amount until the auction ends.
            </p>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              How It Works
            </button>
          </div>
        ) : null}

        {selectedAuction ? (
          <SealedAuctionFHE 
            auctionAddress={selectedAuction}
            auctionImage={auctionImage}
            onBack={() => setSelectedAuction(null)}
            onShowHowItWorks={() => setShowHowItWorks(true)}
          />
        ) : (
          <AuctionMarketplace onAuctionSelected={handleAuctionSelected} />
        )}
      </div>

      <HowItWorks 
        isVisible={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />
    </main>
  );
}
