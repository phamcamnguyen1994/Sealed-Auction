import "@fhevm/hardhat-plugin";
import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";


async function main() {
const net = await ethers.provider.getNetwork();
const chainId = Number(net.chainId);
const file = path.join(process.cwd(), "deployments", `${chainId}.json`);


let auctionAddr = process.env.AUCTION || "";
if (!auctionAddr) {
try { auctionAddr = JSON.parse(fs.readFileSync(file, "utf8")).address; }
catch { throw new Error(`Missing AUCTION and no ${file}. Run: npx hardhat run scripts/deploy-local.ts --network localhost`); }
}


const bidderIndex = process.env.BIDDER ? parseInt(process.env.BIDDER, 10) : 1;
const amount = process.env.AMOUNT ? parseInt(process.env.AMOUNT, 10) : 75;


const signers = await ethers.getSigners();
const bidder = signers[bidderIndex];
if (!bidder) throw new Error(`No signer at index ${bidderIndex}`);


const auction = await ethers.getContractAt("SealedAuction", auctionAddr);


await hre.fhevm.initializeCLIApi();

const input = hre.fhevm.createEncryptedInput(auctionAddr, bidder.address);
input.add64(amount);
const enc = await input.encrypt();


const encLead = await auction.connect(bidder).placeBid.staticCall(enc.handles[0], enc.inputProof);
await (await auction.connect(bidder).placeBid(enc.handles[0], enc.inputProof)).wait();


const isLead = await hre.fhevm.userDecryptEbool(encLead, auctionAddr, bidder);
console.log(`Bidder ${bidderIndex} (${bidder.address}) bid ${amount}. Leading?`, isLead);
}


main().catch((e) => { console.error(e); process.exit(1); });