"use client"
import { useReadContract, useAccount } from "wagmi";
import { useEffect } from "react";
import { STABLE, MASTER, PROJECT, contractMasterAbi, contractMasterAddress, contractStableAbi, contractStableAddress, contractProjectAbi, bestFeeRateIPB, projectPriceInDollars, balanceOf, interestRateIPB, totalSupply, allowed, totalAmountWithInterest } from "@/constants";


const SimpleGetter = ({ funcName, argsProp, label, refetchToggle, contract, children, addressProp, giveState }) => {
  const { userAddress } = useAccount();
  let abi = null, contractAddress = null;
  let sixDecimals = (funcName == balanceOf || funcName == totalSupply || funcName == allowed || funcName == totalAmountWithInterest);
  let ipb = (funcName == bestFeeRateIPB || funcName == interestRateIPB)

  //set contract address and abi
  if (contract == MASTER) {
    abi = contractMasterAbi;
    contractAddress = contractMasterAddress;
  } else if (contract == STABLE) {
    abi = contractStableAbi;
    contractAddress = contractStableAddress;
  } else if (contract == PROJECT) {
    abi = contractProjectAbi;
    contractAddress = addressProp;
  }

  const {
    data: getData, isLoading: getPending, error: getError, refetch: refetchDataRead } = useReadContract({
      abi: abi,
      address: contractAddress,
      functionName: funcName,
      args: argsProp,
      account: userAddress
    });

  const refetchData = async () => {
    await refetchDataRead();
  };

  useEffect(() => {
    refetchData();
  }, [refetchToggle])

  useEffect(() => {
    if (!getPending && giveState) {
      if (ipb) {
        giveState(Number(getData) / 100)
      }
      else if (sixDecimals) {
        giveState(Number(getData) / 1000000);
      } else {
        giveState(getData);
      }
    }
  }, [getData, getPending])

  return (
    <div className="flex flex-col justify-between items-center">
      {getPending ? (
        <div>{`Chargement ${label}...`}</div>
      ) : (getError ?
        (
          <div>{`Erreur chargement ${label}...`}</div>
        ) : (
          (ipb) ? (
            <p className="text-[#706C61]">{`${label} ${Number(getData) / 100}`} {children}</p>) :
            (sixDecimals) ? (
              <p className="text-[#706C61]">{`${label} ${Number(getData) / 1000000}`} {children}</p>
            ) : (
              <p className="text-[#706C61]">{`${label} ${getData}`} {children}</p>
            )
        )
      )}
    </div>
  )
}

export default SimpleGetter