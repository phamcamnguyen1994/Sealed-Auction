import { ethers } from "hardhat";
import fs from "fs";
import path from "path";


async function main() {
const [deployer] = await ethers.getSigners();
console.log("Deployer:", deployer.address);


const Factory = await ethers.getContractFactory("SealedAuction");
const auction = await Factory.deploy(3600); // 1h
await auction.waitForDeployment();


const addr = await auction.getAddress();
const net = await ethers.provider.getNetwork();
console.log("Network:", net.name || net.chainId.toString());
console.log("SealedAuction:", addr);

// Persist deployment info for this chainId (e.g., 11155111 for Sepolia)
const outDir = path.join(process.cwd(), "deployments");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${Number(net.chainId)}.json`);
const payload = {
  address: addr,
  chainId: Number(net.chainId),
  deployedBy: deployer.address,
  timestamp: Math.floor(Date.now() / 1000),
};
fs.writeFileSync(file, JSON.stringify(payload, null, 2));
console.log("Saved to:", file);
}


main().catch((e) => {
console.error(e);
process.exit(1);
});