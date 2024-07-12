import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { contractMasterAbi, contractMasterAddress,contractStableAbi,contractProjectAbi, MASTER, PROJECT, STABLE, contractStableAddress } from "@/constants";

const { address } = useAccount;


const SimpleSetter = ({ refetch, method, contract, label, labelTitle, labelPlaceHolder, addressProp }) => {
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
        contractAddress = addressProp;
    }

    const [newData, setNewData] = useState(0);

    const { data: setDataHash, isPending: setDataIsPending, error: setDataError, writeContract: writeSetData } = useWriteContract();
    const { toast } = useToast();

    const setData = async (_data) => {
        writeSetData({
            address: contractAddress,
            abi: abi,
            functionName: method,
            args: [_data],
            account: address,
        });
    };
    const { isLoading: TXsetDataLoading, isSuccess: TXsetDataSuccess, error: TXsetDataError } = useWaitForTransactionReceipt({ hash: setDataHash });

    const handleSetData = async () => {
        await setData(newData);
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
        <button
            onClick={handleSetData}
            className="p-2 bg-blue-500 text-white rounded"
            disabled={TXsetDataLoading || newData == ""}>
            {TXsetDataLoading ? `Loading ${label}` : `${label}`}
        </button>
    </>
    )
}

export default SimpleSetter