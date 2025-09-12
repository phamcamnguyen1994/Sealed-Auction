import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("SealedAuction");
  const auction = await Factory.deploy(3600); // 1h bidding
  await auction.waitForDeployment();

  console.log("SealedAuction deployed at:", await auction.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
