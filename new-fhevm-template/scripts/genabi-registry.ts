import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Generating Registry ABI...");

  // Get the contract factory
  const AuctionRegistry = await ethers.getContractFactory("AuctionRegistry");

  // Get the ABI
  const abi = AuctionRegistry.interface.format("json");

  // Create ABI object
  const abiData = {
    name: "AuctionRegistry",
    abi: abi,
    bytecode: AuctionRegistry.bytecode
  };

  // Create abi directory if it doesn't exist
  const abiDir = path.join(__dirname, "..", "abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  // Write ABI to abi directory
  const abiFile = path.join(abiDir, "AuctionRegistry.json");
  fs.writeFileSync(abiFile, JSON.stringify(abiData, null, 2));
  console.log("Registry ABI exported to:", abiFile);

  // Copy to frontend contracts directory
  const frontendContractsDir = path.join(__dirname, "..", "packages", "site", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const frontendAbiFile = path.join(frontendContractsDir, "AuctionRegistry.json");
  fs.writeFileSync(frontendAbiFile, JSON.stringify(abiData, null, 2));
  console.log("Registry ABI copied to frontend:", frontendAbiFile);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("ChainId:", network.chainId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
