"use client";
import { useState, useEffect } from "react";
import { keccak256 } from "viem";
import { useChainId, useReadContract } from "wagmi";
import AlertInfo from "./Alert/AlertInfo";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

import { contractMasterAddress, contractMasterAbi, contractStableAddress, contractStableAbi, contractProjectAbi, HARDHAT_EXPECTED_NETWORK_ID, SEPOLIA_EXPECTED_NETWORK_ID, HOLESKY_EXPECTED_NETWORK_ID, DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE, OPERATOR_ROLE, BLACKLIST_ROLE, MASTER, setProjectPriceInDollars, hasRole, usdtContractAddress, bestFeeRateIPB, projectPriceInDollars, setFeeRate} from "@/constants";

import SimpleData from "./SimpleData";
import SimpleSetter from "./SimpleSetter";



const Master = ({ userAddress, isConnected }) => {
  // Utiliser useChainId pour obtenir l'ID de la chaine & vérifier si nous sommes sur le bon réseau
  const chainId = useChainId();
  const isOnExpectedNetwork = (chainId === HARDHAT_EXPECTED_NETWORK_ID || chainId === SEPOLIA_EXPECTED_NETWORK_ID || chainId == HOLESKY_EXPECTED_NETWORK_ID);

  const {
    data: getProjectPrice, isLoading: getProjectPricePending, error: getProjectPriceError, refetch: refetchProjectPrice } = useReadContract({
      abi: contractMasterAbi,
      address: contractMasterAddress,
      functionName: projectPriceInDollars,
      account: userAddress
    });

  const {
    data: getFeeRate, isLoading: getFeeRatePending, error: getFeeRateError, refetch: refetchFeeRate } = useReadContract({
      abi: contractMasterAbi,
      address: contractMasterAddress,
      functionName: bestFeeRateIPB,
      account: userAddress
    });

  const {
    data: getStableAddress, isLoading: getStablePending, error: getStableError, refetch: refetchStable } = useReadContract({
      abi: contractMasterAbi,
      address: contractMasterAddress,
      functionName: usdtContractAddress,
      account: userAddress
    });

  const {
    data: getIsSuperAdmin, isLoading: getIsSuperAdminPending, error: getIsSuperAdminError, refetch: refetchIsSuperAdmin } = useReadContract({
      abi: contractMasterAbi,
      address: contractMasterAddress,
      functionName: hasRole,
      args: [SUPER_ADMIN_ROLE, userAddress],
      account: userAddress
    });


  if (!isOnExpectedNetwork) {
    return (
      <div>
        <Alert className="bg-orange-400 text-black mb-2">
          <AlertTitle>NETWORK ERROR</AlertTitle>
          <AlertDescription>
            Please connect to the expected network. You are actually on the
            network ID: {chainId} and you need to be on the expected network ID:{" "}
            {HARDHAT_EXPECTED_NETWORK_ID} for HardHat or {SEPOLIA_EXPECTED_NETWORK_ID} for Sepolia
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between items-center p-5">
        <h1 className="text-4xl font-extrabold text-[#F8F4E3]">
          Bienvenue sur Block Estate
        </h1>
        <p className="text-[#706C61]">{isConnected ? `Vous êtes connecté avec : ${userAddress}` : "You are not Connected"}</p>
        
        <SimpleData getData={getProjectPrice} getPending={getProjectPricePending} getError={getProjectPriceError} refetch={refetchProjectPrice} label={"Project Price : "}>
          $
        </SimpleData>
        <SimpleData getData={Number(getFeeRate) / 100} getPending={getFeeRatePending} getError={getFeeRateError} refetch={refetchFeeRate} label={"Fees Rate : "}>
          % des intérêts
        </SimpleData>
        <SimpleData getData={getStableAddress} getPending={getStablePending} getError={getStableError} refetch={refetchFeeRate} label={"Addresse stablecoin contract : "}>
        </SimpleData>
        <SimpleData getData={getIsSuperAdmin} getPending={getIsSuperAdminPending} getError={getIsSuperAdminError} refetch={refetchFeeRate} label={"Super Admin :"}>
        </SimpleData>
        <SimpleSetter refetch={refetchProjectPrice} method={setProjectPriceInDollars} contract={MASTER} label={"Changer Prix"} labelTitle={"Changer prix projet"} labelPlaceHolder={"Nouveaux prix en $"}></SimpleSetter>
        <SimpleSetter refetch={refetchFeeRate} method={setFeeRate} contract={MASTER} label={"Changer Marckup"} labelTitle={"Marckup %"} labelPlaceHolder={"Nouveau marckup"}></SimpleSetter>
        

      </div>
      <AlertInfo chainId={chainId} />
    </div>
  );
};

export default Master;
