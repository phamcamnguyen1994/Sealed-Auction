import { ethers, artifacts } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  // Resolve contract address: prefer AUCTION, else deployments/{chainId}.json
  const deploymentsFile = path.join(process.cwd(), "deployments", `${chainId}.json`);
  let address = process.env.AUCTION || "";
  if (!address) {
    try {
      address = JSON.parse(fs.readFileSync(deploymentsFile, "utf8")).address;
    } catch {
      throw new Error(
        `Missing AUCTION and no ${deploymentsFile}. Set $env:AUCTION or deploy first.`,
      );
    }
  }

  // Load compiled artifact for SealedAuction
  const artifact = await artifacts.readArtifact("SealedAuction");
  const abi = artifact.abi;

  // Ensure output dir exists
  const outDir = path.join(process.cwd(), "abi");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Write file consumable by frontend/services
  const outFile = path.join(outDir, "SealedAuction.json");
  const payload = { name: "SealedAuction", address, chainId, abi };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

  // Auto-copy to frontend
  const frontendFile = path.join(process.cwd(), "packages", "site", "contracts", "SealedAuction.json");
  const frontendDir = path.dirname(frontendFile);
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendFile, JSON.stringify(payload, null, 2));

  console.log(`ABI exported to: ${outFile}`);
  console.log(`ABI copied to frontend: ${frontendFile}`);
  console.log(`Address: ${address}`);
  console.log(`ChainId: ${chainId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


