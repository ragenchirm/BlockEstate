// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract BestProject is ERC20 {
    enum ProjectStatus{Crowdfunding, Canceled, Funded, InProgress, Finished}
    uint256 public rate = 1;
    uint256 public initialSupply;
    uint public finFinancement;
    uint public echeance;
    ProjectStatus public projectStatus; // CHange to Enum
    uint public taux;
    uint public marckup;
    string public desc_link;


    constructor(uint256 _initialSupply, uint _finFinancement, uint _echeance, uint _taux, uint _marckup, string memory _desc_link) ERC20("Project Debt", "BEP") {
        _mint(msg.sender, _initialSupply);
    finFinancement = _finFinancement;
    echeance = _echeance;
    taux = _taux;
    marckup = _marckup;
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
