// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

error WrongProjectStatusError(uint _actualStatusActual, uint _necessaryProjectStatus);

contract BestProject is ERC20, AccessControl {
    event SomeoneInvested(address _investor, uint _amountInDollars);
    event SomeoneAskedForARefund(address _investor, uint _amountInDollars);

    enum ProjectStatus {
        Crowdfunding,
        Canceled,
        Funded,
        InProgress,
        Finished
    }
    ProjectStatus projectStatus;
    mapping (address => uint) public preFundedBalances; 
    address public usdtContractAddress;
    uint256 public fundingDeadline;
    uint256 public projectDeadline;
    uint256 public interestRate;
    uint256 public bestFee;
    uint256 public alreadyFunded;
    string public desc_link;

    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    constructor(
        address _firstOperator,
        address _usdtContractAddress,
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestFee,
        string memory _desc_link
    ) ERC20("Block Estate Token", "BEST") {
        // Variable initialisation
        usdtContractAddress = _usdtContractAddress;
        fundingDeadline = _fundingDeadline;
        projectDeadline = _projectDeadline;
        interestRate = _interestRate;
        bestFee = _bestFee;
        desc_link = _desc_link;

        _grantRole(DEFAULT_ADMIN_ROLE, _firstOperator);

        _mint(address(this), _initialSupply);
    }

    //Modifier
     modifier notBlacklist() {
        require(!hasRole(BLACKLIST_ROLE, msg.sender), "User Blacklisted");
        _;
    }

    modifier notToMuch(uint _amount){
        require(totalSupply()-alreadyFunded >= _amount,"Amount is too much");
        _;
    }
    
    modifier isProjectStatus(ProjectStatus _necessaryProjectStatus){
        if(projectStatus !=_necessaryProjectStatus){
            revert WrongProjectStatusError(uint(projectStatus),uint(_necessaryProjectStatus));
        }
        _;
    }

//Functions 
    function investInProject(uint _amountInDollars) isProjectStatus(ProjectStatus.Crowdfunding) notBlacklist notToMuch(_amountInDollars) external {
        uint realAmount = _amountInDollars*1000000;
        (bool success, bytes memory data) = usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),realAmount));
        
        require(success, "Contract coud not be funded");
        alreadyFunded +=_amountInDollars;
        preFundedBalances[msg.sender] +=_amountInDollars;
        emit SomeoneInvested(msg.sender, _amountInDollars);
    }

      function askForRefund(uint _amountInDollars) isProjectStatus(ProjectStatus.Crowdfunding) notBlacklist external {
        require(preFundedBalances[msg.sender]>=_amountInDollars,"You don't have enough funds");
        uint realAmount = _amountInDollars*1000000;
        (bool success, bytes memory data) = usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", msg.sender, realAmount));
        
        require(success, "Contract coud not be funded");
        alreadyFunded -=_amountInDollars;
        preFundedBalances[msg.sender] -=_amountInDollars;
        emit SomeoneAskedForARefund(msg.sender, _amountInDollars);
    }


    //OVERRIDEN FUNCITONS
    // This contract has two role, DEFAULT_ADMIN_ROLE for the operators and BLACK_LIST_ROLE
    // We don't want any of those roles to be renounceable
    function renounceRole(bytes32 role, address callerConfirmation)
        public
        virtual
        override
    {
        revert("Can't renounce role");
    }

    function revokeRole(bytes32 role, address account)
        public
        virtual
        override
        onlyRole(getRoleAdmin(role))
    {
        // Safety stop, an admin can't revoke it's own admin role, so the contract always has one
        require(
            !(role == DEFAULT_ADMIN_ROLE && account == msg.sender),
            "Can't self revoke Admin role"
        );
        _revokeRole(role, account);
    }
    // 1 token = 1$
    function decimals() public view virtual override returns (uint8)   {
        return 0;
    }

    // EXEMPLE FUNCITONS
    receive() external payable {
        require(msg.value >= 0.1 ether, "you can't send less than 0.1eth");
        distribute(msg.value);
    }

    function distribute(uint256 _amount) internal {
        uint256 tokensToSend = _amount;
        transfer(msg.sender, tokensToSend);
    }
}
