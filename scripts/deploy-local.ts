import { ethers } from "hardhat";
import fs from "fs";
import path from "path";


async function main() {
const [deployer] = await ethers.getSigners();
const Factory = await ethers.getContractFactory("SealedAuction");
const auction = await Factory.connect(deployer).deploy(3600);
await auction.waitForDeployment();


const address = await auction.getAddress();
const net = await ethers.provider.getNetwork();
const chainId = Number(net.chainId);


const outDir = path.join(process.cwd(), "deployments");
const outFile = path.join(outDir, `${chainId}.json`);
const data = { address, chainId, deployedBy: deployer.address, timestamp: Math.floor(Date.now()/1000) };


fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(data, null, 2));


console.log("Deployed:", data);
console.log("Saved to:", outFile);
}


main().catch((e) => { console.error(e); process.exit(1); });