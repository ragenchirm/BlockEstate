// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BestProject.sol";
import "hardhat/console.sol";

/// @title Block Estate Master Contract
/// @author NoelNGA
/// @notice best is used in variables naming as an acronym for Block Estate
/// @dev This contract implements a factory of contracts BestProject, which will be created for each new project

contract BestMaster is AccessControl {
    error UserBlacklistedError(address _user);
    error USDTTransferError(address _from, address _to, uint _amount);
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);
    event ProjectCreated(address _project, address _operator);

    address[] public bestProjectsAddresses; // List of created  projects, to remove ultimatly and use event instead so the contract doesn't get too heavy
    bytes32 constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    uint public projectPriceInDollars;
    uint public bestFeeRateIPB;
    address public usdtContractAddress;

    constructor(address _usdtContractAddress) {
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);

        //Variable Initialization
        bestFeeRateIPB = 100;
        projectPriceInDollars = 30;

        usdtContractAddress = _usdtContractAddress;
    }

    //MODIFIERS
    modifier notBlacklist() {
        if (hasRole(BLACKLIST_ROLE, msg.sender)) {
            revert UserBlacklistedError(msg.sender);
        }
        _;
    }
    // Factory
    // IPB = Index Basis Point, for exemple 1% is written 100 and 10% is written 1000
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
    function setProjectPriceInDollars(
        uint _projectPriceInDollars
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projectPriceInDollars = _projectPriceInDollars;
    }

    function setFeeRate(uint _feeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRate <= 99, "Can't set more than a 99% fee");
        bestFeeRateIPB = _feeRate;
    }

    // Admin Withdrawal
    function adminWithdraw(uint _amount) external onlyRole(SUPER_ADMIN_ROLE) {
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if (success) {
            emit FundsWithdrawalByAdmin(msg.sender, _amount);
        } else {
            revert USDTTransferError(address(this), msg.sender, _amount);
        }
    }

    // PRIVATE FUNCTIONS
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
        uint _amountInDollars
    ) private returns (bool, bytes memory) {
        return
            usdtContractAddress.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    msg.sender,
                    _amountInDollars
                )
            );
    }

    // OVERRIDEN FUNCTIONS
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
