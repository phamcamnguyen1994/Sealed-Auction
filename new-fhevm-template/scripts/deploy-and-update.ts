import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment and ABI update...");
  
  // Deploy contract
  console.log("📦 Deploying SealedAuction contract...");
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("SealedAuction");
  const auction = await Factory.connect(deployer).deploy(3600, deployer.address, ""); // 1h bidding, deployer as seller, no image
  await auction.waitForDeployment();

  const address = await auction.getAddress();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  // Save deployment info
  const outDir = path.join(process.cwd(), "deployments");
  const outFile = path.join(outDir, `${chainId}.json`);
  const data = { 
    address, 
    chainId, 
    deployedBy: deployer.address, 
    timestamp: Math.floor(Date.now()/1000) 
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));

  console.log("✅ Contract deployed:", data);
  console.log("📁 Saved to:", outFile);

  // Generate and copy ABI
  console.log("📋 Generating ABI...");
  const { artifacts } = await import("hardhat");
  const artifact = await artifacts.readArtifact("SealedAuction");
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;
  const deployedBytecode = artifact.deployedBytecode;

  const payload = { 
    name: "SealedAuction", 
    address, 
    chainId, 
    abi, 
    bytecode,
    deployedBytecode,
    deployTimestamp: data.timestamp 
  };
  
  // Save to abi/ directory
  const abiDir = path.join(process.cwd(), "abi");
  const abiFile = path.join(abiDir, "SealedAuction.json");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(abiFile, JSON.stringify(payload, null, 2));

  // Auto-copy to frontend
  const frontendFile = path.join(process.cwd(), "packages", "site", "contracts", "SealedAuction.json");
  const frontendDir = path.dirname(frontendFile);
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendFile, JSON.stringify(payload, null, 2));

  console.log("✅ ABI exported to:", abiFile);
  console.log("✅ ABI copied to frontend:", frontendFile);
  console.log("🎉 Deployment and ABI update complete!");
  console.log(`📍 Contract Address: ${address}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`⏰ Deploy Time: ${new Date().toLocaleString()}`);
}

main().catch((e) => { 
  console.error("❌ Error:", e); 
  process.exit(1); 
});
