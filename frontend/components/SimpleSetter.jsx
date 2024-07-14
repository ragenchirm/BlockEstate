"use client"
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { contractMasterAbi, contractMasterAddress, contractStableAbi, contractProjectAbi, MASTER, PROJECT, STABLE, contractStableAddress, setProjectPriceInDollars, investInProject, adminWithdraw, askForARefund, adminDeposit, setFeeRate } from "@/constants";


const SimpleSetter = ({ refetch, funcName, contract, label, labelTitle, labelPlaceHolder, contractAdressProp, argsProp }) => {
    const { address } = useAccount();
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

    const [newData, setNewData] = useState(0);

    const { data: setDataHash, isPending: setDataIsPending, error: setDataError, writeContract: writeSetData } = useWriteContract();
    const { toast } = useToast();

    const setData = async (_data) => {
        if (argsProp) {
            argsProp.push(_data);
            console.log("argsprop :"+argsProp)
            writeSetData({
                address: contractAddress,
                abi: abi,
                functionName: funcName,
                args: argsProp,
                account: address,
            });
        } else {
            writeSetData({
                address: contractAddress,
                abi: abi,
                functionName: funcName,
                args: [_data],
                account: address,
            });
        }
    };
    const { isLoading: TXsetDataLoading, isSuccess: TXsetDataSuccess, error: TXsetDataError } = useWaitForTransactionReceipt({ hash: setDataHash });

    const handleSetData = async () => {
        if (funcName == (investInProject || adminWithdraw || askForARefund || adminDeposit)) {
            await setData(newData * 1000000);
        } else if (funcName == (setFeeRate)) {
            await setData(newData * 100);
        }
        else {
            await setData(newData);
        }
    };

    const handleChangeNewData = (e) => {
        setNewData(e.target.value);
    };
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
                className: "bg-orange-600 text-slate-950",
                status: "loading",
                duration: 3000,
            });
        }
    }, [TXsetDataSuccess, TXsetDataError, TXsetDataLoading])



    return (<>
        <div>{labelTitle}</div>
        <input
            type="text"
            onChange={handleChangeNewData}
            placeholder={labelPlaceHolder}
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
        <Button
            variant="outline"
            onClick={handleSetData}
            className="p-2 bg-blue-500 text-white rounded"
            disabled={TXsetDataLoading || newData == ""}>
            {TXsetDataLoading ? `Loading ${label}` : `${label}`}
        </Button>
    </>
    )
}

export default SimpleSetter