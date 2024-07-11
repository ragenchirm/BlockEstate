require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
const SEPOLIA_HOLESKY_PRIVATE_KEY = process.env.SEPOLIA_HOLESKY_PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";//hh user0 PK
const HOLESKY_RPC_URL = process.env.AL_HOLESKY_RPC_URL || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MAINNET_RPC_URL = process.env.IN_MAINNET_RPC_URL || "";
const SEPOLIA_RPC_URL = process.env.AL_SEPOLIA_RPC_URL ||"";

module.exports = {
  solidity: "0.4.17",
  allowUnlimitedContractSize: true,
  networks: {
    holesky: {
      url: HOLESKY_RPC_URL,
      chainId: 17000,
      accounts: [`0x${SEPOLIA_HOLESKY_PRIVATE_KEY}`]
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [`0x${SEPOLIA_HOLESKY_PRIVATE_KEY}`]
    },
    hardhat: { //To fork maintnet
      forking: {
        url: "https://mainnet.infura.io/v3/c60bac258c974c46ab0583ca815b3e3c",
      }
    }
  },
  gasReporter: {
    enabled: true,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.4.17",
      },
    ],
  },
};