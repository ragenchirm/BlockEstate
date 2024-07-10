// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CalculateInterest {
    // PUBLIC FUNCTIONS
    function calculateRealInterest(
        uint _loanDurationInDays,
        uint _investedAmount,
        uint _yearlyInterestIPB,
        uint _feeRateIPB
    ) public pure returns (uint256) {
        if (
            _loanDurationInDays == 0 ||
            _investedAmount == 0 ||
            _yearlyInterestIPB == 0
        ) {
            //to save gas
            return 0;
        }
        if (_feeRateIPB == 0) {
            //to save gas
            return
                calculateInterestWithCompound(
                    _loanDurationInDays,
                    _investedAmount,
                    _yearlyInterestIPB
                );
        }
        return
            calculateInterestWithCompound(
                _loanDurationInDays,
                _investedAmount,
                _yearlyInterestIPB
            ) -
            calculateFee(
                _loanDurationInDays,
                _investedAmount,
                _yearlyInterestIPB,
                _feeRateIPB
            );
    }

    function calculateFee(
        uint _loanDurationInDays,
        uint _investedAmount,
        uint _yearlyInterestIPB,
        uint _feeRateIPB
    ) public pure returns (uint) {
        if (_feeRateIPB == 0) {
            return 0;
        } //to save gas
        return
            (_feeRateIPB *
                calculateInterestWithCompound(
                    _loanDurationInDays,
                    _investedAmount,
                    _yearlyInterestIPB
                )) / 10000;
    }

    function calculateInterestWithCompound(
        uint _loanDurationInDays,
        uint _investedAmount,
        uint _yearlyInterestIPB
    ) public pure returns (uint256) {
        if (
            _loanDurationInDays == 0 ||
            _investedAmount == 0 ||
            _yearlyInterestIPB == 0
        ) {
            //to save gas
            return 0;
        }
        if (_loanDurationInDays <= 365) {
            return
                calcultateDaysInterest(
                    _loanDurationInDays,
                    _investedAmount,
                    _yearlyInterestIPB
                );
        }
        uint interestWithCompound;
        for (uint _i = 0; _i < _loanDurationInDays / 365; _i++) {
            //We ignore bisextil years for calcul of compound
            interestWithCompound =
                interestWithCompound +
                calculateAYearInterest(
                    _investedAmount + interestWithCompound,
                    _yearlyInterestIPB
                );
        }
        return (interestWithCompound +
            calcultateDaysInterest(
                _loanDurationInDays % 365,
                _investedAmount + interestWithCompound,
                _yearlyInterestIPB
            ));
    }

    //PRIVATE FUNCTIONS
    function calcultateDaysInterest(
        uint _loanDurationInDays,
        uint _investedAmount,
        uint _yearlyInterestIPB
    ) private pure returns (uint256) {
        return
            (_yearlyIPBToDailyMilliIPB(_yearlyInterestIPB) *
                _loanDurationInDays *
                _investedAmount) / 10000000;
    }

    function calculateAYearInterest(
        uint _investedAmount,
        uint _yearlyInterestIPB
    ) private pure returns (uint) {
        return (_investedAmount * _yearlyInterestIPB) / 10000;
    }

    function _yearlyIPBToDailyMilliIPB(
        uint _yearlyInterestIPB
    ) private pure returns (uint) {
        return _yearlyToDailyInterest(_IPBToMilliIPB(_yearlyInterestIPB));
    }

    function _yearlyToDailyInterest(
        uint _yearlyInterest
    ) private pure returns (uint) {
        return (_yearlyInterest * 100) / 36525;
    }

    function _IPBToMilliIPB(uint _interestIPB) private pure returns (uint) {
        return _interestIPB * 1000;
    }
}
