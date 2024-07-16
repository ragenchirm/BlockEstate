// Le module 'hardhat' est importé, ce qui vous permet d'interagir avec les fonctionnalités de Hardhat.
const hre = require("hardhat");
const keccak256 = require('keccak256')
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    let stableContractOwner, stableOwnerImpersonatedSigner, superAdmin, user1, user2, user3, SUPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, BLACKLIST_ROLE, STABLECOIN_ADDRESS, HOLDER_ADDRESS, INITIAL_PROJECT_PRICE_IN_DOLLARS, INITIAL_SUPPLY, TWOxINITIAL_SUPPLY, HALF_INITIAL_SUPPLY, PROJECT_DEADLINE, INTEREST_RATE_IPB, BEST_FEE_RATE_IPB, DESC_LINK, PROJECT_NAME, ACCURACY_MARGIN, WrongProjectStatusError, USDTTransferError, UserBlacklistedError, TooMuchError, UserInvested, UserAskedForARefund, UserClaimedFunds, ProjectStatusChange, FundsWithdrawalByAdmin, FundsDepositedByAdmin, NotEnoughFundsError, WithdrawalIsTooBigError, ProjectNotRefundedError, AccessControlUnauthorizedAccount;

    async function initializeVariableFixture() {
        SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
        DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
        BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
        STABLECOIN_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; //address of USDT contract
        stableContractOwner = "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828"
        HOLDER_ADDRESS = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //address of binance whoe have several billions USDT
        INITIAL_PROJECT_PRICE_IN_DOLLARS = 30n;
        INITIAL_SUPPLY = 2000000000n;
        TWOxINITIAL_SUPPLY = 2000000000n;
        HALF_INITIAL_SUPPLY = 1000000000n;
        PROJECT_DEADLINE = 750n;
        INTEREST_RATE_IPB = 1000n;
        BEST_FEE_RATE_IPB = 1000n;
        DESC_LINK = "https://best-project.com";
        PROJECT_NAME = "My Best Project";
        ACCURACY_MARGIN = 150000n; // margin of accuracy for interest calculus set at 0.15$ (15 cents)
        WrongProjectStatusError = "WrongProjectStatusError";
        USDTTransferError = "USDTTransferError";
        UserBlacklistedError = "UserBlacklistedError";
        TooMuchError = "TooMuchError";
        UserInvested = "UserInvested";
        UserAskedForARefund = "UserAskedForARefund";
        UserClaimedFunds = "UserClaimedFunds";
        ProjectStatusChange = "ProjectStatusChange";
        FundsWithdrawalByAdmin = "FundsWithdrawalByAdmin";
        FundsDepositedByAdmin = "FundsDepositedByAdmin";
        NotEnoughFundsError = "NotEnoughFundsError";
        WithdrawalIsTooBigError = "WithdrawalIsTooBigError";
        ProjectNotRefundedError = "ProjectNotRefundedError";
        AccessControlUnauthorizedAccount = "AccessControlUnauthorizedAccount";
        stableOwnerImpersonatedSigner = await hre.ethers.getImpersonatedSigner(stableContractOwner);
        [superAdmin, user1, user2, user3] = await ethers.getSigners();
    }

    // deploy contract stablecoin
    const stableContract = await hre.ethers.deployContract("contracts/external/LocalUSDT.sol:TetherToken");
    await stableContract.waitForDeployment();
    console.log(`TetherToken deployed to ${stableContract.target}`);

    // deploy contract BestMaster
    const BestMaster = await ethers.getContractFactory("BestMaster");
    const bestMaster = await BestMaster.deploy(stableContract.target);
    console.log(`BestMaster deployed to ${bestMaster.target}`);

    //initialize Valirables
    await initializeVariableFixture();

    // SEEDING STARTS HERE
    //ROLES
    //Give operator roles to superAdmin  & user1
    await bestMaster.grantRole(OPERATOR_ROLE, superAdmin);
    await bestMaster.grantRole(OPERATOR_ROLE, user1);

    //PROJECT CREATIONS
    ////Project 1 : super admin creates one project
    await stableContract.approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
    await bestMaster.createProject(INITIAL_SUPPLY, // _initialSupply
        PROJECT_DEADLINE, // _projectDeadline
        INTEREST_RATE_IPB, // _interestRateIPB
        DESC_LINK, // _desc_link
        PROJECT_NAME + " 1" // _projectName
    )
    ////Project 2 : super admin creates a second project
    await stableContract.approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
    await bestMaster.createProject(INITIAL_SUPPLY, // _initialSupply
        PROJECT_DEADLINE, // _projectDeadline
        INTEREST_RATE_IPB + 100n, // _interestRateIPB
        DESC_LINK, // _desc_link
        PROJECT_NAME + " 2" // _projectName
    )
    ////Project 3 : user1 creates one project
    await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
    await bestMaster.connect(user1).createProject(INITIAL_SUPPLY, // _initialSupply
        PROJECT_DEADLINE, // _projectDeadline
        INTEREST_RATE_IPB + 200n, // _interestRateIPB
        DESC_LINK, // _desc_link
        PROJECT_NAME + " 3" // _projectName
    )

    ////Project 4 : superadmin creates a second project
    await stableContract.approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
    await bestMaster.createProject(INITIAL_SUPPLY, // _initialSupply
        PROJECT_DEADLINE, // _projectDeadline
        INTEREST_RATE_IPB, // _interestRateIPB
        DESC_LINK, // _desc_link
        PROJECT_NAME + " 4" // _projectName
    )

    //LET'S GET OUR CREATED PROJECTS
    let projectAddress = await bestMaster.bestProjectsAddresses(0);
    const project1Superadmin = await hre.ethers.getContractAt("BestProject", projectAddress);
    projectAddress = await bestMaster.bestProjectsAddresses(1);
    const project2Superadmin = await hre.ethers.getContractAt("BestProject", projectAddress);
    projectAddress = await bestMaster.bestProjectsAddresses(2);
    const project1User1 = await hre.ethers.getContractAt("BestProject", projectAddress);
    projectAddress = await bestMaster.bestProjectsAddresses(3);
    const project3SuperAdmin = await hre.ethers.getContractAt("BestProject", projectAddress);

    //LET'S APPROVE WHAT WERE GONNE PAY
    await stableContract.approve(project1Superadmin, HALF_INITIAL_SUPPLY);
    await stableContract.approve(project2Superadmin, HALF_INITIAL_SUPPLY);
    await stableContract.approve(project1User1, HALF_INITIAL_SUPPLY);
    await stableContract.approve(project3SuperAdmin, HALF_INITIAL_SUPPLY);
    await stableContract.connect(user1).approve(project2Superadmin, HALF_INITIAL_SUPPLY);
    await stableContract.connect(user1).approve(project1User1, HALF_INITIAL_SUPPLY);
    await stableContract.connect(user1).approve(project3SuperAdmin, HALF_INITIAL_SUPPLY);

    //LET'S INVEST IN PROJECTS
    //Project 1: Invest a little bit
    await project1Superadmin.investInProject(HALF_INITIAL_SUPPLY);
    //Project 2: Invest enough to automatically launch project
    await project2Superadmin.investInProject(HALF_INITIAL_SUPPLY);
    await project2Superadmin.connect(user1).investInProject(HALF_INITIAL_SUPPLY);

    //Project 3: Invest enough to automatically launch project
    await project1User1.investInProject(HALF_INITIAL_SUPPLY);
    await project1User1.connect(user1).investInProject(HALF_INITIAL_SUPPLY);
    //Project 4: Invest enough to automatically launch project
    await project3SuperAdmin.investInProject(HALF_INITIAL_SUPPLY);
    await project3SuperAdmin.connect(user1).investInProject(HALF_INITIAL_SUPPLY);

  


    //Let time pass to show interest calculations
    await time.increase(86400 * 730); // Two years

      // For demonstration's purpose, we need to set superadmin balance to a easyly readable round number
      let amountToRetrieveFromSuperAdmin = await stableContract.balanceOf(superAdmin);
      const interest=await project3SuperAdmin.totalAmountWithInterest()
      amountToRetrieveFromSuperAdmin = amountToRetrieveFromSuperAdmin - 1000000000000n -interest + INITIAL_SUPPLY
      await stableContract.transfer(user1, amountToRetrieveFromSuperAdmin);

    // LET'S FINISH PROJECT 4
    // Operator of project 4 (user1) needs to add some interests to the project balance 
    // await stableContract.approve(project3SuperAdmin, HALF_INITIAL_SUPPLY);
    // await stableContract.transfer(project3SuperAdmin, HALF_INITIAL_SUPPLY);
    // Finish last project
    //await project2User1.connect(user1).finishProject();

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
