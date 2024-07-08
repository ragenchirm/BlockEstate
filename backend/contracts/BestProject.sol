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
    uint256 public initialSupply;
    uint256 public fundingDeadline;
    uint256 public projectDeadline;
    uint256 public interestRate;
    uint256 public bestFee;
    string public desc_link;

    constructor(
        uint256 _initialSupply,
        uint256 _fundingDeadline,
        uint256 _projectDeadline,
        uint256 _interestRate,
        uint256 _bestFee,
        string memory _desc_link
    ) ERC20("Block Estate Token", "BEST") {
        _mint(msg.sender, _initialSupply);
        fundingDeadline = _fundingDeadline;
        projectDeadline = _projectDeadline;
        interestRate = _interestRate;
        bestFee = _bestFee;
        desc_link = _desc_link;
        console.log("NOUVEAU PROJEEEEEET");
        console.log(msg.sender);
        console.log("FIN NOUVEAU PROJEEEEEET");
    }

    receive() external payable {
        require(msg.value >= 0.1 ether, "you can't send less than 0.1eth");
        distribute(msg.value);
    }

    function distribute(uint256 _amount) internal {
        uint256 tokensToSend = _amount;
        transfer(msg.sender, tokensToSend);
    }
}
