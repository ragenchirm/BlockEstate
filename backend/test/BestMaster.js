const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const keccak256 = require('keccak256')

describe("Block Estate contract testing", function () {
  let bestMaster, stableContract, superAdmin, user1, user2, user3;
  const SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  const BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
  const STABLECOIN_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; //address of USDT contract
  const HOLDER_ADDRESS = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //address of binance whoe have several billions USDT
  const INITIAL_BEST_FEE_RATE = 100;
  const INITIAL_PROJECT_PRICE_IN_DOLLARS = 30;


  async function getStablecoinContractFixture() {
    stableContract = await hre.ethers.getContractAt("IERC20", STABLECOIN_ADDRESS);
  }

  async function fundTestUsersFixture() {
    const binanceImpersonatedSigner = await hre.ethers.getImpersonatedSigner(HOLDER_ADDRESS)
    let transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(superAdmin, 1000000000000);
    await transactionStable.wait();
    transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(user1, 1000000000000);
    await transactionStable.wait();
    transactionStable = await stableContract.connect(binanceImpersonatedSigner).transfer(user2, 1000000000000);
    await transactionStable.wait();
  }

  async function deployBestMasterFixture() {
    const BestMaster = await ethers.getContractFactory("BestMaster");
    bestMaster = await BestMaster.deploy(STABLECOIN_ADDRESS);
    return { bestMaster };
  }

  before(async () => {
    [superAdmin, user1, user2, user3] = await ethers.getSigners();
    await loadFixture(getStablecoinContractFixture);
    await loadFixture(fundTestUsersFixture);
  })

  beforeEach(async () => {
    const deployFixture = await loadFixture(deployBestMasterFixture);
    bestMaster = deployFixture.bestMaster;
  });
  describe("Best Master contract testing", function () {


    describe("Checks that Test Users are funded appropriately so the contract can be tested", function () {
      it("Holder account shoud have funds", async function () {
        let stableBalanceOfHolder = await stableContract.balanceOf(HOLDER_ADDRESS);
        expect(stableBalanceOfHolder).to.be.greaterThanOrEqual(1000000000000000n);
      })
      it("Creator account shoud have funds", async function () {
        let stableBalanceOfcreator = await stableContract.balanceOf(superAdmin);
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
        let isContractDeployerSuperAdmin = await bestMaster.hasRole(SUPER_ADMIN_ROLE, superAdmin);
        expect(isContractDeployerSuperAdmin).to.equal(true);
      })
      it("Should set the correct admin roles", async function () {
        expect(await bestMaster.hasRole(SUPER_ADMIN_ROLE, superAdmin)).to.be.true;
      });

      it("Should initialize variables correctly", async function () {
        expect(await bestMaster.bestFeeRateIPB()).to.equal(INITIAL_BEST_FEE_RATE);
        expect(await bestMaster.projectPriceInDollars()).to.equal(INITIAL_PROJECT_PRICE_IN_DOLLARS);
        expect(await bestMaster.usdtContractAddress()).to.equal(STABLECOIN_ADDRESS);
      });
    });

    describe("Project Creation", function () {
      it("Should allow operator to create a project", async function () {
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000);

        await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
          1672531199, // _projectDeadline
          100, // _interestRateIPB
          "https://example.com", // _desc_link
          "Test Project" // _projectName
        )).to.emit(bestMaster, "ProjectCreated");

        const projectAddress = await bestMaster.bestProjectsAddresses(0);
        const project = await hre.ethers.getContractAt("BestProject", projectAddress);;

        expect(await project.name()).to.equal("Test Project");
      });
      it("Should reject project creation if project price hasn't been paid", async function () {
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
          1672531199, // _projectDeadline
          100, // _interestRateIPB
          "https://example.com", // _desc_link
          "Test Project" // _projectName
        )).to.be.revertedWith("Project price hasn't been paid");
      });
      it("Should reject project creation if not an operator", async function () {
        await stableContract.connect(superAdmin).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000);
        await expect(bestMaster.connect(superAdmin).createProject(1000000000, // _initialSupply
          1672531199,// _projectDeadline
          500,//_interestRateIPB
          "https://example.com",//_desc_link
          "Test Project"//_projectName
        )).to.be.revertedWithCustomError(bestMaster, "AccessControlUnauthorizedAccount");
      });
      it("Should reject project creation if operator blacklisted", async function () {
        await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000);
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await bestMaster.grantRole(BLACKLIST_ROLE, user1);
        await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
          1672531199,// _projectDeadline
          500,//_interestRateIPB
          "https://example.com",//_desc_link
          "Test Project"//_projectName
        )).to.be.revertedWithCustomError(bestMaster, "UserBlacklistedError");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow super admin to withdraw funds", async function () {
        const initialBalance = await stableContract.balanceOf(superAdmin);
        await stableContract.transfer(bestMaster, 50000000);
        await expect(bestMaster.adminWithdraw(40000000)).to.emit(bestMaster, "FundsWithdrawalByAdmin").withArgs(superAdmin, 40000000n);
        expect(await stableContract.balanceOf(superAdmin)).to.equal(initialBalance - 10000000n);
      });
      it("Should revert if super admin withdraw too much", async function () {
        await stableContract.transfer(bestMaster, 10000000);
        await expect(bestMaster.adminWithdraw(10000001)).to.be.revertedWithCustomError(bestMaster, "USDTTransferError").withArgs(bestMaster, superAdmin, 10000001n);
      });


      it("Should not allow non-super admin to withdraw funds", async function () {
        await expect(bestMaster.connect(user1).adminWithdraw(50000000))
          .to.be.revertedWithCustomError(bestMaster, "AccessControlUnauthorizedAccount");
      });

      it("Should allow admin to set project price", async function () {
        await bestMaster.setProjectPriceInDollars(40);
        expect(await bestMaster.projectPriceInDollars()).to.equal(40);
      });

      it("Should not allow non admin to set project price", async function () {
        await bestMaster.renounceRole(DEFAULT_ADMIN_ROLE, superAdmin);
        await expect(bestMaster.setProjectPriceInDollars(40)).to.be.revertedWithCustomError(bestMaster, "AccessControlUnauthorizedAccount");
      });



      it("Should reject setting fee rate above 99%", async function () {
        await expect(bestMaster.setFeeRate(100)).to.be.revertedWith("Can't set more than a 99% fee");
      });

      it("Should allow admin to set fee rate", async function () {
        await bestMaster.setFeeRate(50);
        expect(await bestMaster.bestFeeRateIPB()).to.equal(50);
      });
      it("Should not allow not admin to set fee rate", async function () {
        await expect(bestMaster.connect(user1).setFeeRate(50)).to.be.revertedWithCustomError(bestMaster, "AccessControlUnauthorizedAccount")
      });
    });

    describe("Access Control", function () {
      it("Should prevent blacklist role from creating projects", async function () {
        await bestMaster.grantRole(BLACKLIST_ROLE, user1);
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await stableContract.connect(user1).approve(bestMaster, 30000000);

        await expect(bestMaster.connect(user1).createProject(1000000000, 1672531199, 500, "https://example.com", "Test Project")).to.be.revertedWithCustomError(bestMaster, "UserBlacklistedError");
      });

      it("Should revert if failing to confirm address when renouncing role", async function () {
        await expect(bestMaster.renounceRole(DEFAULT_ADMIN_ROLE, user1))
          .to.be.revertedWithCustomError(bestMaster, "AccessControlBadConfirmation");
      });
      it("Should revert if not role admin", async function () {
        await bestMaster.renounceRole(DEFAULT_ADMIN_ROLE, superAdmin);
        await expect(bestMaster.revokeRole(OPERATOR_ROLE, superAdmin))
          .to.be.revertedWithCustomError(bestMaster, "AccessControlUnauthorizedAccount");
      });
      it("Should prevent renouncing of SUPER_ADMIN_ROLE", async function () {
        await expect(bestMaster.renounceRole(SUPER_ADMIN_ROLE, superAdmin))
          .to.be.revertedWith("Can't renounce Super Admin role");
      });
      it("Should prevent renouncing of BLACKLIST_ROLE", async function () {
        await expect(bestMaster.renounceRole(BLACKLIST_ROLE, superAdmin))
          .to.be.revertedWith("Can't renounce Blacklist role");
      });

      it("Should prevent revoking of own SUPER_ADMIN_ROLE", async function () {
        await expect(bestMaster.revokeRole(SUPER_ADMIN_ROLE, superAdmin))
          .to.be.revertedWith("Can't self revoke Super Admin role");
      });
      it("Should allow revoking of other's SUPER_ADMIN_ROLE", async function () {
        await bestMaster.grantRole(SUPER_ADMIN_ROLE, user1);
        await bestMaster.connect(user1).revokeRole(SUPER_ADMIN_ROLE, superAdmin);
        expect(await bestMaster.hasRole(SUPER_ADMIN_ROLE, superAdmin)).to.equal(false);

      });
    });
  });
});
