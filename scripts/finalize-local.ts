import "@fhevm/hardhat-plugin";
import hre, { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FhevmType } from "@fhevm/hardhat-plugin";
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


const [seller, ...rest] = await ethers.getSigners();
const auction = await ethers.getContractAt("SealedAuction", auctionAddr);


const state = await auction.getState();
const endTime = Number(state[2]);
const latest = await ethers.provider.getBlock("latest");
const now = Number(latest!.timestamp);
if (now <= endTime) await time.increase(endTime - now + 1);


await (await auction.connect(seller).finalize()).wait();


await hre.fhevm.initializeCLIApi();

const encWinner = await auction.connect(seller).winnerCipher();
const winner = await hre.fhevm.userDecryptEaddress(encWinner, auctionAddr, seller);
console.log("Winner:", winner);


const encPrice = await auction.connect(seller).highestBidCipher();
const winPrice = await hre.fhevm.userDecryptEuint(
FhevmType.euint64,
encPrice,
auctionAddr,
seller,
);
console.log("Winning price:", winPrice.toString());


await (await auction.connect(seller).grantView(winner)).wait();


const winnerSigner = [seller, ...rest].find((s) => s.address.toLowerCase() === winner.toLowerCase());
if (winnerSigner) {
const encPriceForWinner = await auction.connect(winnerSigner).highestBidCipher();
const winPrice2 = await hre.fhevm.userDecryptEuint(
FhevmType.euint64,
encPriceForWinner,
auctionAddr,
winnerSigner,
);
console.log("Winner can decrypt price:", winPrice2.toString());
}
}


main().catch((e) => { console.error(e); process.exit(1); });