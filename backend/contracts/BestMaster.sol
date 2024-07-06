// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import "./BestProject.sol";

error UserBlacklistedError(address _address);

contract BestMaster is AccessControl {
    address[] public bestProjectsAddresses;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier notBlacklist() {
        require(!hasRole(BLACKLIST_ROLE, msg.sender), "User Blacklisted");
        _;
    }

    function createProject(
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestMarckup,
        string calldata _desc_link
    ) external onlyRole(OPERATOR_ROLE) notBlacklist() {
        BestProject project = new BestProject(
            _initialSupply,
            _fundingDeadline,
            _projectDeadline,
            _interestRate,
            _bestMarckup,
            _desc_link
        );
        bestProjectsAddresses.push(address(project));
        console.log("start create project");
        console.log(address(project));
        console.log("end create project");
    }

    function renounceRole(bytes32 role, address callerConfirmation)
        public
        virtual
        override
    {
        require(role != BLACKLIST_ROLE, "Can't renounce Blacklist role");
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    receive() external payable {}

    fallback() external payable {}
}
