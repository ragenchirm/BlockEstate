// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BestProject.sol";
import "hardhat/console.sol";


contract BestMaster is AccessControl {
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);

    address[] public bestProjectsAddresses;
    bytes32 constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");
    uint public projectPriceInDollars; 
    uint public bestFeeRate;
    address public usdtContractAddress;
    ERC20 public tetherToken;

    constructor() { // ARGS are : (address _usdtContractAddress, uint _projectPriceInDollars, uint _bestFee)
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        // JUST TO TEST IN REMIX, REMOVE AFTER
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        bestFeeRate=5;
        projectPriceInDollars = 30;
        usdtContractAddress = address(0x0ff3726ff76AFdAD513885F49F1601A8E4bB75f7);
        // END OF TEST IN REMIX 
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        // Variable initialization
        
        // UNCOMMENT NEXT LINES
        //bestFee=_bestFee;
        //projectPriceInDollars=_projectPriceInDollars;
        //usdtContractAddress=_usdtContractAddress;
        tetherToken = ERC20(usdtContractAddress);
    }

    //MODIFIERS
    modifier notBlacklist() {
        require(!hasRole(BLACKLIST_ROLE, msg.sender), "User Blacklisted");
        _;
    }

    function setProjectPriceInDollars(uint _projectPriceInDollars) onlyRole (DEFAULT_ADMIN_ROLE) external{
        projectPriceInDollars=_projectPriceInDollars;
    }
    //FUNCTIONS
    function withdraw(uint _amountInDollars)external onlyRole(SUPER_ADMIN_ROLE){
        (bool success, bytes memory data) = transferUsdtToUser(_amountInDollars);
        if(success){
            emit FundsWithdrawalByAdmin( msg.sender, convertInUSDT(_amountInDollars));
        }else{
            revert USDTTransferError(address(this),msg.sender, convertInUSDT(_amountInDollars));
        }
    }

    function setFeeRate(uint _feeRate)external onlyRole(DEFAULT_ADMIN_ROLE){
        require( _feeRate <= 99,"Can't set more than a 99% fee");
        bestFeeRate=_feeRate;
    }


    function createProject(
        uint256 _initialSupply,
        uint256 _projectDeadline,
        uint256 _interestRate,
        string calldata _desc_link,
        string calldata _projectName
    ) external onlyRole(OPERATOR_ROLE) notBlacklist {
       (bool success, bytes memory data) = transferUsdtToContract(projectPriceInDollars);
       require(success,"Project price hasn't been paid");
        BestProject project = new BestProject(
            msg.sender,
            usdtContractAddress,
            _initialSupply,
            _projectDeadline,
            _interestRate,
            bestFeeRate,
            _desc_link,
            _projectName
        );
        bestProjectsAddresses.push(address(project));
    }
   // INTERNAL FUNCTIONS
    function convertInUSDT(uint _amountInDollars) internal pure returns(uint){
        return _amountInDollars*1000000;
    }
    function transferUsdtToContract(uint _amountInDollars) internal returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),convertInUSDT(_amountInDollars)));
    }
    function transferUsdtToUser(uint _amountInDollars) internal returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", msg.sender, convertInUSDT(_amountInDollars)));
    }

    // Overriden functions
    function renounceRole(bytes32 role, address callerConfirmation)
        public
        virtual
        override
    {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }
        require(role != BLACKLIST_ROLE, "Can't renounce Blacklist role"); 
        // Safety stop, a super admin can't renounce it's superadmin role, so the contract always has one
        require(role != SUPER_ADMIN_ROLE, "Can't renounce Super Admin role"); 
        

        _revokeRole(role, callerConfirmation);
    }

     function revokeRole(bytes32 role, address account)
        public
        virtual
        override
        onlyRole(getRoleAdmin(role))
    {
        // Safety stop, a super admin can't revoke it's own superadmin role, so the contract always has one
        require(
            !(role == SUPER_ADMIN_ROLE && account == msg.sender),
            "Can't self revoke Super Admin role"
        );
        _revokeRole(role, account);
    }

// receive and fallback cause we never know
    receive() external payable {}
    fallback() external payable {}
}
