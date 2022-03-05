// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IAtlantisV1PoolImmutables.sol';
import './IAtlantisV1PoolDerivedState.sol';
import './IAtlantisV1PoolState.sol';
import './IAtlantisV1PoolActions.sol';
import './IAtlantisV1PoolEvents.sol';

/// @title The interface for a Atlantis V1 Pool
/// @notice A Atlantis pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IAtlantisV1Pool is
    IAtlantisV1PoolImmutables,
    IAtlantisV1PoolState,
    IAtlantisV1PoolDerivedState,
    IAtlantisV1PoolActions,
    IAtlantisV1PoolEvents
{

}