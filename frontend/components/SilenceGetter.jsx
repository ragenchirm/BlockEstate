"use client"
import { useReadContract, useAccount} from "wagmi";
import { useEffect } from "react";
import { STABLE, MASTER, PROJECT, contractMasterAbi, contractMasterAddress, contractStableAbi, contractStableAddress, contractProjectAbi, bestFeeRateIPB, projectPriceInDollars, balanceOf, interestRateIPB, totalSupply, allowed, totalAmountWithInterest } from "@/constants";


const SilenceGetter = ({funcName, argsProp, refetchToggle, contract, children, addressProp, giveState}) => {
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
    <></>
  )
}

export default SilenceGetter