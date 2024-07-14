"use client"
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { contractMasterAbi, contractMasterAddress, contractStableAbi, contractProjectAbi, MASTER, PROJECT, STABLE, contractStableAddress, setProjectPriceInDollars, investInProject, adminWithdraw, askForARefund, adminDeposit, setFeeRate, createProject, approve} from "@/constants";


const CreateProject = ({ refetch, bestFeeRate, projectPriceInDol, userAddress }) => {  
 
    const { toast } = useToast();
    const [newData, setNewData] = useState([0,0,0,0,0]);
    
    const { data: setDataHash, isPending: setDataIsPending, error: setDataError, writeContract: writeSetData } = useWriteContract();
    const { isLoading: TXsetDataLoading, isSuccess: TXsetDataSuccess, error: TXsetDataError } = useWaitForTransactionReceipt({ hash: setDataHash });
    const setData = async () => {
            writeSetData({
                address: contractMasterAddress,
                abi: contractMasterAbi,
                functionName: createProject,
                args: newData,
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
            args: [contractMasterAddress, _amount],
            account: userAddress,
        });
};
const setApprove0 = async () => {
    writeSetApprove0({
        address: contractStableAddress,
        abi: contractStableAbi,
        functionName: approve,
        args: [contractMasterAddress, 0],
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
            await setApprove(Number(projectPriceInDol)*1000000);
};

    const handleSetData = async ()=>{
        await setData();
    }

    const handleChangeInitialSupply = (e) => {
        let i = e.target.value*1000000
        newData[0]=i
    };
    const handleChangeProjectDeadline = (e) => {
        newData[1]=e.target.value
    };
    const handleChangeInterestRate = (e) => {
        let i = e.target.value*100
        newData[2]=i
    };
    const handleChangeDescLink = (e) => {
        newData[3]=e.target.value
    };
    const handleChangeprojectName = (e) => {
        newData[4]=e.target.value
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
        <div>Créer un projet</div>
        <input
            type="text"
            onChange={handleChangeInitialSupply}
            placeholder="Montant à lever"
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
         <input
            type="text"
            onChange={handleChangeProjectDeadline}
            placeholder="Durée prévisionnelle"
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
         <input
            type="text"
            onChange={handleChangeInterestRate}
            placeholder="Taux Intérêt"
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
         <input
            type="text"
            onChange={handleChangeDescLink}
            placeholder="Lien vers le site du projet"
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
         <input
            type="text"
            onChange={handleChangeprojectName}
            placeholder="Nom du projet"
            className="p-2 border rounded mb-4 text-black mr-5 min-w-96"
        />
        <Button
            variant="outline"
            onClick={handleSetApprove0}
            className="p-2 bg-blue-500 text-white rounded"
            disabled={TXsetDataLoading || newData == ""}>
            {TXsetDataLoading || TXsetApproveLoading ? `Loading ` : `Créer un projet`}
        </Button>
    </>
    )
}

export default CreateProject