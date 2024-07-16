// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./../node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "./../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BestProject.sol";
import "./../node_modules/hardhat/console.sol";

/// @title Block Estate Master Contract
/// @author NoelNGA
/// @notice best is used in variables naming as an acronym for Block Estate
/// @dev This contract implements a factory of contracts BestProject, which will be created for each new project

contract BestMaster is AccessControl {
    /// @notice Thrown when a blacklisted user attempts to interact with the contract
    /// @param _user The address of the blacklisted user
    error UserBlacklistedError(address _user);

    /// @notice Thrown when a USDT transfer fails
    /// @param _from The address from which the transfer was attempted
    /// @param _to The address to which the transfer was attempted
    /// @param _amount The amount of USDT attempted to transfer
    error USDTTransferError(address _from, address _to, uint _amount);

    /// @notice Emitted when funds are withdrawn by an admin
    /// @param _operator The address of the admin performing the withdrawal
    /// @param _amountInDollars The amount withdrawn in dollars
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);

    /// @notice Emitted when a new project is created
    /// @param _project The address of the newly created project
    /// @param _operator The address of the operator who created the project
    event ProjectCreated(address _project, address _operator);

    /// @notice List of created projects
    /// @dev This list might be removed in the future to use events instead, to avoid making the contract too heavy
    address[] public bestProjectsAddresses;

    bytes32 constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    /// @notice The price of a project in dollars
    uint public projectPriceInDollars;
    /// @notice The fee rate of the contract, in Index Basis Points (IPB)
    uint public bestFeeRateIPB;
    /// @notice The address of the USDT contract
    address public usdtContractAddress;

    /// @notice Initializes the contract with the USDT contract address and assigns roles to the contract deployer's address
    /// @param _usdtContractAddress The address of the USDT contract
    constructor(address _usdtContractAddress) {
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);

        //Variable Initialization
        bestFeeRateIPB = 1000;
        projectPriceInDollars = 30;

        usdtContractAddress = _usdtContractAddress;
    }

    //MODIFIERS
    /// @notice Ensures the caller is not blacklisted
    modifier notBlacklist() {
        if (hasRole(BLACKLIST_ROLE, msg.sender)) {
            revert UserBlacklistedError(msg.sender);
        }
        _;
    }
    // Factory
    /// @notice Creates a new contract for a new gitproject
    /// @dev This function uses the USDT transfer function to ensure the project price is paid
    /// @param _initialSupply The initial supply of tokens for the project
    /// @param _projectDeadline The deadline for the project
    /// @param _interestRateIPB The interest rate in Index Basis Points (IPB) (for exemple 1% is written 100 and 10% is written 1000)
    /// @param _desc_link The link to the project description
    /// @param _projectName The name of the project
    function createProject(
        uint256 _initialSupply,
        uint256 _projectDeadline,
        uint256 _interestRateIPB,
        string calldata _desc_link,
        string calldata _projectName
    ) external onlyRole(OPERATOR_ROLE) notBlacklist {
        (bool success, bytes memory data) = _transferUsdtToContract(
            projectPriceInDollars * 1000000
        );
        require(success, "Project price hasn't been paid");
        BestProject project = new BestProject(
            msg.sender,
            address(this),
            usdtContractAddress,
            _initialSupply,
            _projectDeadline,
            _interestRateIPB,
            bestFeeRateIPB,
            _desc_link,
            _projectName
        );
        bestProjectsAddresses.push(address(project));
        emit ProjectCreated(address(project), msg.sender);
    }

    //FUNCTIONS
    //Setters
    /// @notice Sets the price of a project in dollars
    /// @param _projectPriceInDollars The new project price in dollars
    function setProjectPriceInDollars(
        uint _projectPriceInDollars
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projectPriceInDollars = _projectPriceInDollars;
    }

    /// @notice Sets the fee rate
    /// @param _feeRate The new fee rate in Index Basis Points (IPB)
    function setFeeRate(uint _feeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRate <= 9900, "Can't set more than a 99% fee");
        bestFeeRateIPB = _feeRate;
    }

    // Admin Withdrawal
    /// @notice Allows super admin to withdraw funds
    /// @param _amount The amount to withdraw
    function adminWithdraw(uint _amount) external onlyRole(SUPER_ADMIN_ROLE) {
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if (success) {
            emit FundsWithdrawalByAdmin(msg.sender, _amount);
        } else {
            revert USDTTransferError(address(this), msg.sender, _amount);
        }
    }

    // PRIVATE FUNCTIONS
    /// @dev Transfers USDT from the caller to the contract
    /// @param _amount The amount in 6Decimals to transfer
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
    /// @dev Transfers USDT from the contract to the caller
    /// @param _amount The amount in 6Decimals to transfer
    /// @return success A boolean indicating whether the transfer was successful
    /// @return data The data returned from the USDT contract call
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

    // OVERRIDEN FUNCTIONS
    /// @notice Allows the caller to renounce their role
    /// @dev The caller cannot renounce the BLACKLIST_ROLE or SUPER_ADMIN_ROLE
    /// @param role The role to renounce
    /// @param callerConfirmation The address of the caller to confirm
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public virtual override {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }
        require(role != BLACKLIST_ROLE, "Can't renounce Blacklist role");
        // Safety stop, a super admin can't renounce it's superadmin role, so the contract always has one
        require(role != SUPER_ADMIN_ROLE, "Can't renounce Super Admin role");

        _revokeRole(role, callerConfirmation);
    }

    /// @notice Allows the admin to revoke a role from an account
    /// @dev The caller cannot revoke their own SUPER_ADMIN_ROLE
    /// @param role The role to revoke
    /// @param account The account from which to revoke the role
    function revokeRole(
        bytes32 role,
        address account
    ) public virtual override onlyRole(getRoleAdmin(role)) {
        // Safety stop, a super admin can't revoke it's own superadmin role, so the contract always has one
        require(
            !(role == SUPER_ADMIN_ROLE && account == msg.sender),
            "Can't self revoke Super Admin role"
        );
        _revokeRole(role, account);
    }
}
