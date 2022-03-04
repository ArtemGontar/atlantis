// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './../AtlantisV1PoolDeployer.sol';

contract TestAtlantisV1PoolDeployer is AtlantisV1PoolDeployer {
  function _deploy(
    address factory,
    address token0,
    address token1,
    uint24 fee,
    int24 tickSpacing
  ) external returns (address pool) {
    pool = deploy(factory, token0, token1, fee, tickSpacing);
  }
}