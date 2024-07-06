// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract BestProject is ERC20 {
    enum ProjectStatus {
        Crowdfunding,
        Canceled,
        Funded,
        InProgress,
        Finished
    }
    uint256 public rate = 1;
    uint256 public initialSupply;
    uint256 public fundingDeadline;
    uint256 public projectDeadline;
    uint256 public interestRate;
    uint256 public bestMarckup;
    string public desc_link;

    constructor(
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestMarckup,
        string memory _desc_link
    ) ERC20("Project Debt", "BEP") {
        _mint(msg.sender, _initialSupply);
        fundingDeadline = _fundingDeadline;
        projectDeadline = _projectDeadline;
        interestRate = _interestRate;
        bestMarckup = _bestMarckup;
        desc_link = _desc_link;
    }

    receive() external payable {
        require(msg.value >= 0.1 ether, "you can't send less than 0.1eth");
        distribute(msg.value);
    }

    function distribute(uint256 _amount) internal {
        uint256 tokensToSend = _amount * rate;
        transfer(msg.sender, tokensToSend);
    }
}
