// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

/// @title Callback for IAtlantisV1PoolActions#mint
/// @notice Any contract that calls IAtlantisV1PoolActions#mint must implement this interface
interface IAtlantisV1MintCallback {
    /// @notice Called to `msg.sender` after minting liquidity to a position from IAtlantisV1Pool#mint.
    /// @dev In the implementation you must pay the pool tokens owed for the minted liquidity.
    /// The caller of this method must be checked to be a AtlantisV1Pool deployed by the canonical AtlantisV1Factory.
    /// @param amount0Owed The amount of token0 due to the pool for the minted liquidity
    /// @param amount1Owed The amount of token1 due to the pool for the minted liquidity
    /// @param data Any data passed through by the caller via the IAtlantisV1PoolActions#mint call
    function AtlantisV1MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external;
}