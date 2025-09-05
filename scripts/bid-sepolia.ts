import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";
import { ethers } from "ethers";
import abi from "../abi/SealedAuction.json" assert { type: "json" };

const AUCTION = process.env.AUCTION!; // 0x...
const PRIVATE_KEY = process.env.PRIVATE_KEY!; // bidder's key
const BID = BigInt(process.env.BID ?? "70");

async function main() {
  if (!AUCTION) throw new Error("Missing AUCTION env var");
  if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY env var");

  const instance = await createInstance(SepoliaConfig);

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC ?? (SepoliaConfig as any).network,
  );
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(AUCTION, (abi as any).abi ?? (abi as any), wallet);

  // Create encrypted input
  const inputBuf = instance.createEncryptedInput(AUCTION, wallet.address);
  inputBuf.add64(BID);
  const encrypted = await inputBuf.encrypt();
  const handle = encrypted.handles[0];

  // Strict sealed: skip staticCall; send tx directly
  const tx = await auction.placeBid(handle, encrypted.inputProof);
  await tx.wait();
  console.log("✅ Bid sent. Hash:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


