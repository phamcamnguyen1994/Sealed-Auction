import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying AuctionRegistry with fixed address...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AuctionRegistry
  const AuctionRegistry = await ethers.getContractFactory("AuctionRegistry");
  const registry = await AuctionRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ AuctionRegistry deployed to:", registryAddress);

  // Verify the address matches expected
  const expectedAddress = "0xeE00ba349b4CAe6eC1a0e48e0aF6c6Bc72Ff8b65";
  if (registryAddress.toLowerCase() === expectedAddress.toLowerCase()) {
    console.log("🎉 Address matches expected:", expectedAddress);
  } else {
    console.log("⚠️ Address mismatch!");
    console.log("Expected:", expectedAddress);
    console.log("Actual:", registryAddress);
    console.log("You may need to use a different deployer account or deploy with CREATE2");
  }

  // Save deployment info
  const fs = require('fs');
  const path = require('path');
  
  const outDir = path.join(process.cwd(), "deployments");
  const outFile = path.join(outDir, "11155111.json");
  const data = { 
    address: registryAddress, 
    chainId: 11155111, 
    deployedBy: deployer.address, 
    timestamp: Math.floor(Date.now()/1000) 
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log("📁 Saved deployment info to:", outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

