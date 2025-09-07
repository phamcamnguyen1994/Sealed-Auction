import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AuctionRegistry...");

  // Get the contract factory
  const AuctionRegistry = await ethers.getContractFactory("AuctionRegistry");

  // Deploy the contract
  const registry = await AuctionRegistry.deploy();

  // Wait for deployment to complete
  await registry.waitForDeployment();

  // Get the deployed address
  const registryAddress = await registry.getAddress();

  console.log("AuctionRegistry deployed to:", registryAddress);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  const deploymentData = {
    name: "AuctionRegistry",
    address: registryAddress,
    chainId: Number(chainId),
    abi: AuctionRegistry.interface.format("json"),
    bytecode: AuctionRegistry.bytecode,
    deployTimestamp: Date.now()
  };

  // Write to deployments file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${chainId}.json`);
  let existingData = {};
  
  if (fs.existsSync(deploymentFile)) {
    existingData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  }
  
  existingData.AuctionRegistry = deploymentData;
  
  fs.writeFileSync(deploymentFile, JSON.stringify(existingData, null, 2));
  
  console.log("Deployment data saved to:", deploymentFile);
  console.log("Registry address:", registryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
