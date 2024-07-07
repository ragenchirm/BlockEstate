// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BestProject.sol";
import "hardhat/console.sol";


contract BestMaster is AccessControl {
    address[] public bestProjectsAddresses;
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    uint projectPrice = 30; // TO REMOVE AND PUT IN CONSTRUCTOR
    address usdtContractAddress = address(0x81f6D0417aCCaFEabf107Bd28c078702C44D7863); // TO REMOVE AND PUT IN CONSTRUCTOR
    ERC20 public tetherToken;

    constructor() { // ARGS are : (address _usdtContractAddress, uint _projectPrice)
       
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        // JUST TO TEST IN REMIX, REMOVE AFTER
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        // END OF TEST IN REMIX 
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        // Variable initialization
        
        // UNCOMMENT NEXT TO LINES
        //projectPrice=_projectPrice;
        //usdtContractAddress=_usdtContractAddress;
        tetherToken = ERC20(usdtContractAddress);
        
      
    }

    modifier notBlacklist() {
        require(!hasRole(BLACKLIST_ROLE, msg.sender), "User Blacklisted");
        _;
    }
    function setProjectPrice(uint _projectPrice) external{
        projectPrice=_projectPrice;
    }


    function createProject(
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestMarckup,
        string calldata _desc_link
    ) external onlyRole(OPERATOR_ROLE) notBlacklist {
       (bool success, bytes memory data) = usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),projectPrice));
       require(success,"Project price hasn't been paid");
        BestProject project = new BestProject(
            _initialSupply,
            _fundingDeadline,
            _projectDeadline,
            _interestRate,
            _bestMarckup,
            _desc_link
        );
        bestProjectsAddresses.push(address(project));
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
