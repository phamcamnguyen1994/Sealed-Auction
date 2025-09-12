"use client";

import { useTheme } from "../contexts/ThemeContext";
import Image from "next/image";

export const Header = () => {
  const { theme } = useTheme();

  // Theme-aware styling functions
  const getHeaderBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gradient-to-r from-green-900 to-emerald-800';
      case 'orange': return 'bg-gradient-to-r from-orange-600 to-orange-500';
      default: return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
  };

  const getTextColor = () => {
    switch (theme) {
      case 'dark': return 'text-green-100';
      case 'orange': return 'text-white';
      default: return 'text-white';
    }
  };

  const getSubtextColor = () => {
    switch (theme) {
      case 'dark': return 'text-green-200';
      case 'orange': return 'text-orange-100';
      default: return 'text-blue-100';
    }
  };

  return (
    <nav className={`w-full px-3 md:px-0 h-fit py-6 ${getHeaderBg()} transition-all duration-300 shadow-lg`}>
      <div className="flex w-full justify-between items-center">
        {/* Logo + Title Section */}
        <div className="flex items-center space-x-6">
          {/* Zama Logo */}
          <div className="animate-fade-in-up">
            <Image
              src="/zama-logo.svg"
              alt="Zama Logo"
              width={200}
              height={150}
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* Title */}
          <div className="animate-fade-in-up delay-200">
            <h1 className={`text-3xl font-bold ${getTextColor()} leading-tight`}>
              Sealed Auction Marketplace
            </h1>
            <p className={`text-sm ${getSubtextColor()} mt-1 font-medium`}>
              Confidential Bidding Platform
            </p>
          </div>
        </div>

        {/* Right side - Theme indicator */}

      </div>
    </nav>
  );
};
