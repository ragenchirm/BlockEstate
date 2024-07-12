"use client";
import NotConnected from "@/components/NotConnected";

import { useAccount } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  return <>{isConnected ? <h1>Hello and welcome</h1> : <NotConnected />}</>;

  // <Voting address={address} />
}
