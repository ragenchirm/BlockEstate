// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CalculateInterest Contract
/// @notice This contract provides functions to calculate compound interest, fees, and real interest.
/// @dev All functions are pure and operate on provided parameters without modifying the state.
contract CalculateInterest {
    // PUBLIC FUNCTIONS
    /// @notice Calculates the real interest earned after subtracting fees
    /// @param _loanDurationInDays The duration of the loan in days
    /// @param _investedAmount The amount invested
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @param _feeRateIPB The fee rate in Index Basis Points (IPB)
    /// @return The real interest earned after fees
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
    /// @notice Calculates the fee based on the loan duration, amount invested, yearly interest, and fee rate
    /// @param _loanDurationInDays The duration of the loan in days
    /// @param _investedAmount The amount invested
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @param _feeRateIPB The fee rate in Index Basis Points (IPB)
    /// @return The calculated fee
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
    /// @notice Calculates compound interest based on the loan duration, amount invested, and yearly interest
    /// @param _loanDurationInDays The duration of the loan in days
    /// @param _investedAmount The amount invested
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @return The calculated compound interest
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
    /// @notice Calculates daily interest based on the loan duration, amount invested, and yearly interest
    /// @param _loanDurationInDays The duration of the loan in days
    /// @param _investedAmount The amount invested
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @return The calculated daily interest
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
    /// @notice Calculates yearly interest based on the amount invested and yearly interest
    /// @param _investedAmount The amount invested
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @return The calculated yearly interest
    function calculateAYearInterest(
        uint _investedAmount,
        uint _yearlyInterestIPB
    ) private pure returns (uint) {
        return (_investedAmount * _yearlyInterestIPB) / 10000;
    }
    /// @notice Converts yearly interest in IPB to daily interest in milliIPB
    /// @param _yearlyInterestIPB The yearly interest rate in Index Basis Points (IPB)
    /// @return The daily interest rate in milliIPB
    function _yearlyIPBToDailyMilliIPB(
        uint _yearlyInterestIPB
    ) private pure returns (uint) {
        return _yearlyToDailyInterest(_IPBToMilliIPB(_yearlyInterestIPB));
    }
    /// @notice Converts yearly interest to daily interest
    /// @param _yearlyInterest The yearly interest rate
    /// @return The daily interest rate
    function _yearlyToDailyInterest(
        uint _yearlyInterest
    ) private pure returns (uint) {
        return (_yearlyInterest * 100) / 36525;
    }
    /// @notice Converts interest rate from IPB to milliIPB
    /// @param _interestIPB The interest rate in Index Basis Points (IPB)
    /// @return The interest rate in milliIPB
    function _IPBToMilliIPB(uint _interestIPB) private pure returns (uint) {
        return _interestIPB * 1000;
    }
}
