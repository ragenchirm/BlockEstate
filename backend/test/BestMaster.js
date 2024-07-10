const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const keccak256 = require('keccak256')

describe("Best Master contract testing", function () {
  let bestMaster, stableContract,creator, user1, user2, user3;
  const STABLECOIN_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; //address of USDT contract
  const HOLDER_ADDRESS = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //address of binance whoe have several billions USDT
  const INITIAL_BEST_FEE_RATE = 100;
  const INITIAL_PROJECT_PRICE_IN_DOLLARS = 30;


  async function getStablecoinContractFixture() {
    stableContract = await hre.ethers.getContractAt("IERC20", STABLECOIN_ADDRESS);
  }

  async function fundTestUsersFixture() {
    const binanceImpersonatedSigner = await hre.ethers.getImpersonatedSigner(HOLDER_ADDRESS)
    let transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(creator, 1000000000000);
    await transactionStable.wait();
    transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(user1, 1000000000000);
    await transactionStable.wait();
    transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(user2, 1000000000000);
    await transactionStable.wait();
  }

  async function deployBestMasterFixture() {
    const BestMaster = await ethers.getContractFactory("BestMaster");
    bestMaster = await BestMaster.deploy(STABLECOIN_ADDRESS);
    return { bestMaster, creator, user1, user2, user3 };
  }

  before(async () => {
    [creator, user1, user2, user3] = await ethers.getSigners();
    await loadFixture(getStablecoinContractFixture);
    await loadFixture(fundTestUsersFixture);
  })

  beforeEach(async () => {
    const deployFixture = await loadFixture(deployBestMasterFixture);

    bestMaster = deployFixture.bestMaster;
    creator = deployFixture.creator;
    user1 = deployFixture.user1;
    user2 = deployFixture.user2;
    user3 = deployFixture.user3;
  });

  describe("Checks that Test Users are funded appropriately so the contract can be tested", function () {
    it("Holder account shoud have funds", async function () {
      let stableBalanceOfHolder = await stableContract.balanceOf(HOLDER_ADDRESS);
      expect(stableBalanceOfHolder).to.be.greaterThanOrEqual(1000000000000000n);
    })
    it("Creator account shoud have funds", async function () {
      let stableBalanceOfcreator = await stableContract.balanceOf(creator);
      expect(stableBalanceOfcreator).to.be.greaterThanOrEqual(1000000000000n);
    })
    it("User1 account shoud have funds", async function () {
      let stableBalanceOfUser1 = await stableContract.balanceOf(user1);
      expect(stableBalanceOfUser1).to.be.greaterThanOrEqual(1000000000000n);
    })
    it("User2 account shoud have funds", async function () {
      let stableBalanceOfUser2 = await stableContract.balanceOf(user2);
      expect(stableBalanceOfUser2).to.be.greaterThanOrEqual(1000000000000n);
    })
    it("User3 account shoud not have any funds", async function () {
      let stableBalanceOfUser3 = await stableContract.balanceOf(user3);
      expect(stableBalanceOfUser3).to.be.lessThanOrEqual(10000000n);
    })
  });

  describe("BestMaster contract deployment testing", function () {
    it("Should start with the right initial SUPER_ADMIN", async function () {
      let isContractDeployerSuperAdmin = await bestMaster.hasRole(keccak256("SUPER_ADMIN_ROLE"), creator);
      expect(isContractDeployerSuperAdmin).to.equal(true);
    })
    it("Should set the correct admin roles", async function () {
      expect(await bestMaster.hasRole(keccak256("SUPER_ADMIN_ROLE"), creator)).to.be.true;
    });

    it("Should initialize variables correctly", async function () {
      expect(await bestMaster.bestFeeRateIPB()).to.equal(INITIAL_BEST_FEE_RATE);
      expect(await bestMaster.projectPriceInDollars()).to.equal(INITIAL_PROJECT_PRICE_IN_DOLLARS);
      expect(await bestMaster.usdtContractAddress()).to.equal(STABLECOIN_ADDRESS);
    });
  });

  describe("Project Creation", function () {
    it("Should allow operator to create a project", async function () {
      await bestMaster.grantRole(keccak256("OPERATOR_ROLE"), creator);
      await stableContract.connect(creator).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS*1000000);

      await expect(bestMaster.connect(creator).createProject(1000000000, // _initialSupply
        1672531199, // _projectDeadline
        100, // _interestRateIPB
        "https://example.com", // _desc_link
        "Test Project" // _projectName
      )).to.emit(bestMaster, "ProjectCreated");

      const projectAddress = await bestMaster.bestProjectsAddresses(0);
      const project = await hre.ethers.getContractAt("BestProject", projectAddress);;

      expect(await project.name()).to.equal("Test Project");
    });
    it("Should reject project creation if not an operator", async function () {
      await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS*1000000);
      await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
        1672531199,// _projectDeadline
        500,//_interestRateIPB
        "https://example.com",//_desc_link
        "Test Project"//_projectName
      )).to.be.revertedWithCustomError(bestMaster,"AccessControlUnauthorizedAccount");
    });
  });
});
