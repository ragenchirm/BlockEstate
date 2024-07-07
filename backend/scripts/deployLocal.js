// Le module 'hardhat' est importé, ce qui vous permet d'interagir avec les fonctionnalités de Hardhat.
const hre = require("hardhat");

async function main() {

    const localUSDT = await hre.ethers.deployContract("TetherToken");
    await localUSDT.waitForDeployment();
    console.log(`TetherToken deployed to ${localUSDT.target}`);

    const BestMaster = await ethers.getContractFactory("BestMaster");
    const bestMaster = await BestMaster.deploy(localUSDT.target);
    console.log(`BestMaster deployed to ${bestMaster.target}`);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
