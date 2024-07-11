// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CalculateInterest.sol";
import "hardhat/console.sol";

contract BestProject is ERC20, AccessControl, CalculateInterest {
    error WrongProjectStatusError(uint _actualStatusActual);
    error USDTTransferError(address _from, address _to, uint _amount);
    error UserBlacklistedError(address _user);
    error TooMuchError(uint _contractBalance, uint _amount);
    error NotEnoughFundsError(address _user, uint _amount);
    error WithdrawalIsTooBigError(uint _maxWithdrawal, uint _amount);
    error ProjectNotRefundedError(
        uint _minNecessaryBalance,
        uint _actualBalance
    );

    event UserInvested(address _investor, uint _amountInDollars);
    event UserAskedForARefund(address _investor, uint _amountInDollars);
    event UserClaimedFunds(address _user, uint _fundClaimed);
    event ProjectStatusChange(uint _from, uint _to);
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);
    event FundsDepositedByAdmin(address _operator, uint _amount);

    enum ProjectStatus {
        Crowdfunding,
        Canceled,
        ProjectLaunched,
        ProjectFinished
    }

    //private variables
    ERC20 tetherToken;
    //public variables
    address public usdtContractAddress;
    address public masterContractAddress;
    address public projectCreator;
    uint256 public projectDeadline;
    uint256 public interestRateIPB; //IPB = Index Basis Point. So for exemple 100 represents a 1% interest rate
    uint256 public bestFeeRateIPB;
    uint public projectLaunchDate;
    string public desc_link;
    ProjectStatus public projectStatus;

    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    constructor(
        address _projectCreator,
        address _masterContractAddress,
        address _usdtContractAddress,
        uint256 _initialSupply,
        uint256 _projectDeadline,
        uint256 _interestRateIPB,
        uint256 _bestFeeRateIPB,
        string memory _desc_link,
        string memory _projectName
    ) ERC20(_projectName, "BEST") {
        // Variable initialisation
        masterContractAddress = _masterContractAddress;
        usdtContractAddress = _usdtContractAddress;
        projectDeadline = _projectDeadline;
        interestRateIPB = _interestRateIPB;
        bestFeeRateIPB = _bestFeeRateIPB;
        desc_link = _desc_link;

        projectCreator = _projectCreator;
        _grantRole(DEFAULT_ADMIN_ROLE, _projectCreator);
        _mint(address(this), _initialSupply);
        projectLaunchDate = block.timestamp;
        tetherToken = ERC20(usdtContractAddress);
    }

    //Modifier
    modifier notBlacklist() {
        if (hasRole(BLACKLIST_ROLE, msg.sender)) {
            revert UserBlacklistedError(msg.sender);
        }
        _;
    }

    modifier notToMuch(uint _amount) {
        if (balanceOf(address(this)) < _amount) {
            revert TooMuchError(balanceOf(address(this)), _amount);
        }
        _;
    }

    modifier isProjectStatus(ProjectStatus _necessaryProjectStatus) {
        if (projectStatus != _necessaryProjectStatus) {
            revert WrongProjectStatusError(uint(projectStatus));
        }
        _;
    }
    modifier isOneOfProjectStatus(
        ProjectStatus _necessaryProjectStatus1,
        ProjectStatus _necessaryProjectStatus2
    ) {
        if (
            projectStatus != _necessaryProjectStatus1 &&
            projectStatus != _necessaryProjectStatus2
        ) {
            revert WrongProjectStatusError(uint(projectStatus));
        }
        _;
    }

    //Functions
    function investInProject(
        uint _amount
    )
        external
        isProjectStatus(ProjectStatus.Crowdfunding)
        notBlacklist
        notToMuch(_amount)
    {
        (bool success, bytes memory data) = _transferUsdtToContract(_amount);
        if (success) {
            _transfer(address(this), msg.sender, _amount);
            emit UserInvested(msg.sender, _amount);
        } else {
            revert USDTTransferError(msg.sender, address(this), _amount);
        }
        if (alreadyFunded() == totalSupply()) {
            launchProject();
        }
    }

    function askForARefund(
        uint _amount
    )
        external
        isOneOfProjectStatus(ProjectStatus.Crowdfunding, ProjectStatus.Canceled)
        notBlacklist
    {
        if (balanceOf(msg.sender) < _amount) {
            revert NotEnoughFundsError(msg.sender, _amount);
        }
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if (success) {
            _transfer(msg.sender, address(this), _amount);
            emit UserAskedForARefund(msg.sender, _amount);
        } else {
            revert USDTTransferError(address(this), msg.sender, _amount);
        }
    }

    function adminWithdraw(
        uint _amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        isOneOfProjectStatus(
            ProjectStatus.ProjectLaunched,
            ProjectStatus.ProjectFinished
        )
    {
        if (
            projectStatus == ProjectStatus.ProjectFinished &&
            (tetherToken.balanceOf(address(this))  <
                totalAmountWithInterest()+_amount)
        ) {
            revert WithdrawalIsTooBigError(
                tetherToken.balanceOf(address(this)) -
                    totalAmountWithInterest(),
                _amount
            );
        }
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if (success) {
            emit FundsWithdrawalByAdmin(msg.sender, _amount);
        } else {
            revert USDTTransferError(address(this), msg.sender, _amount);
        }
    }

    function adminDeposit(
        uint _amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        isProjectStatus(ProjectStatus.ProjectLaunched)
    {
        (bool success, bytes memory data) = _transferUsdtToContract(_amount);
        if (success) {
            emit FundsDepositedByAdmin(msg.sender, _amount);
        } else {
            revert USDTTransferError(address(this), msg.sender, _amount);
        }
    }

    function finishProject()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        isProjectStatus(ProjectStatus.ProjectLaunched)
    {
        if (tetherToken.balanceOf(address(this)) < totalAmountWithInterest()) {
            revert ProjectNotRefundedError(totalAmountWithInterest(),
                tetherToken.balanceOf(address(this))
            );          
        }

        (bool success, bytes memory data) = _transferUsdtToMaster(
            calculateFee(
                _getTimePassedInDays(),
                totalSupply(),
                interestRateIPB,
                bestFeeRateIPB
            )
        );
        if (success) {
            projectStatus = ProjectStatus.ProjectFinished;
            emit ProjectStatusChange(
                uint(ProjectStatus.ProjectLaunched),
                uint(projectStatus)
            );
        } else {
            revert USDTTransferError(
                address(this),
                masterContractAddress,
                calculateFee(
                    _getTimePassedInDays(),
                    totalSupply(),
                    interestRateIPB,
                    bestFeeRateIPB
                )
            );
        }
    }

    function claimFundsWithInterest()
        external
        isProjectStatus(ProjectStatus.ProjectFinished)
    {
        (bool success, bytes memory data) = _transferUsdtToUser(
            calculateRealInterest(
                _getTimePassedInDays(),
                balanceOf(msg.sender),
                interestRateIPB,
                bestFeeRateIPB
            )
        );
        if (success) {
            uint prevBalance = balanceOf(msg.sender);
            _burn(msg.sender, balanceOf(msg.sender));
            emit UserClaimedFunds(msg.sender, prevBalance);
        } else {
            revert USDTTransferError(
                address(this),
                msg.sender,
                balanceOf(msg.sender)
            );
        }
    }

    function totalAmountWithInterest() public view returns (uint) {
        return
            totalSupply() +
            calculateInterestWithCompound(
                _getTimePassedInDays(),
                totalSupply(),
                interestRateIPB
            );
    }

    // INTERNAL OR PRIVATE FUNCTIONS
    function launchProject()
        private
    {
        projectStatus = ProjectStatus.ProjectLaunched;
        emit ProjectStatusChange(
            uint(ProjectStatus.Crowdfunding),
            uint(ProjectStatus.ProjectLaunched)
        );
    }

    function alreadyFunded() private view returns (uint) {
        return totalSupply() - balanceOf(address(this));
    }
    function _transferUsdtToContract(
        uint _amountInDollars
    ) private returns (bool, bytes memory) {
        return
            usdtContractAddress.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    _amountInDollars
                )
            );
    }

    function _transferUsdtToUser(
        uint _amount
    ) private returns (bool, bytes memory) {
        return
            usdtContractAddress.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    msg.sender,
                    _amount
                )
            );
    }
    function _transferUsdtToMaster(
        uint _amount
    ) private returns (bool, bytes memory) {
        return
            usdtContractAddress.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    masterContractAddress,
                    _amount
                )
            );
    }
    function _getTimePassedInDays() private view returns (uint) {
        return _convertTimeInDays(block.timestamp - projectLaunchDate);
    }
    function _convertTimeInDays(uint _time) private pure returns (uint) {
        return _time / 86400;
    }

    //OVERRIDEN FUNCITONS
    // This contract has two role, DEFAULT_ADMIN_ROLE for the operators and BLACK_LIST_ROLE
    // We don't want any of those roles to be renounceable
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public virtual override {
        revert("Can't renounce role");
    }

    function revokeRole(
        bytes32 role,
        address account
    ) public virtual override onlyRole(getRoleAdmin(role)) {
        // Safety stop, an admin can't revoke it's own admin role, so the contract always has one
        require(
            !(role == DEFAULT_ADMIN_ROLE && account == msg.sender),
            "Can't self revoke Admin role"
        );
        _revokeRole(role, account);
    }
    // 1 token = 1$
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

}
