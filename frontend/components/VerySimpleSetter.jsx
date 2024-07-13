"use client"
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { contractMasterAbi, contractMasterAddress,contractStableAbi,contractProjectAbi, MASTER, PROJECT, STABLE, contractStableAddress, setProjectPriceInDollars, investInProject, adminWithdraw, askForARefund, adminDeposit, setFeeRate } from "@/constants";

const { address } = useAccount;

const VerySimpleSetter = ({ refetch, funcName, contract, label, labelTitle, labelPlaceHolder, contractAdressProp, argsProp }) => {
    let abi = null, contractAddress = null;
    //set contract address and abi
    if (contract == MASTER) {
        abi = contractMasterAbi;
        contractAddress = contractMasterAddress;
    } else if (contract == STABLE) {
        abi = contractStableAbi;
        contractAddress = contractStableAddress;
    } else if (contract == PROJECT) {
        abi = contractProjectAbi;
        contractAddress = contractAdressProp;
    }


    const { data: setDataHash, isPending: setDataIsPending, error: setDataError, writeContract: writeSetData } = useWriteContract();
    const { toast } = useToast();

    const setData = async () => {
        writeSetData({
            address: contractAddress,
            abi: abi,
            functionName: funcName,
            args: argsProp,
            account: address,
        });
    };
    const { isLoading: TXsetDataLoading, isSuccess: TXsetDataSuccess, error: TXsetDataError } = useWaitForTransactionReceipt({ hash: setDataHash });

    const refetchEverything = async () => {
        await refetch();
    };


    useEffect(() => {
        if (TXsetDataSuccess) {
            toast({
                title: "Victoire",
                description: `${label} a été changé avec succès !`,
                className: "bg-lime-600 text-slate-950",
                duration: 3000,
            })
            refetchEverything();
        }
        if (TXsetDataError) {
            toast({
                title: "Erreur",
                description: TXsetDataError.message,
                status: "error",
                className: "bg-red-600 text-slate-950",
                duration: 3000,
            });
        }
        if (TXsetDataLoading) {
            toast({
                title: `${label} loading`,
                description: `Nous inscrivons votre transaction ${label} dans la blockchain...`,
                status: "loading",
                duration: 3000,
            });
        }
    }, [TXsetDataSuccess, TXsetDataError, TXsetDataLoading])



    return (<>
        <div>{labelTitle}</div>
        <button
            onClick={handleSetData}
            className="p-2 bg-blue-500 text-white rounded"
            disabled={TXsetDataLoading || newData == ""}>
            {TXsetDataLoading ? `Loading ${label}` : `${label}`}
        </button>
    </>
    )
}

export default VerySimpleSetter