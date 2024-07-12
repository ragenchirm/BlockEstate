import { createPublicClient, http } from "viem";
import { hardhat, sepolia, holesky } from "viem/chains";

const SEPOLIA_RPC = process.env.AL_SEPOLIA_RPC_URL ||""
const HOLESKY_RPC = process.env.AL_HOLESKY_RPC_URL ||""

//for hardhat
export const publicClient = createPublicClient({ // HardHat Client
  chain: hardhat,
  transport: http(process.env.RPC),
});

// //For holesky
// export const publicClient = createPublicClient({
//   chain: holesky,
//   transport: http(AL_HOLESKY_RPC_URL),
// });

// //For sepolia
// export const publicClient = createPublicClient({
//   chain: sepolia,
//   transport: http(SEPOLIA_RPC),
// });
