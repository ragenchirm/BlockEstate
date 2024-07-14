import { STABLE, MASTER, PROJECT, contractMasterAbi, contractMasterAddress, contractStableAbi, contractStableAddress, contractProjectAbi, bestFeeRateIPB, projectPriceInDollars, balanceOf, interestRateIPB, totalSupply, allowed, totalAmountWithInterest, bestProjectsAddresses, name, projectDeadline, desc_link, projectStatus, hasRole, OPERATOR_ROLE, DEFAULT_ADMIN_ROLE, askForARefund, adminWithdraw, investInProject, adminDeposit, finishProject, claimFundsWithInterest } from "@/constants";
import { useReadContract, useAccount } from "wagmi";
import { useEffect, useState } from "react";
import SimpleGetter from "./SimpleGetter";
import SilenceGetter from "./SilenceGetter";
import InvestInProject from "./InvestInProject";
import SimpleSetter from "./SimpleSetter";
import VerySimpleSetter from "./VerySimpleSetter";

const Projects = ({ refetchToggle, refetch, userAddress }) => {
    // const { address, isConnected } = useAccount();
    const projectStates = [
        "Financement ouvert",
        "Annulé",
        "Projet en cours",
        "Projet terminé",
    ];

    let [projectIndex, setProjectIndex] = useState(null);
    const [project, setProject] = useState();
    const [projects, setProjects] = useState([]);
    const [projectSelected, setProjectSelected] = useState(null);
    let [isOperator, setNewIsOperator] = useState(null);
    let [newUserBalance, setNewUserBalance] = useState(null);
    const [newProjectStatus, setNewProjectStatus] = useState(null);
    const [newProjectBalance, setNewProjectBalance] = useState(null);
    const [newAmountWithInterest, setNewAmountWithInterest] = useState(null);
    

    const { data: getProject, error: projectError, isLoading: isProjectLoading, refetch: refetchProject } = useReadContract({
        abi: contractMasterAbi,
        address: contractMasterAddress,
        functionName: bestProjectsAddresses,
        args: [projectIndex],
        account: userAddress
    });

    const setIsOperator = async (_data) => {
        console.log("SET OOOOOPERATOR " + _data)
        await setNewIsOperator(_data);
        console.log("OPERA " + isOperator)
    };
    const setProjectStatus = async (_data) => {
        await setNewProjectStatus(_data);
    };
    const setUserBalance = async (_data) => {
        await setNewUserBalance(_data);
    };
    const setAmountWithInterest = async (_data) => {
        await setNewAmountWithInterest(_data);
    }; 
    const setProjectBalance = async (_data) => {
        await setNewProjectBalance(_data);
    }; 

    const refetchAProject = async () => {
        await refetchProject();
    };

    useEffect(() => {
        if (projectError) {
            console.log('Project error, on s\'arrete' + (projectError.shortMessage || projectError.message))
        } else
            if (isProjectLoading === false && getProject != undefined && getProject != projects.findLast(e => e)) {
                setProject(getProject)
                projects.push(getProject)
                setProjectIndex(projectIndex + 1)
                refetchAProject();
            }
    }, [getProject, isProjectLoading, projectIndex]);

    useEffect(() => {
        setProjectIndex(0);
        setProjects([]);

    }, [refetchToggle])

    const handleClickProject = async (selectProjectAddress) => {
        setProjectSelected(selectProjectAddress);
        //refetchEverything();
    }




    return (
        <><div className="my-5">
            <h2 className="text-xl">Voici la liste des projets :</h2>
            <ol class="container mx-auto px-4">

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {projects.map((_projAdr, i) => (
                        <li className="hover:bg-orange-200 cursor-pointer bg-orange-50 text-[#F8F4E3] mx-4 my-3 rounded px-5 flex justify-between items-center w-full" key={_projAdr} onClick={() => handleClickProject(_projAdr)} >
                            <div >
                                <p className="text-lg font-bold text-[#706C61] my-1">Projet n° {i + 1} : </p>
                               
                                <img src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
                                <SimpleGetter funcName={name} label={"Nom : "} userAddress={userAddress} contract={PROJECT} addressProp={_projAdr} refetchToggle={refetchToggle} ></SimpleGetter>
                                <SimpleGetter funcName={totalSupply} label={"Montant à collecter : "} userAddress={userAddress} contract={PROJECT} addressProp={_projAdr} refetchToggle={refetchToggle} >$</SimpleGetter>
                                <SimpleGetter funcName={interestRateIPB} label={"Intérêts : "} userAddress={userAddress} contract={PROJECT} addressProp={_projAdr} refetchToggle={refetchToggle} >%</SimpleGetter>
                                <SimpleGetter funcName={projectDeadline} label={"Durée prévisionnelle : "} userAddress={userAddress} contract={PROJECT} addressProp={_projAdr} refetchToggle={refetchToggle} >jours</SimpleGetter>
                                <SimpleGetter funcName={desc_link} label={"Site : "} userAddress={userAddress} contract={PROJECT} addressProp={_projAdr} refetchToggle={refetchToggle} ></SimpleGetter>
                                <p className="text-[#706C61]">{_projAdr}</p>
                            </div>
                        </li>
                    ))}
                </div>
            </ol>
            {projectSelected &&
                <div className="flex flex-col justify-between items-center w-full my-6 py-6 bg-orange-50 rounded-xl">
                    <SimpleGetter funcName={name} label={"Nom : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} ></SimpleGetter>
                    {newProjectStatus==3 &&
                    <p className="text-lime-500 text-4xl p-5">Ce projet est terminé - vous pouvez demander votre remboursement</p>}
                    {isOperator &&
                        <h1 className="text-xl text-green-800">Vous êtes opérateur de ce projet</h1>}
                    <img className="py-3" src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
                    <div className="p-5 my-5 bg-orange-50 border rounded-md border-black border-solid">
                        <SimpleGetter funcName={totalSupply} label={"Montant à collecter : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} >$</SimpleGetter>
                        <SimpleGetter funcName={interestRateIPB} label={"Intérêts : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} >%</SimpleGetter>
                        <SimpleGetter funcName={bestFeeRateIPB} label={"Frais sur Intérêts : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} >%</SimpleGetter>
                        <SimpleGetter funcName={projectDeadline} label={"Durée prévisionnelle : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} >jours</SimpleGetter>
                        <SimpleGetter funcName={desc_link} label={"Site : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} ></SimpleGetter>
                    

                    <SimpleGetter funcName={balanceOf} label={"Vos obligations : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} argsProp={[userAddress]} giveState={setUserBalance} >BEST</SimpleGetter>
                    </div>

                    {newProjectStatus == 0 &&
                        <>
                            <SimpleGetter funcName={balanceOf} label={"Montant levé : "} userAddress={userAddress} contract={STABLE} refetchToggle={refetchToggle} argsProp={[projectSelected]} >USDT</SimpleGetter>
                            <SimpleGetter funcName={balanceOf} label={"Reste à investir : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} argsProp={[projectSelected]} >$</SimpleGetter>
                            <InvestInProject funcName={investInProject} refetch={refetch} userAddress={userAddress} projectAddress={projectSelected} label={"Investir"} labelPlaceHolder={"Montant à investir"}></InvestInProject>
                            <SimpleSetter refetch={refetch} funcName={askForARefund} contract={PROJECT} contractAdressProp={projectSelected} label={"Demander un remboursement"} labelTitle={"Retirer %"} labelPlaceHolder={"Montant à retirer"}></SimpleSetter>
                        </>
                    }
                     {newProjectStatus==3 &&
                    <p className="text-lime-500 text-4xl p-5">Ce projet est terminé - vous pouvez demander votre remboursement</p>}
                    {(newProjectStatus == 2 & isOperator) &&
                        <div className="p-5 my-5 bg-orange-50 border rounded-md border-black border-solid">
                            <h1 className="text-xl text-green-800">Vous êtes opérateur de ce projet</h1>
                            <SimpleGetter funcName={totalAmountWithInterest} label={"Montant total à rembourser avec intérêts : "} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} giveState={setAmountWithInterest} >$</SimpleGetter>
                            <SimpleGetter funcName={balanceOf} label={"Solde du projet :  "} userAddress={userAddress} contract={STABLE} addressProp={projectSelected} refetchToggle={refetchToggle} argsProp={[projectSelected]} giveState={setProjectBalance} >$</SimpleGetter>

                            <SimpleSetter refetch={refetch} funcName={adminWithdraw} contract={PROJECT} contractAdressProp={projectSelected} label={"Retirer des fonds"} labelTitle={"Retirer"} labelPlaceHolder={"Montant à retirer"}>$</SimpleSetter>
                            <InvestInProject funcName={adminDeposit} refetch={refetch} userAddress={userAddress} projectAddress={projectSelected} label={"Déposer"} labelPlaceHolder={"Montant à déposer"}></InvestInProject>
                            <VerySimpleSetter refetch={refetch} funcName={finishProject} contract={PROJECT} contractAdressProp={projectSelected} label={"Terminer le projet"} labelTitle={"Cloturer"} disabledProp={newProjectBalance!=newAmountWithInterest}></VerySimpleSetter>
                        </div>
                    }
                    {(newProjectStatus == 3 & newUserBalance !=0) &&
                     <VerySimpleSetter refetch={refetch} funcName={claimFundsWithInterest} contract={PROJECT} contractAdressProp={projectSelected} label={"Retirer mes fonds avec intérêts"} labelTitle={"Retirer"} disabledProp={newProjectBalance!=newAmountWithInterest}></VerySimpleSetter>
                     }



                    {/* Statut du projet */}
                    <h3 className="text-[#706C61] text-xl p-5"> Statut du projet : </h3>
                    <div className="flex space-x-8">
                        {projectStates.map((state, index) => (
                            <div key={index}
                                className={`p-4 rounded-md text-center flex-1 ${index === newProjectStatus ? "bg-lime-800 text-white" : "bg-gray-200 text-gray-500"}`}>
                                {state}
                            </div>
                        ))}</div>
                    <p className="text-[#706C61] p-5">{projectSelected} </p>
                    <SilenceGetter funcName={projectStatus} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} giveState={setProjectStatus} > </SilenceGetter>
                    <SilenceGetter funcName={hasRole} userAddress={userAddress} contract={PROJECT} addressProp={projectSelected} refetchToggle={refetchToggle} giveState={setIsOperator} argsProp={[DEFAULT_ADMIN_ROLE, userAddress]}> </SilenceGetter>
                </div>}
        </div>
        </>)

}

export default Projects