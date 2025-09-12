import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting Registry and Factory deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  console.log("🌐 Network chainId:", chainId);

  // Deploy AuctionRegistry first
  console.log("📦 Deploying AuctionRegistry...");
  const AuctionRegistry = await ethers.getContractFactory("AuctionRegistry");
  const registry = await AuctionRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ AuctionRegistry deployed to:", registryAddress);

  // Deploy AuctionFactory with Registry address
  console.log("📦 Deploying AuctionFactory...");
  const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
  const factory = await AuctionFactory.deploy(registryAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ AuctionFactory deployed to:", factoryAddress);

  // Save deployment info
  const outDir = path.join(process.cwd(), "deployments");
  const registryFile = path.join(outDir, `registry-${chainId}.json`);
  const factoryFile = path.join(outDir, `factory-${chainId}.json`);
  
  const registryData = { 
    address: registryAddress, 
    chainId, 
    deployedBy: deployer.address, 
    timestamp: Math.floor(Date.now()/1000) 
  };

  const factoryData = { 
    address: factoryAddress, 
    chainId, 
    deployedBy: deployer.address, 
    registryAddress: registryAddress,
    timestamp: Math.floor(Date.now()/1000) 
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(registryFile, JSON.stringify(registryData, null, 2));
  fs.writeFileSync(factoryFile, JSON.stringify(factoryData, null, 2));

  console.log("📁 Saved Registry deployment to:", registryFile);
  console.log("📁 Saved Factory deployment to:", factoryFile);

  // Generate and copy ABI for Registry
  console.log("📋 Generating Registry ABI...");
  const { artifacts } = await import("hardhat");
  const registryArtifact = await artifacts.readArtifact("AuctionRegistry");
  
  const registryPayload = { 
    name: "AuctionRegistry", 
    address: registryAddress, 
    chainId, 
    abi: registryArtifact.abi, 
    bytecode: registryArtifact.bytecode,
    deployedBytecode: registryArtifact.deployedBytecode,
    deployTimestamp: registryData.timestamp 
  };
  
  // Save to abi/ directory
  const abiDir = path.join(process.cwd(), "abi");
  const registryAbiFile = path.join(abiDir, "AuctionRegistry.json");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(registryAbiFile, JSON.stringify(registryPayload, null, 2));

  // Auto-copy to frontend
  const frontendRegistryFile = path.join(process.cwd(), "packages", "site", "contracts", "AuctionRegistry.json");
  const frontendDir = path.dirname(frontendRegistryFile);
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendRegistryFile, JSON.stringify(registryPayload, null, 2));

  // Generate and copy ABI for Factory
  console.log("📋 Generating Factory ABI...");
  const factoryArtifact = await artifacts.readArtifact("AuctionFactory");
  
  const factoryPayload = { 
    name: "AuctionFactory", 
    address: factoryAddress, 
    chainId, 
    abi: factoryArtifact.abi, 
    bytecode: factoryArtifact.bytecode,
    deployedBytecode: factoryArtifact.deployedBytecode,
    registryAddress: registryAddress,
    deployTimestamp: factoryData.timestamp 
  };
  
  const factoryAbiFile = path.join(abiDir, "AuctionFactory.json");
  fs.writeFileSync(factoryAbiFile, JSON.stringify(factoryPayload, null, 2));

  // Auto-copy to frontend
  const frontendFactoryFile = path.join(process.cwd(), "packages", "site", "contracts", "AuctionFactory.json");
  fs.writeFileSync(frontendFactoryFile, JSON.stringify(factoryPayload, null, 2));

  console.log("✅ Registry ABI exported to:", registryAbiFile);
  console.log("✅ Registry ABI copied to frontend:", frontendRegistryFile);
  console.log("✅ Factory ABI exported to:", factoryAbiFile);
  console.log("✅ Factory ABI copied to frontend:", frontendFactoryFile);
  
  console.log("🎉 Registry and Factory deployment complete!");
  console.log(`📍 Registry Address: ${registryAddress}`);
  console.log(`📍 Factory Address: ${factoryAddress}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`⏰ Deploy Time: ${new Date().toLocaleString()}`);
}

main().catch((e) => { 
  console.error("❌ Error:", e); 
  process.exit(1); 
});

