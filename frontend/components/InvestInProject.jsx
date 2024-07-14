"use client"
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { contractMasterAbi, contractMasterAddress, contractStableAbi, contractProjectAbi, MASTER, PROJECT, STABLE, contractStableAddress, setProjectPriceInDollars, investInProject, adminWithdraw, askForARefund, adminDeposit, setFeeRate, createProject, approve} from "@/constants";


const InvestInProject = ({ refetch, userAddress, projectAddress, funcName, label, labelPlaceHolder}) => {  
 
    const { toast } = useToast();
    let [newAmount, setNewAmount] = useState(0);
    
    const { data: setDataHash, isPending: setDataIsPending, error: setDataError, writeContract: writeSetData } = useWriteContract();
    const { isLoading: TXsetDataLoading, isSuccess: TXsetDataSuccess, error: TXsetDataError } = useWaitForTransactionReceipt({ hash: setDataHash });
    const setData = async () => {
            writeSetData({
                address: projectAddress,
                abi: contractProjectAbi,
                functionName: funcName,
                args: [newAmount],
                account: userAddress,
                error: setDataError
            });
    };


const { data: setApprove0Hash, isPending: setApprove0IsPending, error: setApprove0Error, writeContract: writeSetApprove0 } = useWriteContract();
const { data: setApproveHash, isPending: setApproveIsPending, error: setApproveError, writeContract: writeSetApprove } = useWriteContract();
const { isLoading: TXsetApproveLoading, isSuccess: TXsetApproveSuccess, error: TXsetApproveError } = useWaitForTransactionReceipt({ hash: setApproveHash });
const { isLoading: TXsetApprove0Loading, isSuccess: TXsetApprove0Success, error: TXsetApprove0Error } = useWaitForTransactionReceipt({ hash: setApprove0Hash });
    const setApprove = async (_amount) => {
        writeSetApprove({
            address: contractStableAddress,
            abi: contractStableAbi,
            functionName: approve,
            args: [projectAddress, _amount],
            account: userAddress,
        });
};
const setApprove0 = async () => {
    writeSetApprove0({
        address: contractStableAddress,
        abi: contractStableAbi,
        functionName: approve,
        args: [projectAddress, 0],
        account: userAddress,
    });
};


    const refetchEverything = async () => {
        await refetch();
    };

    const handleSetApprove0 = async () => {
                await setApprove0();
    };
    const handleSetApprove = async () => {
            await setApprove(newAmount);
};

    const handleSetData = async ()=>{
        await setData();
    }

    const handleChangeInvestedAmount = (e) => {
        let inv = e.target.value*1000000;
        setNewAmount(inv);
        
    };

   
    useEffect(() => {
        if (TXsetApprove0Success) {
            toast({
                title: "Victoire",
                description: `Approve a été changé avec succès !`,
                className: "bg-lime-600 text-slate-950",
                duration: 3000,
            })
                handleSetApprove();
        }
        if (TXsetApprove0Error) {
            toast({
                title: "Erreur",
                description: TXsetApprove0Error.message,
                status: "error",
                className: "bg-red-600 text-slate-950",
                duration: 3000,
            });
        }
        if (TXsetApprove0Loading) {
            toast({
                title: `Approve is loading`,
                description: `Nous inscrivons votre transaction Approve dans la blockchain...`,
                className: "bg-orange-600 text-slate-950",
                status: "loading",
                duration: 3000,
            });
        }
    }, [TXsetApprove0Success, TXsetApprove0Error, TXsetApprove0Loading]);

    useEffect(() => {
        if (TXsetApproveSuccess) {
            toast({
                title: "Victoire",
                description: `Approve a été changé avec succès !`,
                className: "bg-lime-600 text-slate-950",
                duration: 3000,
            })
                handleSetData();
        }
        if (TXsetApproveError) {
            toast({
                title: "Erreur",
                description: TXsetApproveError.message,
                status: "error",
                className: "bg-red-600 text-slate-950",
                duration: 3000,
            });
        }
        if (TXsetApproveLoading) {
            toast({
                title: `Approve is loading`,
                description: `Nous inscrivons votre transaction Approve dans la blockchain...`,
                className: "bg-orange-600 text-slate-950",
                status: "loading",
                duration: 3000,
            });
        }
    }, [TXsetApproveSuccess, TXsetApproveError, TXsetApproveLoading])

    useEffect(() => {
        if (TXsetDataSuccess) {
            toast({
                title: "Victoire",
                description: `Le projet à été créé avec succès !`,
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
                title: `Création loading`,
                description: `Nous inscrivons votre création de projet dans la blockchain...`,
                className: "bg-orange-600 text-slate-950",
                status: "loading",
                duration: 3000,
            });
        }
        if (setDataError) {
            toast({
                title: `Erreur création projet`,
                description:  setDataError.message,
                status: "error",
                className: "bg-red-600 text-slate-950",
                duration: 3000,
            });
        }
    }, [TXsetDataSuccess, TXsetDataError, TXsetDataLoading, setDataError])



    return (<>
         <input
            type="text"
            onChange={handleChangeInvestedAmount}
            placeholder={`${labelPlaceHolder}`}
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
        <Button
            variant="outline"
            onClick={handleSetApprove0}
            className="p-2 bg-blue-500 text-white rounded"
            disabled={TXsetDataLoading || newAmount == ""}>
            {TXsetDataLoading || TXsetApproveLoading ? `Loading ` : `${label}`}
        </Button>
    </>
    )
}

export default InvestInProject