// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CalculateInterest.sol";
import "hardhat/console.sol";

error WrongProjectStatusError(uint _actualStatusActual);
error USDTTransferError(address _from, address _to, uint _amount);

contract BestProject is ERC20, AccessControl {
    event UserInvested(address _investor, uint _amountInDollars);
    event UserAskedForARefund(address _investor, uint _amountInDollars);
    event UserClaimedFunds(address _user,  uint _fundClaimed);
    event ProjectStatusChange(uint _from, uint _to);
    event FundsWithdrawalByAdmin(address _operator, uint _amountInDollars);
    event FundsDepositedByAdmin(address _operator,uint _amount);
    
    

    enum ProjectStatus {
        Crowdfunding,
        Canceled,
        ProjectLaunched,
        ProjectFinished
    }

    ProjectStatus public projectStatus;
    address public usdtContractAddress;
    address public masterContractAddress;
    uint256 public projectDeadline;
    uint256 public interestRateIPB;//IPB = Index Basis Point. So for exemple 100 represents a 1% interest rate
    uint256 public bestFeeRateIPB;
    uint public projectLaunchDate;
    uint public claimedFunds;
    string public desc_link;
    ERC20 public tetherToken;

    bytes32 constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    constructor(
        address _firstOperator,
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
        masterContractAddress=_masterContractAddress;
        usdtContractAddress = _usdtContractAddress;
        projectDeadline = _projectDeadline;
        interestRateIPB = _interestRateIPB;
        bestFeeRateIPB = _bestFeeRateIPB;
        desc_link = _desc_link;

        _grantRole(DEFAULT_ADMIN_ROLE, _firstOperator);
        _mint(address(this), _initialSupply);
        projectLaunchDate = block.timestamp;
        tetherToken=ERC20(usdtContractAddress);
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
    function investInProject(uint _amount) isProjectStatus(ProjectStatus.Crowdfunding) notBlacklist notToMuch(_amount) external {
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if(success){
            _transfer(address(this), msg.sender, _amount);
            emit UserInvested(msg.sender, _amount);
        }else{
            revert USDTTransferError(msg.sender, address(this),_amount);
        }
        if (alreadyFunded()==totalSupply()){
            launchProject();
        }
    }

      function askForARefund(uint _amount) isOneOfProjectStatus(ProjectStatus.Crowdfunding, ProjectStatus.Canceled) notBlacklist external {
        require(balanceOf(msg.sender) >=_amount,"You don't have enough funds");
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if(success){
             _transfer(msg.sender, address(this), _amount);
        emit UserAskedForARefund(msg.sender, _amount);
        }else{
            revert USDTTransferError( address(this), msg.sender ,_amount);
        }   
    }

    function launchProject() isProjectStatus(ProjectStatus.Crowdfunding) internal {
        require(alreadyFunded()==totalSupply(),"Project not funded yet");
        projectStatus = ProjectStatus.ProjectLaunched;
        emit ProjectStatusChange(uint(ProjectStatus.Crowdfunding), uint(ProjectStatus.ProjectLaunched));
    }

     function adminWithdraw(uint _amount) onlyRole(DEFAULT_ADMIN_ROLE) isOneOfProjectStatus(ProjectStatus.ProjectLaunched, ProjectStatus.ProjectFinished) external {
        if(projectStatus== ProjectStatus.ProjectFinished){
            require(tetherToken.balanceOf(address(this))-_amount>=totalAmountWithInterest(),"Can't withdraw too much funds");
        }
        (bool success, bytes memory data) = _transferUsdtToUser(_amount);
        if(success){
            emit FundsWithdrawalByAdmin(msg.sender, _amount);
        }else{
            revert USDTTransferError(address(this),msg.sender,_amount);
        }
    }

    function adminDeposit(uint _amount) onlyRole (DEFAULT_ADMIN_ROLE) isProjectStatus(ProjectStatus.ProjectLaunched) external{
        (bool success, bytes memory data) = _transferUsdtToContract(_amount);
         if(success){
            emit FundsDepositedByAdmin(msg.sender, _amount);
        }else{
            revert USDTTransferError(address(this),msg.sender,_amount);
        }
    }

    function finishProject() onlyRole(DEFAULT_ADMIN_ROLE) isProjectStatus(ProjectStatus.ProjectLaunched)external{
        require(tetherToken.balanceOf(address(this)) >= totalAmountWithInterest());
        (bool success, bytes memory data) = _transferUsdtToMaster(CalculateInterest.calculateFee(_getTimePassedInDays(), totalSupply(), interestRateIPB, bestFeeRateIPB));
            if(success){
                projectStatus = ProjectStatus.ProjectFinished;
                emit ProjectStatusChange(uint(ProjectStatus.ProjectLaunched), uint(projectStatus));
            }else{
                revert USDTTransferError(address(this),masterContractAddress,CalculateInterest.calculateFee(_getTimePassedInDays(), totalSupply(), interestRateIPB, bestFeeRateIPB));
            }
    }

    function claimFundsWithInterest() isProjectStatus (ProjectStatus.ProjectFinished)external{
        (bool success, bytes memory data) = _transferUsdtToUser(CalculateInterest.calculateRealInterest(_getTimePassedInDays(),balanceOf(msg.sender),interestRateIPB,bestFeeRateIPB));
        if(success){
            _burn(msg.sender,balanceOf(msg.sender));
            emit UserClaimedFunds(msg.sender,  balanceOf(msg.sender));
        }else{
            revert USDTTransferError(address(this), msg.sender, balanceOf(msg.sender));
        }
    }

    function totalAmountWithInterest() public view returns(uint){
        totalSupply() + CalculateInterest.calculateInterestWithCompound(_getTimePassedInDays(),totalSupply(),interestRateIPB);
    }

    // INTERNAL OR PRIVATE FUNCTIONS
    function alreadyFunded() internal view returns(uint) {
        return totalSupply() - balanceOf(address(this));
    }
    function _transferUsdtToContract(uint _amount) private returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender,address(this),_amount));
    }
     function _transferUsdtToUser(uint _amount) private returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", msg.sender, _amount));
    }
     function _transferUsdtToMaster(uint _amount) private returns(bool, bytes memory){
        return usdtContractAddress.call(abi.encodeWithSignature("transfer(address,uint256)", masterContractAddress, _amount));
    }
    function _getTimePassedInDays()private view returns(uint){
        return _convertTimeInDays(block.timestamp - projectLaunchDate);
    }
    function _convertTimeInDays(uint _time)private pure returns (uint){
        return _time/86400;
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
    receive() external payable {}
    fallback() external payable{}
 
    
}
