import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";
import { ethers } from "ethers";
import abi from "../abi/SealedAuction.json" assert { type: "json" };

const AUCTION = process.env.AUCTION!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!; // seller key

async function userDecryptHandle(instance: any, signer: ethers.Wallet, contractAddress: string, handle: string) {
  const keypair = instance.generateKeypair();
  const start = Math.floor(Date.now() / 1000).toString();
  const durationDays = "7";
  const contractAddresses = [contractAddress];

  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, start, durationDays);
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );

  const result = await instance.userDecrypt(
    [{ handle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    signer.address,
    start,
    durationDays,
  );
  return result[handle];
}

async function main() {
  if (!AUCTION) throw new Error("Missing AUCTION env var");
  if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY env var");

  const instance = await createInstance(SepoliaConfig);
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC ?? (SepoliaConfig as any).network,
  );
  const seller = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(AUCTION, (abi as any).abi ?? (abi as any), seller);

  const tx = await auction.finalize();
  await tx.wait();
  console.log("✅ Finalized:", tx.hash);

  const encWinner: string = await auction.winnerCipher();
  const encPrice: string = await auction.highestBidCipher();

  const winner = await userDecryptHandle(instance, seller, AUCTION, encWinner);
  const price = await userDecryptHandle(instance, seller, AUCTION, encPrice);
  console.log("Winner:", winner);
  console.log("Winning price:", price.toString());

  const tx2 = await auction.grantView(winner);
  await tx2.wait();
  console.log("Granted view to winner.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


