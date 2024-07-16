// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./../node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "./CalculateInterest.sol";
import "./../node_modules/hardhat/console.sol";

/// @title BestProject Contract
/// @notice This contract represents a project where users can invest, request refunds, and claim funds with interest, and operators can withdraw funds and refund users with interests
/// @dev This contract uses OpenZeppelin's ERC20 and AccessControl libraries and extends CalculateInterest.

contract BestProject is ERC20, AccessControl, CalculateInterest {
    /// @notice Thrown when the project status is incorrect for the operation
    /// @param _actualStatusActual The actual status of the project
    error WrongProjectStatusError(uint _actualStatusActual);

    /// @notice Thrown when a USDT transfer fails
    /// @param _from The address from which the transfer was attempted
    /// @param _to The address to which the transfer was attempted
    /// @param _amount The amount of USDT attempted to transfer
    error USDTTransferError(address _from, address _to, uint _amount);

    /// @notice Thrown when a blacklisted user attempts to interact with the contract
    /// @param _user The address of the blacklisted user
    error UserBlacklistedError(address _user);

    /// @notice Thrown when the amount exceeds the contract balance
    /// @param _contractBalance The contract's current balance
    /// @param _amount The attempted amount
    error TooMuchError(uint _contractBalance, uint _amount);

    /// @notice Thrown when a user does not have enough funds for the operation
    /// @param _user The address of the user
    /// @param _amount The attempted amount
    error NotEnoughFundsError(address _user, uint _amount);

    /// @notice Thrown when a withdrawal amount is too large
    /// @param _maxWithdrawal The maximum allowable withdrawal amount
    /// @param _amount The attempted withdrawal amount
    error WithdrawalIsTooBigError(uint _maxWithdrawal, uint _amount);

    /// @notice Thrown when the project is not fully refunded
    /// @param _minNecessaryBalance The minimum necessary balance for refund
    /// @param _actualBalance The actual balance
    error ProjectNotRefundedError(
        uint _minNecessaryBalance,
        uint _actualBalance
    );

    /// @notice Emitted when a user invests in the project
    /// @param _investor The address of the investor
    /// @param _amountInDollars The amount invested in dollars
    event UserInvested(address _investor, uint _amountInDollars);

    /// @notice Emitted when a user requests a refund
    /// @param _investor The address of the investor
    /// @param _amountInDollars The amount requested for refund in dollars
    event UserAskedForARefund(address _investor, uint _amountInDollars);

    /// @notice Emitted when a user claims their funds with interest
    /// @param _user The address of the user
    /// @param _fundClaimed The amount of funds claimed
    event UserClaimedFunds(address _user, uint _fundClaimed);

    /// @notice Emitted when the project status changes
    /// @param _from The previous status
    /// @param _to The new status
    event ProjectStatusChange(uint _from, uint _to);

    /// @notice Emitted when an admin withdraws funds
    /// @param _operator The address of the admin
    /// @param _amountInDollars The amount withdrawn in dollars
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);

    /// @notice Emitted when an admin deposits funds
    /// @param _operator The address of the admin
    /// @param _amount The amount deposited
    event FundsDepositedByAdmin(address _operator, uint _amount);

    /// @notice Enum representing the possible statuses of a project
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

    /// @notice Constructor to initialize the contract with necessary parameters
    /// @param _projectCreator The address of the project creator
    /// @param _masterContractAddress The address of the master contract
    /// @param _usdtContractAddress The address of the USDT contract
    /// @param _initialSupply The initial supply of tokens
    /// @param _projectDeadline The deadline for the project
    /// @param _interestRateIPB The interest rate in Index Basis Points (IPB)
    /// @param _bestFeeRateIPB The fee rate in Index Basis Points (IPB)
    /// @param _desc_link The link to the project description
    /// @param _projectName The name of the project
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
    /// @notice Ensures the caller is not blacklisted
    modifier notBlacklist() {
        if (hasRole(BLACKLIST_ROLE, msg.sender)) {
            revert UserBlacklistedError(msg.sender);
        }
        _;
    }

    /// @notice Ensures the amount is not more than the contract balance
    /// @param _amount The amount to check
    modifier notToMuch(uint _amount) {
        if (balanceOf(address(this)) < _amount) {
            revert TooMuchError(balanceOf(address(this)), _amount);
        }
        _;
    }
    /// @notice Ensures the project status is as required
    /// @param _necessaryProjectStatus The required project status
    modifier isProjectStatus(ProjectStatus _necessaryProjectStatus) {
        if (projectStatus != _necessaryProjectStatus) {
            revert WrongProjectStatusError(uint(projectStatus));
        }
        _;
    }

    /// @notice Ensures the project status is one of the two required statuses
    /// @param _necessaryProjectStatus1 The first required project status
    /// @param _necessaryProjectStatus2 The second required project status
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
    /// @notice Allows a user to invest in the project
    /// @dev Project is launched automatically when fully funded
    /// @param _amount The amount to invest
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

    /// @notice Allows a user to request a refund if project not launched yet
    /// @param _amount The amount to refund
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

    /// @notice Allows an admin to withdraw funds when project is launched
    /// @param _amount The amount to withdraw
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
            (tetherToken.balanceOf(address(this)) <
                totalAmountWithInterest() + _amount)
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

    /// @notice Allows an admin to deposit funds
    /// @param _amount The amount to deposit
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

    /// @notice Allows an admin to finish the project
    function finishProject()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        isProjectStatus(ProjectStatus.ProjectLaunched)
    {
        if (tetherToken.balanceOf(address(this)) < totalAmountWithInterest()) {
            revert ProjectNotRefundedError(
                totalAmountWithInterest(),
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

    /// @notice Allows a user to claim their funds with interest, when project is finished
    function claimFundsWithInterest()
        external
        isProjectStatus(ProjectStatus.ProjectFinished)
    {
        uint prevBalance = balanceOf(msg.sender);
        uint interest = calculateRealInterest(
            _getTimePassedInDays(),
            balanceOf(msg.sender),
            interestRateIPB,
            bestFeeRateIPB
        );
        _burn(msg.sender, balanceOf(msg.sender));
        (bool success, bytes memory data) = _transferUsdtToUser(
            prevBalance + interest
        );
        if (success) {
            emit UserClaimedFunds(msg.sender, prevBalance + interest);
        } else {
            revert USDTTransferError(
                address(this),
                msg.sender,
                balanceOf(msg.sender)
            );
        }
    }

    /// @notice Returns the total amount with interest
    /// @return The total amount with interest
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
    /// @dev Launches the project by changing its status to ProjectLaunched
    function launchProject() private {
        projectStatus = ProjectStatus.ProjectLaunched;
        emit ProjectStatusChange(
            uint(ProjectStatus.Crowdfunding),
            uint(ProjectStatus.ProjectLaunched)
        );
    }

    /// @dev Returns the already funded amount
    /// @return The already funded amount
    function alreadyFunded() private view returns (uint) {
        return totalSupply() - balanceOf(address(this));
    }

    /// @dev Transfers USDT from the caller to the project's contract
    /// @param _amount The amount in dollars to transfer
    /// @return success A boolean indicating whether the transfer was successful
    /// @return data The data returned from the USDT contract call
    function _transferUsdtToContract(
        uint _amount
    ) private returns (bool, bytes memory) {
        return
            usdtContractAddress.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    _amount
                )
            );
    }
    /// @dev Transfers USDT from the project's contract to the caller
    /// @param _amount The amount to transfer
    /// @return A boolean indicating whether the transfer was successful
    /// @return The data returned from the USDT contract call
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
    /// @dev Transfers USDT from the project's contract to the master contract
    /// @param _amount The amount to transfer
    /// @return A boolean indicating whether the transfer was successful
    /// @return The data returned from the USDT contract call
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

    /// @dev Returns the number of days passed since the project launch date
    /// @return The number of days passed
    function _getTimePassedInDays() private view returns (uint) {
        return _convertTimeInDays(block.timestamp - projectLaunchDate);
    }

    /// @dev Converts time in seconds to days
    /// @param _time The time in seconds
    /// @return The time in days
    function _convertTimeInDays(uint _time) private pure returns (uint) {
        return _time / 86400;
    }

    //OVERRIDEN FUNCITONS

    /// @notice This contract has two role, DEFAULT_ADMIN_ROLE for the operators and BLACK_LIST_ROLE. We don't want any of those roles to be renounceables.
    /// @dev Prevents roles from being renounced
    /// @param role The role to renounce
    /// @param callerConfirmation The address of the caller to confirm
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public virtual override {
        revert("Can't renounce role");
    }

    /// @dev Allows an admin to revoke a role from an account
    /// @param role The role to revoke
    /// @param account The account from which to revoke the role
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

    /// @notice Returns the number of decimals used to get its user representation.
    /// @return The number of decimals
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
