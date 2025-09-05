import "@fhevm/hardhat-plugin";
import hre from "hardhat";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function encBid(auctionAddr: string, bidder: any, amount: number) {
  const input = hre.fhevm.createEncryptedInput(auctionAddr, bidder.address);
  input.add64(amount);
  return await input.encrypt();
}

async function main() {
  const [seller, alice, bob, charlie] = await ethers.getSigners();

  // For scripts, initialize fhEVM CLI when not under `hardhat test`.
  // Use with `--network localhost` (Hardhat Node) or `--network sepolia`.
  await hre.fhevm.initializeCLIApi();

  const Factory = await ethers.getContractFactory("SealedAuction");
  const auction = await Factory.connect(seller).deploy(3600); // 1h bidding
  const auctionAddr = await auction.getAddress();
  console.log("Deployed SealedAuction:", auctionAddr);

  // On CLI mode, contracts repo is initialized by initializeCLIApi above.

  // Alice bids 50
  const bAlice = await encBid(auctionAddr, alice, 50);
  await (await auction.connect(alice).placeBid(bAlice.handles[0], bAlice.inputProof)).wait();
  console.log("Alice bid submitted (strict sealed: no feedback)");

  // Bob bids 70
  const bBob = await encBid(auctionAddr, bob, 70);
  await (await auction.connect(bob).placeBid(bBob.handles[0], bBob.inputProof)).wait();
  console.log("Bob bid submitted (strict sealed: no feedback)");

  // Charlie bids 65
  const bCharlie = await encBid(auctionAddr, charlie, 65);
  await (await auction.connect(charlie).placeBid(bCharlie.handles[0], bCharlie.inputProof)).wait();
  console.log("Charlie bid submitted (strict sealed: no feedback)");

  // Move time forward to end auction
  await time.increase(3600);
  await (await auction.connect(seller).finalize()).wait();
  console.log("Auction finalized by:", seller.address);

  // Decrypt winner and price by seller
  const encWinner = await auction.connect(seller).winnerCipher();
  const winner = await hre.fhevm.userDecryptEaddress(encWinner, auctionAddr, seller);
  console.log("Winner:", winner);

  const encPrice = await auction.connect(seller).highestBidCipher();
  const winPrice = await hre.fhevm.userDecryptEuint(FhevmType.euint64, encPrice, auctionAddr, seller);
  console.log("Winning price:", winPrice.toString());

  // Grant view permission to winner and demonstrate decrypt from winner POV if local signer
  await (await auction.connect(seller).grantView(winner)).wait();
  const potentialWinnerSigner = [seller, alice, bob, charlie].find((s) => s.address.toLowerCase() === winner.toLowerCase());
  if (potentialWinnerSigner) {
    const encPriceForWinner = await auction.connect(potentialWinnerSigner).highestBidCipher();
    const winPrice2 = await hre.fhevm.userDecryptEuint(
      FhevmType.euint64,
      encPriceForWinner,
      auctionAddr,
      potentialWinnerSigner,
    );
    console.log("Winner can decrypt price:", winPrice2.toString());
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


