**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [weak-prng](#weak-prng) (1 results) (High)  `OK : Weak Pseudo-Random Number Generator => not a PRNG`
 - [incorrect-equality](#incorrect-equality) (2 results) (Medium)`OK equality only used for gas optimization`
 - [reentrancy-no-eth](#reentrancy-no-eth) (3 results) (Medium) ``HIGH IMPACT GRIEFING ATTACK POSSIBLE : TO BE CORRECTED``
 - [missing-zero-check](#missing-zero-check) (4 results) (Low)`OK_ish : not really supposed to happen, I don't think it is necessary`
 - [reentrancy-benign](#reentrancy-benign) (3 results) (Low)`OK_ish : not a huge impact, but to be corrected anyway`
 - [reentrancy-events](#reentrancy-events) (8 results) (Low)`OK_ish : I don't really see why this would be a problem`
 - [timestamp](#timestamp) (2 results) (Low) `OK only used timestamp to get what day was the project created`
 - [assembly](#assembly) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (4 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [naming-convention](#naming-convention) (32 results) (Informational)
 - [too-many-digits](#too-many-digits) (2 results) (Informational)
 - [unused-import](#unused-import) (2 results) (Informational)
 - [immutable-states](#immutable-states) (9 results) (Optimization)
## weak-prng
Impact: High
Confidence: Medium
 - [ ] ID-0
[CalculateInterest.calculateInterestWithCompound(uint256,uint256,uint256)](contracts/CalculateInterest.sol#L79-L116) uses a weak PRNG: "[(interestWithCompound + calcultateDaysInterest(_loanDurationInDays % 365,_investedAmount + interestWithCompound,_yearlyInterestIPB))](contracts/CalculateInterest.sol#L110-L115)" 

contracts/CalculateInterest.sol#L79-L116


## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-1
[CalculateInterest.calculateInterestWithCompound(uint256,uint256,uint256)](contracts/CalculateInterest.sol#L79-L116) uses a dangerous strict equality:
	- [_loanDurationInDays == 0 || _investedAmount == 0 || _yearlyInterestIPB == 0](contracts/CalculateInterest.sol#L85-L87)

contracts/CalculateInterest.sol#L79-L116


 - [ ] ID-2
[CalculateInterest.calculateRealInterest(uint256,uint256,uint256,uint256)](contracts/CalculateInterest.sol#L15-L50) uses a dangerous strict equality:
	- [_loanDurationInDays == 0 || _investedAmount == 0 || _yearlyInterestIPB == 0](contracts/CalculateInterest.sol#L22-L24)

contracts/CalculateInterest.sol#L15-L50


## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-3
Reentrancy in [BestProject.finishProject()](contracts/BestProject.sol#L277-L315):
	External calls:
	- [(success,data) = _transferUsdtToMaster(calculateFee(_getTimePassedInDays(),totalSupply(),interestRateIPB,bestFeeRateIPB))](contracts/BestProject.sol#L289-L296)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),masterContractAddress,_amount))](contracts/BestProject.sol#L412-L419)
	State variables written after the call(s):
	- [projectStatus = ProjectStatus.ProjectFinished](contracts/BestProject.sol#L298)
	[BestProject.projectStatus](contracts/BestProject.sol#L101) can be used in cross function reentrancies:
	- [BestProject.adminWithdraw(uint256)](contracts/BestProject.sol#L230-L257)
	- [BestProject.finishProject()](contracts/BestProject.sol#L277-L315)
	- [BestProject.isOneOfProjectStatus(BestProject.ProjectStatus,BestProject.ProjectStatus)](contracts/BestProject.sol#L170-L181)
	- [BestProject.isProjectStatus(BestProject.ProjectStatus)](contracts/BestProject.sol#L160-L165)
	- [BestProject.launchProject()](contracts/BestProject.sol#L358-L364)
	- [BestProject.projectStatus](contracts/BestProject.sol#L101)

contracts/BestProject.sol#L277-L315


 - [ ] ID-4
Reentrancy in [BestProject.askForARefund(uint256)](contracts/BestProject.sol#L209-L226):
	External calls:
	- [(success,data) = _transferUsdtToUser(_amount)](contracts/BestProject.sol#L219)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)
	State variables written after the call(s):
	- [_transfer(msg.sender,address(this),_amount)](contracts/BestProject.sol#L221)
		- [_balances[from] = fromBalance - value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L199)
		- [_balances[to] += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L211)
	[ERC20._balances](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L35) can be used in cross function reentrancies:
	- [ERC20._update(address,address,uint256)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L188-L216)
	- [ERC20.balanceOf(address)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L97-L99)

contracts/BestProject.sol#L209-L226


 - [ ] ID-5
Reentrancy in [BestProject.investInProject(uint256)](contracts/BestProject.sol#L187-L205):
	External calls:
	- [(success,data) = _transferUsdtToContract(_amount)](contracts/BestProject.sol#L195)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestProject.sol#L379-L387)
	State variables written after the call(s):
	- [_transfer(address(this),msg.sender,_amount)](contracts/BestProject.sol#L197)
		- [_balances[from] = fromBalance - value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L199)
		- [_balances[to] += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L211)
	[ERC20._balances](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L35) can be used in cross function reentrancies:
	- [ERC20._update(address,address,uint256)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L188-L216)
	- [ERC20.balanceOf(address)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L97-L99)
	- [launchProject()](contracts/BestProject.sol#L203)
		- [projectStatus = ProjectStatus.ProjectLaunched](contracts/BestProject.sol#L359)
	[BestProject.projectStatus](contracts/BestProject.sol#L101) can be used in cross function reentrancies:
	- [BestProject.adminWithdraw(uint256)](contracts/BestProject.sol#L230-L257)
	- [BestProject.finishProject()](contracts/BestProject.sol#L277-L315)
	- [BestProject.isOneOfProjectStatus(BestProject.ProjectStatus,BestProject.ProjectStatus)](contracts/BestProject.sol#L170-L181)
	- [BestProject.isProjectStatus(BestProject.ProjectStatus)](contracts/BestProject.sol#L160-L165)
	- [BestProject.launchProject()](contracts/BestProject.sol#L358-L364)
	- [BestProject.projectStatus](contracts/BestProject.sol#L101)

contracts/BestProject.sol#L187-L205


## missing-zero-check
Impact: Low
Confidence: Medium
 - [ ] ID-6
[BestMaster.constructor(address)._usdtContractAddress](contracts/BestMaster.sol#L52) lacks a zero-check on :
		- [usdtContractAddress = _usdtContractAddress](contracts/BestMaster.sol#L62)

contracts/BestMaster.sol#L52


 - [ ] ID-7
[BestProject.constructor(address,address,address,uint256,uint256,uint256,uint256,string,string)._projectCreator](contracts/BestProject.sol#L116) lacks a zero-check on :
		- [projectCreator = _projectCreator](contracts/BestProject.sol#L134)

contracts/BestProject.sol#L116


 - [ ] ID-8
[BestProject.constructor(address,address,address,uint256,uint256,uint256,uint256,string,string)._usdtContractAddress](contracts/BestProject.sol#L118) lacks a zero-check on :
		- [usdtContractAddress = _usdtContractAddress](contracts/BestProject.sol#L128)

contracts/BestProject.sol#L118


 - [ ] ID-9
[BestProject.constructor(address,address,address,uint256,uint256,uint256,uint256,string,string)._masterContractAddress](contracts/BestProject.sol#L117) lacks a zero-check on :
		- [masterContractAddress = _masterContractAddress](contracts/BestProject.sol#L127)

contracts/BestProject.sol#L117


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-10
Reentrancy in [BestMaster.createProject(uint256,uint256,uint256,string,string)](contracts/BestMaster.sol#L81-L105):
	External calls:
	- [(success,data) = _transferUsdtToContract(projectPriceInDollars * 1000000)](contracts/BestMaster.sol#L88-L90)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestMaster.sol#L144-L152)
	State variables written after the call(s):
	- [bestProjectsAddresses.push(address(project))](contracts/BestMaster.sol#L103)

contracts/BestMaster.sol#L81-L105


 - [ ] ID-11
Reentrancy in [BestProject.askForARefund(uint256)](contracts/BestProject.sol#L209-L226):
	External calls:
	- [(success,data) = _transferUsdtToUser(_amount)](contracts/BestProject.sol#L219)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)
	State variables written after the call(s):
	- [_transfer(msg.sender,address(this),_amount)](contracts/BestProject.sol#L221)
		- [_totalSupply += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L191)
		- [_totalSupply -= value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L206)

contracts/BestProject.sol#L209-L226


 - [ ] ID-12
Reentrancy in [BestProject.investInProject(uint256)](contracts/BestProject.sol#L187-L205):
	External calls:
	- [(success,data) = _transferUsdtToContract(_amount)](contracts/BestProject.sol#L195)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestProject.sol#L379-L387)
	State variables written after the call(s):
	- [_transfer(address(this),msg.sender,_amount)](contracts/BestProject.sol#L197)
		- [_totalSupply += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L191)
		- [_totalSupply -= value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L206)

contracts/BestProject.sol#L187-L205


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-13
Reentrancy in [BestMaster.adminWithdraw(uint256)](contracts/BestMaster.sol#L127-L134):
	External calls:
	- [(success,data) = _transferUsdtToUser(_amount)](contracts/BestMaster.sol#L128)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestMaster.sol#L161-L168)
	Event emitted after the call(s):
	- [FundsWithdrawalByAdmin(msg.sender,_amount)](contracts/BestMaster.sol#L130)

contracts/BestMaster.sol#L127-L134


 - [ ] ID-14
Reentrancy in [BestProject.adminDeposit(uint256)](contracts/BestProject.sol#L261-L274):
	External calls:
	- [(success,data) = _transferUsdtToContract(_amount)](contracts/BestProject.sol#L268)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestProject.sol#L379-L387)
	Event emitted after the call(s):
	- [FundsDepositedByAdmin(msg.sender,_amount)](contracts/BestProject.sol#L270)

contracts/BestProject.sol#L261-L274


 - [ ] ID-15
Reentrancy in [BestProject.adminWithdraw(uint256)](contracts/BestProject.sol#L230-L257):
	External calls:
	- [(success,data) = _transferUsdtToUser(_amount)](contracts/BestProject.sol#L251)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)
	Event emitted after the call(s):
	- [FundsWithdrawalByAdmin(msg.sender,_amount)](contracts/BestProject.sol#L253)

contracts/BestProject.sol#L230-L257


 - [ ] ID-16
Reentrancy in [BestProject.askForARefund(uint256)](contracts/BestProject.sol#L209-L226):
	External calls:
	- [(success,data) = _transferUsdtToUser(_amount)](contracts/BestProject.sol#L219)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)
	Event emitted after the call(s):
	- [Transfer(from,to,value)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L215)
		- [_transfer(msg.sender,address(this),_amount)](contracts/BestProject.sol#L221)
	- [UserAskedForARefund(msg.sender,_amount)](contracts/BestProject.sol#L222)

contracts/BestProject.sol#L209-L226


 - [ ] ID-17
Reentrancy in [BestProject.investInProject(uint256)](contracts/BestProject.sol#L187-L205):
	External calls:
	- [(success,data) = _transferUsdtToContract(_amount)](contracts/BestProject.sol#L195)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestProject.sol#L379-L387)
	Event emitted after the call(s):
	- [ProjectStatusChange(uint256(ProjectStatus.Crowdfunding),uint256(ProjectStatus.ProjectLaunched))](contracts/BestProject.sol#L360-L363)
		- [launchProject()](contracts/BestProject.sol#L203)
	- [Transfer(from,to,value)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L215)
		- [_transfer(address(this),msg.sender,_amount)](contracts/BestProject.sol#L197)
	- [UserInvested(msg.sender,_amount)](contracts/BestProject.sol#L198)

contracts/BestProject.sol#L187-L205


 - [ ] ID-18
Reentrancy in [BestProject.finishProject()](contracts/BestProject.sol#L277-L315):
	External calls:
	- [(success,data) = _transferUsdtToMaster(calculateFee(_getTimePassedInDays(),totalSupply(),interestRateIPB,bestFeeRateIPB))](contracts/BestProject.sol#L289-L296)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),masterContractAddress,_amount))](contracts/BestProject.sol#L412-L419)
	Event emitted after the call(s):
	- [ProjectStatusChange(uint256(ProjectStatus.ProjectLaunched),uint256(projectStatus))](contracts/BestProject.sol#L299-L302)

contracts/BestProject.sol#L277-L315


 - [ ] ID-19
Reentrancy in [BestProject.claimFundsWithInterest()](contracts/BestProject.sol#L318-L342):
	External calls:
	- [(success,data) = _transferUsdtToUser(prevBalance + interest)](contracts/BestProject.sol#L330-L332)
		- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)
	Event emitted after the call(s):
	- [UserClaimedFunds(msg.sender,prevBalance + interest)](contracts/BestProject.sol#L334)

contracts/BestProject.sol#L318-L342


 - [ ] ID-20
Reentrancy in [BestMaster.createProject(uint256,uint256,uint256,string,string)](contracts/BestMaster.sol#L81-L105):
	External calls:
	- [(success,data) = _transferUsdtToContract(projectPriceInDollars * 1000000)](contracts/BestMaster.sol#L88-L90)
		- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestMaster.sol#L144-L152)
	Event emitted after the call(s):
	- [ProjectCreated(address(project),msg.sender)](contracts/BestMaster.sol#L104)

contracts/BestMaster.sol#L81-L105


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-21
[BestProject.finishProject()](contracts/BestProject.sol#L277-L315) uses timestamp for comparisons
	Dangerous comparisons:
	- [tetherToken.balanceOf(address(this)) < totalAmountWithInterest()](contracts/BestProject.sol#L282)

contracts/BestProject.sol#L277-L315


 - [ ] ID-22
[BestProject.adminWithdraw(uint256)](contracts/BestProject.sol#L230-L257) uses timestamp for comparisons
	Dangerous comparisons:
	- [projectStatus == ProjectStatus.ProjectFinished && (tetherToken.balanceOf(address(this)) < totalAmountWithInterest() + _amount)](contracts/BestProject.sol#L241-L243)

contracts/BestProject.sol#L230-L257


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-23
[console._sendLogPayloadImplementation(bytes)](node_modules/hardhat/console.sol#L8-L23) uses assembly
	- [INLINE ASM](node_modules/hardhat/console.sol#L11-L22)

node_modules/hardhat/console.sol#L8-L23


 - [ ] ID-24
[console._castToPure(function(bytes))](node_modules/hardhat/console.sol#L25-L31) uses assembly
	- [INLINE ASM](node_modules/hardhat/console.sol#L28-L30)

node_modules/hardhat/console.sol#L25-L31


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-25
3 different versions of Solidity are used:
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/IAccessControl.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)
	- Version constraint ^0.8.24 is used by:
		-[^0.8.24](contracts/BestMaster.sol#L3)
		-[^0.8.24](contracts/BestProject.sol#L3)
		-[^0.8.24](contracts/CalculateInterest.sol#L2)
	- Version constraint >=0.4.22<0.9.0 is used by:
		-[>=0.4.22<0.9.0](node_modules/hardhat/console.sol#L2)

node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-26
Version constraint ^0.8.24 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
.
It is used by:
	- [^0.8.24](contracts/BestMaster.sol#L3)
	- [^0.8.24](contracts/BestProject.sol#L3)
	- [^0.8.24](contracts/CalculateInterest.sol#L2)

contracts/BestMaster.sol#L3


 - [ ] ID-27
Version constraint >=0.4.22<0.9.0 is too complex.
It is used by:
	- [>=0.4.22<0.9.0](node_modules/hardhat/console.sol#L2)

node_modules/hardhat/console.sol#L2


 - [ ] ID-28
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/IAccessControl.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


 - [ ] ID-29
solc-0.4.17 is an outdated solc version. Use a more recent version (at least 0.8.0), if possible.

## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-30
Low level call in [BestProject._transferUsdtToUser(uint256)](contracts/BestProject.sol#L393-L404):
	- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestProject.sol#L396-L403)

contracts/BestProject.sol#L393-L404


 - [ ] ID-31
Low level call in [BestMaster._transferUsdtToContract(uint256)](contracts/BestMaster.sol#L141-L153):
	- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestMaster.sol#L144-L152)

contracts/BestMaster.sol#L141-L153


 - [ ] ID-32
Low level call in [BestProject._transferUsdtToContract(uint256)](contracts/BestProject.sol#L376-L388):
	- [usdtContractAddress.call(abi.encodeWithSignature(transferFrom(address,address,uint256),msg.sender,address(this),_amount))](contracts/BestProject.sol#L379-L387)

contracts/BestProject.sol#L376-L388


 - [ ] ID-33
Low level call in [BestProject._transferUsdtToMaster(uint256)](contracts/BestProject.sol#L409-L420):
	- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),masterContractAddress,_amount))](contracts/BestProject.sol#L412-L419)

contracts/BestProject.sol#L409-L420


 - [ ] ID-34
Low level call in [BestMaster._transferUsdtToUser(uint256)](contracts/BestMaster.sol#L158-L169):
	- [usdtContractAddress.call(abi.encodeWithSignature(transfer(address,uint256),msg.sender,_amount))](contracts/BestMaster.sol#L161-L168)

contracts/BestMaster.sol#L158-L169


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-35
Parameter [CalculateInterest.calculateRealInterest(uint256,uint256,uint256,uint256)._loanDurationInDays](contracts/CalculateInterest.sol#L16) is not in mixedCase

contracts/CalculateInterest.sol#L16


 - [ ] ID-36
Variable [BestProject.desc_link](contracts/BestProject.sol#L100) is not in mixedCase

contracts/BestProject.sol#L100


 - [ ] ID-37
Parameter [BestMaster.createProject(uint256,uint256,uint256,string,string)._interestRateIPB](contracts/BestMaster.sol#L84) is not in mixedCase

contracts/BestMaster.sol#L84


 - [ ] ID-38
Parameter [BestMaster.createProject(uint256,uint256,uint256,string,string)._projectName](contracts/BestMaster.sol#L86) is not in mixedCase

contracts/BestMaster.sol#L86


 - [ ] ID-39
Parameter [CalculateInterest.calculateRealInterest(uint256,uint256,uint256,uint256)._yearlyInterestIPB](contracts/CalculateInterest.sol#L18) is not in mixedCase

contracts/CalculateInterest.sol#L18


 - [ ] ID-40
Parameter [BestProject.investInProject(uint256)._amount](contracts/BestProject.sol#L188) is not in mixedCase

contracts/BestProject.sol#L188


 - [ ] ID-41
Parameter [BestProject.adminWithdraw(uint256)._amount](contracts/BestProject.sol#L231) is not in mixedCase

contracts/BestProject.sol#L231


 - [ ] ID-42
Parameter [CalculateInterest.calculateInterestWithCompound(uint256,uint256,uint256)._loanDurationInDays](contracts/CalculateInterest.sol#L80) is not in mixedCase

contracts/CalculateInterest.sol#L80


 - [ ] ID-43
Function [CalculateInterest._IPBToMilliIPB(uint256)](contracts/CalculateInterest.sol#L163-L165) is not in mixedCase

contracts/CalculateInterest.sol#L163-L165


 - [ ] ID-44
Parameter [CalculateInterest.calculateAYearInterest(uint256,uint256)._yearlyInterestIPB](contracts/CalculateInterest.sol#L140) is not in mixedCase

contracts/CalculateInterest.sol#L140


 - [ ] ID-45
Parameter [BestMaster.createProject(uint256,uint256,uint256,string,string)._desc_link](contracts/BestMaster.sol#L85) is not in mixedCase

contracts/BestMaster.sol#L85


 - [ ] ID-46
Contract [console](node_modules/hardhat/console.sol#L4-L1552) is not in CapWords

node_modules/hardhat/console.sol#L4-L1552


 - [ ] ID-47
Parameter [BestProject.adminDeposit(uint256)._amount](contracts/BestProject.sol#L262) is not in mixedCase

contracts/BestProject.sol#L262


 - [ ] ID-48
Parameter [CalculateInterest.calculateFee(uint256,uint256,uint256,uint256)._loanDurationInDays](contracts/CalculateInterest.sol#L58) is not in mixedCase

contracts/CalculateInterest.sol#L58


 - [ ] ID-49
Parameter [CalculateInterest.calculateAYearInterest(uint256,uint256)._investedAmount](contracts/CalculateInterest.sol#L139) is not in mixedCase

contracts/CalculateInterest.sol#L139


 - [ ] ID-50
Parameter [CalculateInterest.calculateFee(uint256,uint256,uint256,uint256)._feeRateIPB](contracts/CalculateInterest.sol#L61) is not in mixedCase

contracts/CalculateInterest.sol#L61


 - [ ] ID-51
Parameter [CalculateInterest._IPBToMilliIPB(uint256)._interestIPB](contracts/CalculateInterest.sol#L163) is not in mixedCase

contracts/CalculateInterest.sol#L163


 - [ ] ID-52
Parameter [CalculateInterest.calculateRealInterest(uint256,uint256,uint256,uint256)._investedAmount](contracts/CalculateInterest.sol#L17) is not in mixedCase

contracts/CalculateInterest.sol#L17


 - [ ] ID-53
Parameter [BestMaster.setFeeRate(uint256)._feeRate](contracts/BestMaster.sol#L119) is not in mixedCase

contracts/BestMaster.sol#L119


 - [ ] ID-54
Parameter [CalculateInterest.calculateFee(uint256,uint256,uint256,uint256)._yearlyInterestIPB](contracts/CalculateInterest.sol#L60) is not in mixedCase

contracts/CalculateInterest.sol#L60


 - [ ] ID-55
Parameter [CalculateInterest.calcultateDaysInterest(uint256,uint256,uint256)._yearlyInterestIPB](contracts/CalculateInterest.sol#L127) is not in mixedCase

contracts/CalculateInterest.sol#L127


 - [ ] ID-56
Parameter [BestMaster.createProject(uint256,uint256,uint256,string,string)._projectDeadline](contracts/BestMaster.sol#L83) is not in mixedCase

contracts/BestMaster.sol#L83


 - [ ] ID-57
Parameter [BestMaster.setProjectPriceInDollars(uint256)._projectPriceInDollars](contracts/BestMaster.sol#L112) is not in mixedCase

contracts/BestMaster.sol#L112


 - [ ] ID-58
Parameter [CalculateInterest.calculateInterestWithCompound(uint256,uint256,uint256)._yearlyInterestIPB](contracts/CalculateInterest.sol#L82) is not in mixedCase

contracts/CalculateInterest.sol#L82


 - [ ] ID-59
Parameter [CalculateInterest.calculateFee(uint256,uint256,uint256,uint256)._investedAmount](contracts/CalculateInterest.sol#L59) is not in mixedCase

contracts/CalculateInterest.sol#L59


 - [ ] ID-60
Parameter [BestProject.askForARefund(uint256)._amount](contracts/BestProject.sol#L210) is not in mixedCase

contracts/BestProject.sol#L210


 - [ ] ID-61
Parameter [BestMaster.createProject(uint256,uint256,uint256,string,string)._initialSupply](contracts/BestMaster.sol#L82) is not in mixedCase

contracts/BestMaster.sol#L82


 - [ ] ID-62
Parameter [CalculateInterest.calcultateDaysInterest(uint256,uint256,uint256)._investedAmount](contracts/CalculateInterest.sol#L126) is not in mixedCase

contracts/CalculateInterest.sol#L126


 - [ ] ID-63
Parameter [CalculateInterest.calculateInterestWithCompound(uint256,uint256,uint256)._investedAmount](contracts/CalculateInterest.sol#L81) is not in mixedCase

contracts/CalculateInterest.sol#L81


 - [ ] ID-64
Parameter [BestMaster.adminWithdraw(uint256)._amount](contracts/BestMaster.sol#L127) is not in mixedCase

contracts/BestMaster.sol#L127


 - [ ] ID-65
Parameter [CalculateInterest.calculateRealInterest(uint256,uint256,uint256,uint256)._feeRateIPB](contracts/CalculateInterest.sol#L19) is not in mixedCase

contracts/CalculateInterest.sol#L19


 - [ ] ID-66
Parameter [CalculateInterest.calcultateDaysInterest(uint256,uint256,uint256)._loanDurationInDays](contracts/CalculateInterest.sol#L125) is not in mixedCase

contracts/CalculateInterest.sol#L125


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-67
[CalculateInterest.calcultateDaysInterest(uint256,uint256,uint256)](contracts/CalculateInterest.sol#L124-L133) uses literals with too many digits:
	- [(_yearlyIPBToDailyMilliIPB(_yearlyInterestIPB) * _loanDurationInDays * _investedAmount) / 10000000](contracts/CalculateInterest.sol#L129-L132)

contracts/CalculateInterest.sol#L124-L133


 - [ ] ID-68
[BestMaster.createProject(uint256,uint256,uint256,string,string)](contracts/BestMaster.sol#L81-L105) uses literals with too many digits:
	- [(success,data) = _transferUsdtToContract(projectPriceInDollars * 1000000)](contracts/BestMaster.sol#L88-L90)

contracts/BestMaster.sol#L81-L105


## unused-import
Impact: Informational
Confidence: High
 - [ ] ID-69
The following unused import(s) in contracts/BestProject.sol should be removed:
	-import "hardhat/console.sol"; (contracts/BestProject.sol#8)

 - [ ] ID-70
The following unused import(s) in contracts/BestMaster.sol should be removed:
	-import "hardhat/console.sol"; (contracts/BestMaster.sol#8)

	-import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; (contracts/BestMaster.sol#6)

## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-71
[BestMaster.usdtContractAddress](contracts/BestMaster.sol#L48) should be immutable 

contracts/BestMaster.sol#L48


 - [ ] ID-72
[BestProject.tetherToken](contracts/BestProject.sol#L91) should be immutable 

contracts/BestProject.sol#L91


 - [ ] ID-73
[BestProject.projectDeadline](contracts/BestProject.sol#L96) should be immutable 

contracts/BestProject.sol#L96


 - [ ] ID-74
[BestProject.projectLaunchDate](contracts/BestProject.sol#L99) should be immutable 

contracts/BestProject.sol#L99


 - [ ] ID-75
[BestProject.interestRateIPB](contracts/BestProject.sol#L97) should be immutable 

contracts/BestProject.sol#L97


 - [ ] ID-76
[BestProject.masterContractAddress](contracts/BestProject.sol#L94) should be immutable 

contracts/BestProject.sol#L94


 - [ ] ID-77
[BestProject.bestFeeRateIPB](contracts/BestProject.sol#L98) should be immutable 

contracts/BestProject.sol#L98


 - [ ] ID-78
[BestProject.projectCreator](contracts/BestProject.sol#L95) should be immutable 

contracts/BestProject.sol#L95


 - [ ] ID-79
[BestProject.usdtContractAddress](contracts/BestProject.sol#L93) should be immutable 

contracts/BestProject.sol#L93


