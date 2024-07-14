import { STABLE, MASTER, PROJECT, contractMasterAbi, contractMasterAddress, contractStableAbi, contractStableAddress, contractProjectAbi, bestFeeRateIPB, projectPriceInDollars, balanceOf, interestRateIPB, totalSupply, allowed, totalAmountWithInterest, bestProjectsAddresses, name, projectDeadline, desc_link } from "@/constants";
import { useReadContract, useAccount } from "wagmi";
import { useEffect, useState } from "react";
import SimpleGetter from "./SimpleGetter";

const Projects = ({ refetchToggle }) => {

    let [projectIndex, setProjectIndex] = useState(0);
    const [project, setProject] = useState();
    const [projects, setProjects] = useState([]);
    const { userAddress, isConnected } = useAccount();

    const { data: getProject, error: projectError, isLoading: isProjectLoading, refetch: refetchProject } = useReadContract({
        abi: contractMasterAbi,
        address: contractMasterAddress,
        functionName: bestProjectsAddresses,
        args: [projectIndex],
        account: userAddress
    });




    const refetchAProject = async () => {
        await refetchProject();
    };

    useEffect(() => {
        if (projectError) {
            console.log('Proposal error, on s\'arrete' + (projectError.shortMessage || projectError.message))
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

    const handleClickProject = async ()=>{
        console.log("OCUCOU")
    }



    return (
        <><div className="my-5">
            <h2 className="text-xl">Voici la liste des projets :</h2>
            <ol class="container mx-auto px-4">

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {projects.map((_projAdr, i) => (
                        <li className="bg-orange-50 text-[#F8F4E3] mx-4 my-3 rounded px-5 flex justify-between items-center w-full"  key={_projAdr} onClick={handleClickProject}>
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
        </div>
        </>)

}

export default Projects