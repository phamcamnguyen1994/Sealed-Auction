"use client";

import { useState } from 'react';

export default function LocalDevGuide() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">🏠 Solution: Local Development</h3>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          {showGuide ? 'Hide' : 'Show'} Setup Guide
        </button>
      </div>
      
      {showGuide && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Current Issue</h4>
            <p className="text-sm text-red-700">
              FHEVM Relayer (relayer.testnet.zama.cloud) is experiencing 500 Internal Server Error. 
              This is an infrastructure issue on Zama's side, not your code.
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Solution: Local Development</h4>
            <p className="text-sm text-green-700 mb-3">
              Run the project locally with a local FHEVM relayer to bypass the production relayer issues.
            </p>
            
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Step 1: Start Local Hardhat Node</h5>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>cd packages/fhevm-hardhat-template</div>
                  <div>npm run node</div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Step 2: Deploy Contracts Locally</h5>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>npm run deploy:local</div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Step 3: Start Frontend</h5>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>cd packages/site</div>
                  <div>npm run dev</div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Step 4: Connect MetaMask</h5>
                <div className="text-sm text-gray-700">
                  <p>• Network: Localhost 8545</p>
                  <p>• Chain ID: 31337</p>
                  <p>• Import test accounts with private keys from hardhat</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">⏰ Alternative: Wait for Zama Fix</h4>
            <p className="text-sm text-blue-700">
              The production relayer issue is temporary. You can:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Check <a href="https://status.zama.ai" target="_blank" rel="noopener noreferrer" className="underline">Zama Status Page</a></li>
              <li>• Try again in a few hours</li>
              <li>• <strong>Recommended:</strong> Use local development for immediate testing</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📝 Test Accounts (Local)</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Account 1:</strong> 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</p>
              <p><strong>Account 2:</strong> 0x70997970C51812dc3A010C7d01b50e0d17dc79C8</p>
              <p><strong>Private Key:</strong> 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
