const { loadFixture, time, anyValue } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const keccak256 = require('keccak256')

describe("BLOCK ESTATE CONTRACTS TESTING", function () {
  let bestMaster, bestProject, stableContract, stableContractOwner, stableOwnerImpersonatedSigner, superAdmin, user1, user2, user3, SUPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, BLACKLIST_ROLE, STABLECOIN_ADDRESS, HOLDER_ADDRESS, INITIAL_PROJECT_PRICE_IN_DOLLARS, INITIAL_SUPPLY, TWOxINITIAL_SUPPLY, HALF_INITIAL_SUPPLY, PROJECT_DEADLINE, INTEREST_RATE_IPB, BEST_FEE_RATE_IPB, DESC_LINK, PROJECT_NAME, ACCURACY_MARGIN, WrongProjectStatusError, USDTTransferError, UserBlacklistedError, TooMuchError, UserInvested, UserAskedForARefund, UserClaimedFunds, ProjectStatusChange, FundsWithdrawalByAdmin, FundsDepositedByAdmin, NotEnoughFundsError, WithdrawalIsTooBigError, ProjectNotRefundedError, AccessControlUnauthorizedAccount;

  async function initializeVariableFixture() {
    SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    STABLECOIN_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; //address of USDT contract
    stableContractOwner = "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828"
    HOLDER_ADDRESS = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //address of binance whoe have several billions USDT
    INITIAL_PROJECT_PRICE_IN_DOLLARS = 30n;
    INITIAL_SUPPLY = 1000000000n;
    TWOxINITIAL_SUPPLY = 2000000000n;
    HALF_INITIAL_SUPPLY = 500000000n;
    PROJECT_DEADLINE = 1672531199n;
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
    AccessControlUnauthorizedAccount="AccessControlUnauthorizedAccount";
    stableOwnerImpersonatedSigner = await hre.ethers.getImpersonatedSigner(stableContractOwner);
    [superAdmin, user1, user2, user3] = await ethers.getSigners();
  }
  async function approveProjectForUsersFixture() {
    await stableContract.approve(bestProject.target, 0);
    await stableContract.approve(bestProject.target, TWOxINITIAL_SUPPLY);
    await stableContract.connect(user1).approve(bestProject.target, 0);
    await stableContract.connect(user1).approve(bestProject.target, TWOxINITIAL_SUPPLY);
    await stableContract.connect(user2).approve(bestProject.target, 0);
    await stableContract.connect(user2).approve(bestProject.target, TWOxINITIAL_SUPPLY);
  }
  async function getStablecoinContractFixture() {
    stableContract = await hre.ethers.getContractAt("contracts/external/RegularUSDT.sol:TetherToken", STABLECOIN_ADDRESS);
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
  async function deployBestProjectFixture() {
    const BestProject = await ethers.getContractFactory("BestProject");
    bestProject = await BestProject.deploy(
      superAdmin, //project creator address
      bestMaster,//TO CHANGE MASTER CONTRACT ADDRESS
      STABLECOIN_ADDRESS, //stablecoin contract address
      INITIAL_SUPPLY, // _initialSupply
      PROJECT_DEADLINE, // _projectDeadline
      INTEREST_RATE_IPB, // _interestRateIPB
      BEST_FEE_RATE_IPB, // bestFeeRateIPB
      DESC_LINK, // _desc_link
      PROJECT_NAME // _projectName
    );

  }


  before(async () => {
    await loadFixture(initializeVariableFixture);

    await loadFixture(getStablecoinContractFixture);
    await loadFixture(fundTestUsersFixture);
    await loadFixture(deployBestMasterFixture);
  })



  describe("Best Master contract testing", function () {
    beforeEach(async () => {
      await loadFixture(deployBestMasterFixture);
    });
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
        expect(await bestMaster.bestFeeRateIPB()).to.equal(BEST_FEE_RATE_IPB);
        expect(await bestMaster.projectPriceInDollars()).to.equal(INITIAL_PROJECT_PRICE_IN_DOLLARS);
        expect(await bestMaster.usdtContractAddress()).to.equal(STABLECOIN_ADDRESS);
      });
    });

    describe("Project Creation", function () {
      it("Should allow operator to create a project", async function () {
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);

        await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
          1672531199, // _projectDeadline
          100, // _interestRateIPB
          "https://example.com", // _desc_link
          "Test Project" // _projectName
        )).to.emit(bestMaster, "ProjectCreated");

        const projectAddress = await bestMaster.bestProjectsAddresses(0);
        const project = await hre.ethers.getContractAt("BestProject", projectAddress);

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
        await stableContract.approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
        await expect(bestMaster.createProject(1000000000, // _initialSupply
          1672531199,// _projectDeadline
          500,//_interestRateIPB
          "https://example.com",//_desc_link
          "Test Project"//_projectName
        )).to.be.revertedWithCustomError(bestMaster, AccessControlUnauthorizedAccount);
      });
      it("Should reject project creation if operator blacklisted", async function () {
        await stableContract.connect(user1).approve(bestMaster, INITIAL_PROJECT_PRICE_IN_DOLLARS * 1000000n);
        await bestMaster.grantRole(OPERATOR_ROLE, user1);
        await bestMaster.grantRole(BLACKLIST_ROLE, user1);
        await expect(bestMaster.connect(user1).createProject(1000000000, // _initialSupply
          1672531199,// _projectDeadline
          500,//_interestRateIPB
          "https://example.com",//_desc_link
          "Test Project"//_projectName
        )).to.be.revertedWithCustomError(bestMaster, UserBlacklistedError);
      });
    });

    describe("Admin Functions", function () {
      it("Should allow super admin to withdraw funds", async function () {
        const initialBalance = await stableContract.balanceOf(superAdmin);
        await stableContract.transfer(bestMaster, 50000000);
        await expect(bestMaster.adminWithdraw(40000000)).to.emit(bestMaster, FundsWithdrawalByAdmin).withArgs(superAdmin, 40000000n);
        expect(await stableContract.balanceOf(superAdmin)).to.equal(initialBalance - 10000000n);
      });
      it("Should revert if super admin withdraw too much", async function () {
        await stableContract.transfer(bestMaster, 10000000);
        await expect(bestMaster.adminWithdraw(10000001)).to.be.revertedWithCustomError(bestMaster, USDTTransferError).withArgs(bestMaster, superAdmin, 10000001n);
      });


      it("Should not allow non-super admin to withdraw funds", async function () {
        await expect(bestMaster.connect(user1).adminWithdraw(50000000))
          .to.be.revertedWithCustomError(bestMaster, AccessControlUnauthorizedAccount);
      });

      it("Should allow admin to set project price", async function () {
        await bestMaster.setProjectPriceInDollars(40);
        expect(await bestMaster.projectPriceInDollars()).to.equal(40);
      });

      it("Should not allow non admin to set project price", async function () {
        await bestMaster.renounceRole(DEFAULT_ADMIN_ROLE, superAdmin);
        await expect(bestMaster.setProjectPriceInDollars(40)).to.be.revertedWithCustomError(bestMaster, AccessControlUnauthorizedAccount);
      });



      it("Should reject setting fee rate above 99%", async function () {
        await expect(bestMaster.setFeeRate(10000)).to.be.revertedWith("Can't set more than a 99% fee");
      });

      it("Should allow admin to set fee rate", async function () {
        await bestMaster.setFeeRate(50);
        expect(await bestMaster.bestFeeRateIPB()).to.equal(50);
      });
      it("Should not allow not admin to set fee rate", async function () {
        await expect(bestMaster.connect(user1).setFeeRate(50)).to.be.revertedWithCustomError(bestMaster, AccessControlUnauthorizedAccount)
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
          .to.be.revertedWithCustomError(bestMaster, AccessControlUnauthorizedAccount);
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

  describe("Best Project contract testing", function () {
    beforeEach(async () => {
      await loadFixture(deployBestProjectFixture);
      await loadFixture(approveProjectForUsersFixture);
    })
    describe("Initial State", function () {
      it("Should return My Best Project as name() ", async function () {
        expect(await bestProject.name()).to.equal("My Best Project");
      })
      it("Should return 6 Decimals", async function () {
        expect(await bestProject.decimals()).to.equal(6n);
      })

      it("should set the correct project creator", async function () {
        expect(await bestProject.hasRole(DEFAULT_ADMIN_ROLE, superAdmin)).to.equal(true);
      });

      it("should mint initial supply to the contract", async function () {
        expect(await bestProject.balanceOf(bestProject)).to.equal(INITIAL_SUPPLY);
      });
      it("should get the correct total supply ", async function () {
        expect(await bestProject.totalSupply()).to.equal(INITIAL_SUPPLY); // Crowdfunding
      });

      it("should set the correct project status", async function () {
        expect(await bestProject.projectStatus()).to.equal(0); // Crowdfunding
      });
      it("should get the correct stable contract address", async function () {
        expect(await bestProject.usdtContractAddress()).to.equal(STABLECOIN_ADDRESS); // Crowdfunding
      });
      it("should not allow admin to withdraw funds if status is not launched or finished", async function () {
        bestProject.investInProject(HALF_INITIAL_SUPPLY);
        await expect(bestProject.adminWithdraw(INITIAL_SUPPLY))
          .to.be.revertedWithCustomError(bestProject,WrongProjectStatusError);
      });
      it("should not allow admin to deposit funds when project not launched", async function () {
        await expect(bestProject.adminDeposit(HALF_INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, WrongProjectStatusError)
      });
      it("should not allow admin to finish project when project not launched", async function () {
        await expect(bestProject.finishProject()).to.be.revertedWithCustomError(bestProject,WrongProjectStatusError);
      });
      it("should not allow users to claim funds if project not finished", async function () {
        await expect(bestProject.connect(user1).claimFundsWithInterest()).to.be.revertedWithCustomError(bestProject, WrongProjectStatusError)
        expect(await bestProject.balanceOf(user1)).to.equal(0n);
      });
    });

    describe("Invest in Project", function () {
      it("should allow users to invest in the project", async function () {
        let initialStableBalance = await stableContract.balanceOf(user2);
        await expect(bestProject.connect(user2).investInProject(50000000)).to.emit(bestProject, UserInvested).withArgs(user2, 50000000);
        expect(await bestProject.balanceOf(user2)).to.equal(50000000n);
        expect(initialStableBalance - await stableContract.balanceOf(user2)).to.equal(50000000n);
      });
      it("should not allow blacklisted users to invest in the project", async function () {
        await bestProject.grantRole(BLACKLIST_ROLE, user2);
        await expect(bestProject.connect(user2).investInProject(50000000)).to.be.revertedWithCustomError(bestProject, UserBlacklistedError).withArgs(user2);
      });
      it("should not allow users to invest in the project if status is not Crowdfunding", async function () {
        await bestProject.investInProject(INITIAL_SUPPLY);
        await expect(bestProject.connect(user2).investInProject(50000000)).to.be.revertedWithCustomError(bestProject, WrongProjectStatusError).withArgs(2n);
      });
      it("should not allow users to invest too much in the project", async function () {
        await expect(bestProject.connect(user2).investInProject(INITIAL_SUPPLY + 1n)).to.be.revertedWithCustomError(bestProject, TooMuchError).withArgs(INITIAL_SUPPLY, INITIAL_SUPPLY + 1n);
      });
      it("should not revert if user fail to invest in the project", async function () {
        await expect(bestProject.connect(user3).investInProject(INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, USDTTransferError).withArgs(user3, bestProject, INITIAL_SUPPLY);
      });

      it("should lauch project automatiquely when Total Supply is funded Crowdfunding status", async function () {
        await expect(bestProject.connect(user1).investInProject(INITIAL_SUPPLY)).to.emit(bestProject, UserInvested).withArgs(user1, INITIAL_SUPPLY);
        expect(await bestProject.projectStatus()).to.equal(2n);
      });

      it("should not allow investments when project is not in Crowdfunding status", async function () {
        await expect(bestProject.connect(user1).investInProject(INITIAL_SUPPLY)).to.emit(bestProject, UserInvested).withArgs(user1, INITIAL_SUPPLY);
        await expect(bestProject.connect(user1).investInProject(50000000)).to.be.revertedWithCustomError(bestProject, WrongProjectStatusError);
      });
    });

    describe("Ask for Refund", function () {
      beforeEach(async function () {
        await bestProject.connect(user1).investInProject(HALF_INITIAL_SUPPLY);
      });
      it("should allow users to ask for a refund", async function () {
        await expect(bestProject.connect(user1).askForARefund(HALF_INITIAL_SUPPLY)).to.emit(bestProject, UserAskedForARefund).withArgs(user1, HALF_INITIAL_SUPPLY);
        expect(await bestProject.balanceOf(user1)).to.equal(0);
      });
      it("should revert if refund doesn't work", async function () {
        await stableContract.connect(stableOwnerImpersonatedSigner).pause();
        await expect(bestProject.connect(user1).askForARefund(HALF_INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, USDTTransferError).withArgs(bestProject, user1, HALF_INITIAL_SUPPLY);
      });
      it("should not allow users to ask for a too big refund", async function () {
        await expect(bestProject.connect(user1).askForARefund(HALF_INITIAL_SUPPLY + 1n)).to.be.revertedWithCustomError(bestProject, NotEnoughFundsError).withArgs(user1, HALF_INITIAL_SUPPLY + 1n);
        expect(await bestProject.balanceOf(user1)).to.equal(HALF_INITIAL_SUPPLY);
      });
      it("should not allow blacklisted users to ask for a refund", async function () {
        await bestProject.grantRole(BLACKLIST_ROLE, user1)
        await expect(bestProject.connect(user1).askForARefund(HALF_INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, UserBlacklistedError).withArgs(user1);

      });

      it("should not allow refunds when project is not in Crowdfunding or Canceled status", async function () {
        await bestProject.connect(user1).investInProject(HALF_INITIAL_SUPPLY);
        await expect(bestProject.connect(user1).askForARefund(HALF_INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, WrongProjectStatusError);
      });
    });

    describe("Admin Withdraw and Deposit", function () {
      beforeEach(async function () {
        await bestProject.investInProject(INITIAL_SUPPLY);
      });

      it("should allow admin to withdraw funds", async function () {
        await expect(bestProject.adminWithdraw(INITIAL_SUPPLY))
          .to.emit(bestProject, FundsWithdrawalByAdmin)
          .withArgs(superAdmin, INITIAL_SUPPLY);
      });

      it("should not allow user not admin to withdraw funds", async function () {
        await expect(bestProject.connect(user1).adminWithdraw(INITIAL_SUPPLY))
          .to.be.revertedWithCustomError(bestProject,AccessControlUnauthorizedAccount);
      });
      it("should revert if withdrawl doesn't work", async function () {
        await stableContract.connect(stableOwnerImpersonatedSigner).pause();
        await expect(bestProject.adminWithdraw(INITIAL_SUPPLY))
          .to.be.revertedWithCustomError(bestProject,USDTTransferError);
      });
     

      it("should not allow admin to withdraw too much funds when project finished", async function () {
        await expect(bestProject.finishProject()).to.emit(bestProject, ProjectStatusChange).withArgs(2n, 3n);
        await expect(bestProject.adminWithdraw(1n))
          .to.be.revertedWithCustomError(bestProject, WithdrawalIsTooBigError)
          .withArgs(0n, 1n);
      });

      it("should allow admin to deposit funds", async function () {
        await expect(bestProject.adminWithdraw(INITIAL_SUPPLY))
          .to.emit(bestProject, FundsWithdrawalByAdmin)
          .withArgs(superAdmin, INITIAL_SUPPLY);
        await bestProject.adminDeposit(HALF_INITIAL_SUPPLY);
        expect(await stableContract.balanceOf(bestProject)).to.equal(HALF_INITIAL_SUPPLY);
      });
      it("should revert if deposit doesn't work", async function () {
        await stableContract.connect(stableOwnerImpersonatedSigner).pause();
        await expect(bestProject.adminDeposit(INITIAL_SUPPLY))
          .to.be.revertedWithCustomError(bestProject,USDTTransferError);
      });
      it("should not allow non admin to deposit funds when project launched", async function () {
        await expect(bestProject.connect(user1).adminDeposit(HALF_INITIAL_SUPPLY)).to.be.revertedWithCustomError(bestProject, AccessControlUnauthorizedAccount)
      });
      

      it("should not allow to finish project if not enough funds for refund with interest", async function () {
        await expect(bestProject.adminWithdraw(INITIAL_SUPPLY)).to.emit(bestProject, FundsWithdrawalByAdmin).withArgs(superAdmin, INITIAL_SUPPLY);
        await bestProject.adminDeposit(HALF_INITIAL_SUPPLY);
        expect(await stableContract.balanceOf(bestProject)).to.equal(HALF_INITIAL_SUPPLY);
        await expect(bestProject.finishProject()).to.be.revertedWithCustomError(bestProject, ProjectNotRefundedError)
          .withArgs(INITIAL_SUPPLY, HALF_INITIAL_SUPPLY);
      });

    });

    describe("Interest Calculation", function () {
      beforeEach(async function () {
        await bestProject.investInProject(INITIAL_SUPPLY);
      });
      it("should calculate insterest properly", async function () {
        await time.increase(86400 * 365);
        const testAmountWithInterest = BigInt(INITIAL_SUPPLY + INITIAL_SUPPLY * INTEREST_RATE_IPB / 10000n);
        expect(await bestProject.totalAmountWithInterest()).to.be.greaterThan(testAmountWithInterest - 100000n);
        expect(await bestProject.totalAmountWithInterest()).to.be.lessThan(testAmountWithInterest + ACCURACY_MARGIN);
      });
      it("should calculate insterest properly with compound", async function () {
        await time.increase(86400 * 735); // Two years and 5 days
        let testAmountWithInterest = BigInt(INITIAL_SUPPLY + INITIAL_SUPPLY * INTEREST_RATE_IPB / 10000n);
        testAmountWithInterest = BigInt(testAmountWithInterest + testAmountWithInterest * INTEREST_RATE_IPB / 10000n);
        testAmountWithInterest = BigInt(testAmountWithInterest + testAmountWithInterest * INTEREST_RATE_IPB / 10000n * 5n / 365n);
        expect(await bestProject.totalAmountWithInterest()).to.be.greaterThan(testAmountWithInterest - 100000n);
        expect(await bestProject.totalAmountWithInterest()).to.be.lessThan(testAmountWithInterest + ACCURACY_MARGIN);
      });
    });

    describe("Finish Project and Claim Funds", function () {
      beforeEach(async function () {
        await bestProject.connect(user1).investInProject(INITIAL_SUPPLY);
      });

      it("should allow admin to finish project", async function () {
        await expect(bestProject.finishProject()).to.emit(bestProject, ProjectStatusChange).withArgs(2n, 3n);
        expect(await bestProject.projectStatus()).to.equal(3n); // ProjectFinished
      });
      it("should send fund to bestMaster", async function () {
        await time.increase(86400 * 365);
        await stableContract.transfer(bestProject, HALF_INITIAL_SUPPLY);
        masterBalanceIni = await stableContract.balanceOf(bestMaster);
        await expect(bestProject.finishProject()).to.emit(bestProject, ProjectStatusChange).withArgs(2n, 3n);
        expect(await bestProject.projectStatus()).to.equal(3n); // ProjectFinished
        masterBalanceAfter = await stableContract.balanceOf(bestMaster);
        expect(masterBalanceAfter-masterBalanceIni).to.be.greaterThan(INITIAL_SUPPLY*INTEREST_RATE_IPB*BEST_FEE_RATE_IPB/10000n/10000n-ACCURACY_MARGIN)
        expect(masterBalanceAfter-masterBalanceIni).to.be.lessThan(INITIAL_SUPPLY*INTEREST_RATE_IPB*BEST_FEE_RATE_IPB/10000n/10000n+ACCURACY_MARGIN)
      });
      
      it("should allow non-admin to finish project", async function () {
        await expect(bestProject.connect(user1).finishProject()).to.be.revertedWithCustomError(bestProject,AccessControlUnauthorizedAccount);
      });
      it("should revert if admin transfer fail when finishing project", async function () {
        await stableContract.connect(stableOwnerImpersonatedSigner).pause();
        await expect(bestProject.finishProject()).to.be.revertedWithCustomError(bestProject,USDTTransferError);
      });
      it("should allow users to claim funds with interest", async function () {
        await bestProject.finishProject();
        await expect(bestProject.connect(user1).claimFundsWithInterest()).to.emit(bestProject, UserClaimedFunds).withArgs(user1, INITIAL_SUPPLY)
        expect(await bestProject.balanceOf(user1)).to.equal(0n);
      });

      it("should revert if claim doen't work", async function () {
        await bestProject.finishProject();
        await stableContract.connect(stableOwnerImpersonatedSigner).pause();
        await expect(bestProject.connect(user1).claimFundsWithInterest()).to.be.revertedWithCustomError(bestProject,USDTTransferError);
      });
    });

    describe("Access Control",function (){
      it("should not be possible to renounce role", async function () {
        await expect( bestProject.renounceRole(DEFAULT_ADMIN_ROLE, superAdmin)).to.be.revertedWith("Can't renounce role"); // ProjectFinished
      });
     

      it("Should prevent revoking of own ADMIN_ROLE", async function () {
        await expect(bestProject.revokeRole(DEFAULT_ADMIN_ROLE, superAdmin))
          .to.be.revertedWith("Can't self revoke Admin role");
      });
      it("Should allow revoking of other's ADMIN_ROLE", async function () {
        await bestProject.grantRole(DEFAULT_ADMIN_ROLE, user1);
        await bestProject.connect(user1).revokeRole(DEFAULT_ADMIN_ROLE, superAdmin);
        expect(await bestProject.hasRole(DEFAULT_ADMIN_ROLE, superAdmin)).to.equal(false);
      });
      it("Should not allow revoking role if not role'admin role", async function () {
        await expect(bestProject.connect(user1).revokeRole(DEFAULT_ADMIN_ROLE, superAdmin)).to.be.revertedWithCustomError(bestMaster,AccessControlUnauthorizedAccount);
      });
    })

  });

  describe("Calculate Interest testing", function () {
    beforeEach(async () => {
      await loadFixture(deployBestProjectFixture);
      await loadFixture(approveProjectForUsersFixture);
    })

    it("should return 0 if loan duration is 0 days", async function () {
      expect(await bestProject.calculateRealInterest(0,INITIAL_SUPPLY,INTEREST_RATE_IPB,BEST_FEE_RATE_IPB)).to.equal(0n); //loanDurationInDays, _investedAmount, _yearlyInterestIPB, _feeRateIPB
    });
    it("should return 0 if invested amount is 0", async function () {
      expect(await bestProject.calculateRealInterest(755,0,INTEREST_RATE_IPB,BEST_FEE_RATE_IPB)).to.equal(0n);
    });
    it("should return 0 if interest rate is 0", async function () {
      expect(await bestProject.calculateRealInterest(755,INITIAL_SUPPLY,0,BEST_FEE_RATE_IPB)).to.equal(0);
    });
    it("should return 10% if interest rate is 10% and fee rate is 0%", async function () {//loanDurationInDays, _investedAmount, _yearlyInterestIPB, _feeRateIPB
      expect(await bestProject.calculateRealInterest(365,INITIAL_SUPPLY,INTEREST_RATE_IPB,0)).to.be.greaterThan(INITIAL_SUPPLY*INTEREST_RATE_IPB/10000n-ACCURACY_MARGIN);
      expect(await bestProject.calculateRealInterest(365,INITIAL_SUPPLY,INTEREST_RATE_IPB,0)).to.be.lessThan(INITIAL_SUPPLY*INTEREST_RATE_IPB/10000n+ACCURACY_MARGIN);
    });
    it("should return 9% if interest rate is 10% and fee rate is 10%", async function () {//fee rate is a percentage of interest rate
      expect(await bestProject.calculateRealInterest(365,INITIAL_SUPPLY,INTEREST_RATE_IPB,BEST_FEE_RATE_IPB)).to.be.
      greaterThan(INITIAL_SUPPLY*INTEREST_RATE_IPB/10000n - ((INITIAL_SUPPLY*INTEREST_RATE_IPB*BEST_FEE_RATE_IPB)/10000n)/10000n-ACCURACY_MARGIN);
     expect(await bestProject.calculateRealInterest(365,INITIAL_SUPPLY,INTEREST_RATE_IPB,BEST_FEE_RATE_IPB)).to.be.
     lessThan(INITIAL_SUPPLY*INTEREST_RATE_IPB/10000n - ((INITIAL_SUPPLY*INTEREST_RATE_IPB*BEST_FEE_RATE_IPB)/10000n)/10000n+ACCURACY_MARGIN);
    });
    it("should return 0 if Fee rate is 0", async function () {//fee rate is a percentage of interest rate
      expect(await bestProject.calculateFee(365,INITIAL_SUPPLY,INTEREST_RATE_IPB,0)).to.equal(0n);//loanDurationInDays, _investedAmount, _yearlyInterestIPB, _feeRateIPB
    });
    it("should return 0 if Fee rate or duration or amount invested is 0", async function () {//fee rate is a percentage of interest rate
      expect(await bestProject.calculateInterestWithCompound(0,INITIAL_SUPPLY,INTEREST_RATE_IPB)).to.equal(0n);//loanDurationInDays, _investedAmount, _yearlyInterestIPB, _feeRateIPB
      expect(await bestProject.calculateInterestWithCompound(365,0,INTEREST_RATE_IPB)).to.equal(0n);
      expect(await bestProject.calculateInterestWithCompound(365,INITIAL_SUPPLY,0)).to.equal(0n);
    });
    it("should return good amount of interest with duration under a year", async function () {//fee rate is a percentage of interest rate
      const amountOfdays = 182n;
      const interest = ((INTEREST_RATE_IPB*amountOfdays*INITIAL_SUPPLY)/365n)/10000n
      expect(await bestProject.calculateInterestWithCompound(amountOfdays,INITIAL_SUPPLY,INTEREST_RATE_IPB)).to.be.
      greaterThan(interest-ACCURACY_MARGIN);
     expect(await bestProject.calculateInterestWithCompound(amountOfdays,INITIAL_SUPPLY,INTEREST_RATE_IPB)).to.be.
     lessThan(interest+ACCURACY_MARGIN);
    });

    it("should return good amount of interest with compound if duration more than a year", async function () {//fee rate is a percentage of interest rate
      const amountOfdays = 735n;
      let interest = INTEREST_RATE_IPB*INITIAL_SUPPLY/10000n
      interest = interest + (INTEREST_RATE_IPB*(INITIAL_SUPPLY+interest) + (INTEREST_RATE_IPB*5n*INITIAL_SUPPLY)/365n)/10000n
      expect(await bestProject.calculateInterestWithCompound(amountOfdays,INITIAL_SUPPLY,INTEREST_RATE_IPB)).to.be.
      greaterThan(interest-ACCURACY_MARGIN*2n);//ACCURACY_MARGIN*2 = 10cent/year
     expect(await bestProject.calculateInterestWithCompound(amountOfdays,INITIAL_SUPPLY,INTEREST_RATE_IPB)).to.be.
     lessThan(interest+ACCURACY_MARGIN*2n);//ACCURACY_MARGIN*2 = 10cent/year
    });

  });

});
