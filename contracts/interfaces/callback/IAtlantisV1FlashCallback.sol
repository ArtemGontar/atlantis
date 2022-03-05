// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

/// @title Callback for IAtlantisV1PoolActions#flash
/// @notice Any contract that calls IAtlantisV1PoolActions#flash must implement this interface
interface IAtlantisV1FlashCallback {
    /// @notice Called to `msg.sender` after transferring to the recipient from IAtlantisV1Pool#flash.
    /// @dev In the implementation you must repay the pool the tokens sent by flash plus the computed fee amounts.
    /// The caller of this method must be checked to be a AtlantisV1Pool deployed by the canonical AtlantisV1Factory.
    /// @param fee0 The fee amount in token0 due to the pool by the end of the flash
    /// @param fee1 The fee amount in token1 due to the pool by the end of the flash
    /// @param data Any data passed through by the caller via the IAtlantisV1PoolActions#flash call
    function AtlantisV1FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external;
}