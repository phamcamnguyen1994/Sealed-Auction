import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting AuctionFactory deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get Registry address from existing deployment
  const registryAddress = "0xeE00ba349b4CAe6eC1a0e48e0aF6c6Bc72Ff8b65"; // Sepolia Registry address
  console.log("Using Registry address:", registryAddress);
  
  // Deploy AuctionFactory
  console.log("📦 Deploying AuctionFactory contract...");
  const Factory = await ethers.getContractFactory("AuctionFactory");
  const factory = await Factory.connect(deployer).deploy(registryAddress);
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  // Save deployment info
  const outDir = path.join(process.cwd(), "deployments");
  const outFile = path.join(outDir, `factory-${chainId}.json`);
  const data = { 
    address, 
    chainId, 
    registryAddress,
    deployedBy: deployer.address, 
    timestamp: Math.floor(Date.now()/1000) 
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));

  console.log("✅ AuctionFactory deployed:", data);
  console.log("📁 Saved to:", outFile);

  // Generate and copy ABI
  console.log("📋 Generating ABI...");
  const { artifacts } = await import("hardhat");
  const artifact = await artifacts.readArtifact("AuctionFactory");
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;
  const deployedBytecode = artifact.deployedBytecode;

  const payload = { 
    name: "AuctionFactory", 
    address, 
    chainId, 
    registryAddress,
    abi, 
    bytecode,
    deployedBytecode,
    deployTimestamp: data.timestamp 
  };
  
  // Save to abi/ directory
  const abiDir = path.join(process.cwd(), "abi");
  const abiFile = path.join(abiDir, "AuctionFactory.json");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(abiFile, JSON.stringify(payload, null, 2));

  // Auto-copy to frontend
  const frontendFile = path.join(process.cwd(), "packages", "site", "contracts", "AuctionFactory.json");
  const frontendDir = path.dirname(frontendFile);
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendFile, JSON.stringify(payload, null, 2));

  console.log("✅ ABI exported to:", abiFile);
  console.log("✅ ABI copied to frontend:", frontendFile);
  console.log("🎉 AuctionFactory deployment complete!");
  console.log(`📍 Factory Address: ${address}`);
  console.log(`📍 Registry Address: ${registryAddress}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`⏰ Deploy Time: ${new Date().toLocaleString()}`);
}

main().catch((e) => { 
  console.error("❌ Error:", e); 
  process.exit(1); 
});
