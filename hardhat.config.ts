import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin"; // exposes `fhevm` helpers in Hardhat
import { HardhatUserConfig, vars } from "hardhat/config";

// Read secrets via `npx hardhat vars set KEY value`
const INFURA_API_KEY = (() => { try { return vars.get("INFURA_API_KEY"); } catch { return ""; } })();
const PRIVATE_KEY    = (() => { try { return vars.get("PRIVATE_KEY");    } catch { return ""; } })();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: INFURA_API_KEY && PRIVATE_KEY ? {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    } : undefined,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
export default config;
