"use client";
import NotConnected from "@/components/NotConnected";
import Master from "@/components/Master";

import { useAccount } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  return <> <Master userAddress={address} isConnected={isConnected} /> </>;
}
