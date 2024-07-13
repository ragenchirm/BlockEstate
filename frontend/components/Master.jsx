"use client";
import { useState, useEffect } from "react";
import { keccak256 } from "viem";
import { useChainId, useReadContract } from "wagmi";
import AlertInfo from "./Alert/AlertInfo";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

import { contractMasterAddress, contractMasterAbi, contractStableAddress, contractStableAbi, contractProjectAbi, HARDHAT_EXPECTED_NETWORK_ID, SEPOLIA_EXPECTED_NETWORK_ID, HOLESKY_EXPECTED_NETWORK_ID, DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE, OPERATOR_ROLE, BLACKLIST_ROLE, MASTER, setProjectPriceInDollars, hasRole, usdtContractAddress, bestFeeRateIPB, projectPriceInDollars, setFeeRate, balanceOf, STABLE, grantRole } from "@/constants";

import SimpleSetter from "./SimpleSetter";
import SimpleGetter from "./SimpleGetter";
import SilenceGetter from "./SilenceGetter"
import CreateProject from "./CreateProject"



const Master = ({ userAddress, isConnected }) => {
  // Utiliser useChainId pour obtenir l'ID de la chaine & vérifier si nous sommes sur le bon réseau
  const chainId = useChainId();
  const isOnExpectedNetwork = (chainId === HARDHAT_EXPECTED_NETWORK_ID || chainId === SEPOLIA_EXPECTED_NETWORK_ID || chainId == HOLESKY_EXPECTED_NETWORK_ID);
  //refetch toggle
  const [refetchToggle, setRefetchToggle] = useState(false);
  //my states
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [isDefaultAdmin, setIsDefaultAdmin] = useState(null);
  const [isOperator, setIsOperator] = useState(null);
  const [isBlacklist, setIsBlacklist] = useState(null);
  const [userUSDTBalance, setUserUSDTBalance] = useState(null);
  const [contractUSDTBalance, setContractUSDTBalance] = useState(0);
  const [contractUSDTAddress, setContractUSDTAddress] = useState(null);
  const [feeRate, setFeeRateS]=useState(null);
  const [projectPriceInDol, setProjectPriceS]=useState(0);

  const refetchEverthing = () => {
    setRefetchToggle(!refetchToggle);
  }
  const setSuperAdmin = (_data) => {
    setIsSuperAdmin(_data);
  }
  const setDefaultAdmin = (_data) => {
    setIsDefaultAdmin(_data);
  }
  const setOperator = (_data) => {
    setIsOperator(_data);
  }
  const setBlacklist = (_data) => {
    setIsBlacklist(_data);
  }
  const setUserUsBalance = (_data) => {
    setUserUSDTBalance(_data);
  }
  const setUSDTcontractBalance = (_data) => {
    setContractUSDTBalance(_data);
  }
  const setUSDTcontractAdress = (_data) => {
    setContractUSDTAddress(_data);
  }
  const setFeeRate = (_data) => {
    setFeeRateS(_data);
  }
  const setProjectPrice = (_data) => {
    setProjectPriceS(_data);
  }


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
        <p className="text-[#706C61]">{isConnected ? `Vous êtes connecté avec : ${userAddress} et vous possèdez ${userUSDTBalance} USDT` : "You are not Connected"}</p>

        <SimpleGetter funcName={usdtContractAddress} label={"USDT address : "} userAddress={userAddress} contract={MASTER} giveState={setUSDTcontractAdress} refetchToggle={refetchToggle}></SimpleGetter>

        <div className="border rounded-md border-emerald-700 border-solid p-3 container mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <SimpleGetter funcName={balanceOf} argsProp={[contractMasterAddress]} label={"USDT Contract Balance : "} userAddress={userAddress} contract={STABLE} refetchToggle={refetchToggle} giveState={setUSDTcontractBalance}>$</SimpleGetter>
            <SimpleGetter funcName={projectPriceInDollars} argsProp={[]} label={"Project price : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setProjectPrice}>$</SimpleGetter>
            <SimpleGetter funcName={bestFeeRateIPB} argsProp={[]} label={"Marckup : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setFeeRate}>% sur Intérêt</SimpleGetter>
          </div></div>

        <p className="p-3">Voici vos rôles : Super Admin = {`${isSuperAdmin}`}, Administrateur fonctionnel = {`${isDefaultAdmin}`}, Opérateur = {`${isOperator}`}, Blacklist = {`${isBlacklist}`}</p>


        {/* DONNER DROITS D'ADMIN */}
        {(isSuperAdmin || isDefaultAdmin) &&
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isSuperAdmin &&
                <div className="border rounded-md border-red-700 border-solid p-3">
                  <SimpleSetter refetch={refetchEverthing} funcName={grantRole} contract={MASTER} labelTitle={"Donner droit d'administrateur fonctionnel"} label={"Donner droit d'admin"} labelPlaceHolder={"Addresse à autoriser"} argsProp={[DEFAULT_ADMIN_ROLE]}></SimpleSetter></div>}
              <div className="border rounded-md border-orange-400 border-solid p-3">
                {isDefaultAdmin &&
                  <div className=" p-3">
                    <SimpleSetter refetch={refetchEverthing} funcName={grantRole} contract={MASTER} labelTitle={"Whitelister opérateur"} label={"Autoriser addresse"} labelPlaceHolder={"Addresse opérateur"} argsProp={[OPERATOR_ROLE]}></SimpleSetter></div>}
                {isDefaultAdmin &&
                  <div className="p-3">
                    <SimpleSetter refetch={refetchEverthing} funcName={grantRole} contract={MASTER} labelTitle={"Blacklister une addresse"} label={"Blacklister addresse"} labelPlaceHolder={"Addresse à blacklister"} argsProp={[BLACKLIST_ROLE]}></SimpleSetter></div>}
              </div>
              <div className="border rounded-md border-orange-400 border-solid p-3">
                <div className=" p-3">
                  <SimpleSetter refetch={refetchEverthing} funcName={setProjectPriceInDollars} contract={MASTER} label={"Changer Prix"} labelTitle={"Changer prix projet"} labelPlaceHolder={"Nouveaux prix en $"}></SimpleSetter>
                </div>
                <div className=" p-3">
                  <SimpleSetter refetch={refetchEverthing} funcName={setFeeRate} contract={MASTER} label={"Changer Marckup"} labelTitle={"Marckup %"} labelPlaceHolder={"Nouveau marckup"}></SimpleSetter>
                </div>
              </div>
            </div>
                  <CreateProject refetch={refetchEverthing} bestFeeRate={feeRate} projectPriceInDol={projectPriceInDol} userAddress={userAddress} ></CreateProject>

          </div>}






        {/* SILENCE GETTERS */}
        <SilenceGetter funcName={hasRole} argsProp={[SUPER_ADMIN_ROLE, userAddress]} label={"Super Admin : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setSuperAdmin}></SilenceGetter>
        <SilenceGetter funcName={hasRole} argsProp={[DEFAULT_ADMIN_ROLE, userAddress]} label={"Admin : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setDefaultAdmin}></SilenceGetter>
        <SilenceGetter funcName={hasRole} argsProp={[OPERATOR_ROLE, userAddress]} label={"Operateur : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setOperator}></SilenceGetter>
        <SilenceGetter funcName={hasRole} argsProp={[BLACKLIST_ROLE, userAddress]} label={"Blacklist : "} userAddress={userAddress} contract={MASTER} refetchToggle={refetchToggle} giveState={setBlacklist}></SilenceGetter>
        <SilenceGetter funcName={balanceOf} argsProp={[userAddress]} userAddress={userAddress} contract={STABLE} refetchToggle={refetchToggle} giveState={setUserUsBalance}>$</SilenceGetter >
      </div>
      <AlertInfo chainId={chainId} />
    </div>
  );
};

export default Master;
