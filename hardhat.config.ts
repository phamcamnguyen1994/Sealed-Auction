import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin"; // exposes `fhevm` helpers in Hardhat
import { HardhatUserConfig, vars } from "hardhat/config";
import type { NetworksUserConfig } from "hardhat/types";

// Read secrets via `npx hardhat vars set KEY value`
const INFURA_API_KEY = (() => { try { return vars.get("INFURA_API_KEY"); } catch { return ""; } })();
const PRIVATE_KEY    = (() => { try { return vars.get("PRIVATE_KEY");    } catch { return ""; } })();

const networks: NetworksUserConfig = { hardhat: { chainId: 31337 } };

if (INFURA_API_KEY && PRIVATE_KEY) {
  networks.sepolia = {
    url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    accounts: [PRIVATE_KEY],
    chainId: 11155111,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
export default config;
