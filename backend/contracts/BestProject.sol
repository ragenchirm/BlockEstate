// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

error WrongProjectStatusError(uint _actualStatusActual);
error USDTTransferError(address _from, address _to, uint _amount);

contract BestProject is ERC20, AccessControl {
    event SomeoneInvested(address _investor, uint _amountInDollars);
    event SomeoneAskedForARefund(address _investor, uint _amountInDollars);
    event ProjectStatusChange(uint _from, uint _to);
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);
    

    enum ProjectStatus {
        Crowdfunding,
        Canceled,
        ProjectLaunched,
        ProjectFinished
    }

    ProjectStatus public projectStatus;
    address public usdtContractAddress;
    uint256 public projectDeadline;
    uint256 public interestRate;
    uint256 public bestFee;
    uint public projectLaunchDate;
    string public desc_link;

    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    constructor(
        address _firstOperator,
        address _usdtContractAddress,
        uint256 _initialSupply,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestFee,
        string memory _desc_link,
        string memory _projectName
    ) ERC20(_projectName, "BEST") {
        // Variable initialisation
        usdtContractAddress = _usdtContractAddress;
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
        require(balanceOf(address(this)) >= _amount,"Amount is too much");
        _;
    }
    
    modifier isProjectStatus(ProjectStatus _necessaryProjectStatus){
        if(projectStatus !=_necessaryProjectStatus){
            revert WrongProjectStatusError(uint(projectStatus));
        }
        _;
    }
    modifier isOneOfProjectStatus(ProjectStatus _necessaryProjectStatus1, ProjectStatus _necessaryProjectStatus2){
        if(projectStatus !=_necessaryProjectStatus1 && projectStatus !=_necessaryProjectStatus2){
            revert WrongProjectStatusError(uint(projectStatus));
        }
        _;
    }

//Functions 
    function investInProject(uint _amountInDollars) isProjectStatus(ProjectStatus.Crowdfunding) notBlacklist notToMuch(_amountInDollars) external {
        (bool success, bytes memory data) = transferUsdtToContract(_amountInDollars);
        if(success){
            _transfer(address(this), msg.sender, _amountInDollars);
            emit SomeoneInvested(msg.sender, _amountInDollars);
        }else{
            revert USDTTransferError(msg.sender, address(this),convertInUSDT(_amountInDollars));
        }
    }

      function askForARefund(uint _amountInDollars) isOneOfProjectStatus(ProjectStatus.Crowdfunding, ProjectStatus.Canceled) notBlacklist external {
        require(balanceOf(msg.sender) >=_amountInDollars,"You don't have enough funds");
        (bool success, bytes memory data) = transferUsdtToUser(_amountInDollars);
        if(success){
             _transfer(msg.sender, address(this), _amountInDollars);
        emit SomeoneAskedForARefund(msg.sender, _amountInDollars);
        }else{
            revert USDTTransferError( address(this), msg.sender ,convertInUSDT(_amountInDollars));
        }   
    }

    function launchProject() onlyRole(DEFAULT_ADMIN_ROLE) isProjectStatus(ProjectStatus.Crowdfunding) external {
        require(alreadyFunded()==totalSupply(),"Project not funded yet");
        projectStatus = ProjectStatus.ProjectLaunched;
        emit ProjectStatusChange(uint(ProjectStatus.Crowdfunding), uint(ProjectStatus.ProjectLaunched));
    }

     function adminWithdraw(uint _amountInDollars) onlyRole(DEFAULT_ADMIN_ROLE) isProjectStatus(ProjectStatus.ProjectLaunched) external {
        (bool success, bytes memory data) = transferUsdtToUser(_amountInDollars);
        if(success){
            emit FundsWithdrawalByAdmin(msg.sender, _amountInDollars);
        }else{
            revert USDTTransferError(address(this),msg.sender,convertInUSDT(_amountInDollars));
        }
    }

    function adminDeposit(uint _amountInDollars) onlyRole (DEFAULT_ADMIN_ROLE) isProjectStatus(ProjectStatus.ProjectLaunched) external{
        (bool success, bytes memory data) = transferUsdtToContract(_amountInDollars);
    }

    // INTERNAL FUNCTIONS
    function convertInUSDT(uint _amountInDollars) internal pure returns(uint){
        return _amountInDollars*1;
    }
    function alreadyFunded() internal view returns(uint) {
        return totalSupply() - balanceOf(address(this));
    }
    function transferUsdtToContract(uint _amountInDollars) internal returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),convertInUSDT(_amountInDollars)));
    }
     function transferUsdtToUser(uint _amountInDollars) internal returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", msg.sender, convertInUSDT(_amountInDollars)));
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
        return 6;
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
