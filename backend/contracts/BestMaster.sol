// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BestProject.sol";
import "hardhat/console.sol";


contract BestMaster is AccessControl {
    address public withdrawalAddress; // address to withdraw contract funds
    address[] public bestProjectsAddresses;
    bytes32 constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    uint public projectPrice; 
    uint public bestFee;
    address public usdtContractAddress;
    ERC20 public tetherToken;

    constructor() { // ARGS are : (address _usdtContractAddress, uint _projectPrice, uint _bestFee)
        withdrawalAddress=msg.sender;
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        // JUST TO TEST IN REMIX, REMOVE AFTER
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        bestFee=5;
        projectPrice = 30;
        usdtContractAddress = address(0x81f6D0417aCCaFEabf107Bd28c078702C44D7863);
        // END OF TEST IN REMIX 
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        // Variable initialization
        
        // UNCOMMENT NEXT LINES
        //bestFee=_bestFee;
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

    function withdraw(uint _amount)external onlyRole(SUPER_ADMIN_ROLE){
        require( _amount <= tetherToken.balanceOf(address(this)),"Not enougth funds");
        (bool success, bytes memory data) = usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", withdrawalAddress,_amount));
    }

    function changeFee(uint _fee)external onlyRole(DEFAULT_ADMIN_ROLE){
        require( _fee <= 99,"Can't set more than a 99% fee");
        bestFee=_fee;
    }

    function changeWithdrawalAddress(address _newWithdrawalAddress)external onlyRole(SUPER_ADMIN_ROLE){
        //this require is a security to not accidentaly change thewithdrawal address
        //the process must be grant SUPER_ADMIN_ROLE to _newWithdrawalAddress
        //then connect as _newWithdrawalAddress and changeWithdrawalAddress and if necessary renounce SUPER_ADMIN_ROLE
        require(_newWithdrawalAddress==msg.sender,"you are not the new address");
        withdrawalAddress=_newWithdrawalAddress;
    }


    function createProject(
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        string calldata _desc_link
    ) external onlyRole(OPERATOR_ROLE) notBlacklist {
       (bool success, bytes memory data) = usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),projectPrice));
       require(success,"Project price hasn't been paid");
        BestProject project = new BestProject(
            _initialSupply,
            _fundingDeadline,
            _projectDeadline,
            _interestRate,
            bestFee,
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
