require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const HOLESKY_RPC_URL = process.env.HOLESKY_RPC_URL || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ||"";

module.exports = {
  solidity: "0.8.24",
  networks: {
    holesky: {
      url: HOLESKY_RPC_URL,
      chainId: 17000,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    hardhat: { //To fork maintnet
      forking: {
        url: MAINNET_RPC_URL,
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
    ],
  },
};
