// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IAtlantisV1Pool.sol';
import './interfaces/IAtlantisV1Factory.sol';
import './interfaces/IAtlantisV1PoolDeployer.sol';
import './interfaces/IERC20Minimal.sol';

import './NoDelegateCall.sol';

import './libraries/Tick.sol';
import './libraries/TickMath.sol';
import './libraries/Oracle.sol';
import './libraries/Position.sol';

contract AtlantisV1Pool is IAtlantisV1Pool, NoDelegateCall {   
//   using LowGasSafeMath for uint256;
//   using LowGasSafeMath for int256;
//   using SafeCast for uint256;
//   using SafeCast for int256;
//   using Tick for mapping(int24 => Tick.Info);
//   using TickBitmap for mapping(int16 => uint256);
//   using Position for mapping(bytes32 => Position.Info);
//   using Position for Position.Info;

  /// @inheritdoc IAtlantisV1PoolImmutables
  address public immutable override factory;
  /// @inheritdoc IAtlantisV1PoolImmutables
  address public immutable override token0;
  /// @inheritdoc IAtlantisV1PoolImmutables
  address public immutable override token1;
  /// @inheritdoc IAtlantisV1PoolImmutables
  uint24 public immutable override fee;
  /// @inheritdoc IAtlantisV1PoolImmutables
  int24 public immutable override tickSpacing;
  /// @inheritdoc IAtlantisV1PoolImmutables
  uint128 public immutable override maxLiquidityPerTick;
  
  struct Slot0 {
    // the current price
    uint160 sqrtPriceX96;
    // the current tick
    int24 tick;
    // the most-recently updated index of the observations array
    uint16 observationIndex;
    // the current maximum number of observations that are being stored
    uint16 observationCardinality;
    // the next maximum number of observations to store, triggered in observations.write
    uint16 observationCardinalityNext;
    // the current protocol fee as a percentage of the swap fee taken on withdrawal
    // represented as an integer denominator (1/x)%
    uint8 feeProtocol;
    // whether the pool is locked
    bool unlocked;
  }

  /// @inheritdoc IAtlantisV1PoolState
  Slot0 public override slot0;

  /// @inheritdoc IAtlantisV1PoolState
  uint256 public override feeGrowthGlobal0X128;
  /// @inheritdoc IAtlantisV1PoolState
  uint256 public override feeGrowthGlobal1X128;

  // accumulated protocol fees in token0/token1 units
  struct ProtocolFees {
      uint128 token0;
      uint128 token1;
  }
  
  /// @inheritdoc IAtlantisV1PoolState
  ProtocolFees public override protocolFees;

  /// @inheritdoc IAtlantisV1PoolState
  uint128 public override liquidity;

  /// @inheritdoc IAtlantisV1PoolState
  mapping(int24 => Tick.Info) public override ticks;
  /// @inheritdoc IAtlantisV1PoolState
  mapping(int16 => uint256) public override tickBitmap;
  /// @inheritdoc IAtlantisV1PoolState
  mapping(bytes32 => Position.Info) public override positions;
  /// @inheritdoc IAtlantisV1PoolState
  Oracle.Observation[65535] public override observations;

  modifier onlyFactoryOwner() {
    require(msg.sender == IAtlantisV1Factory(factory).owner());
    _;
  }

  constructor() {
    int24 _tickSpacing;
    (factory, token0, token1, fee, _tickSpacing) = IAtlantisV1PoolDeployer(msg.sender).parameters();
    tickSpacing = _tickSpacing;

    maxLiquidityPerTick = Tick.tickSpacingToMaxLiquidityPerTick(_tickSpacing);
  }

  /// @dev Common checks for valid tick inputs.
  function checkTicks(int24 tickLower, int24 tickUpper) private pure {
      require(tickLower < tickUpper, 'TLU');
      require(tickLower >= TickMath.MIN_TICK, 'TLM');
      require(tickUpper <= TickMath.MAX_TICK, 'TUM');
  }

  /// @dev Returns the block timestamp truncated to 32 bits, i.e. mod 2**32.
  function _blockTimestamp() internal view virtual returns (uint32) {
      return uint32(block.timestamp); // truncation is desired
  }

  /// @dev Get the pool's balance of token0
  /// @dev This function is gas optimized to avoid a redundant extcodesize check
  /// in addition to the returndatasize check
  function balance0() private view returns (uint256) {
      (bool success, bytes memory data) =
          token0.staticcall(abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, address(this)));
      require(success && data.length >= 32);
      return abi.decode(data, (uint256));
  }

  /// @dev Get the pool's balance of token1
  /// @dev This function is gas optimized to avoid a redundant extcodesize check
  /// in addition to the returndatasize check
  function balance1() private view returns (uint256) {
      (bool success, bytes memory data) =
          token1.staticcall(abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, address(this)));
      require(success && data.length >= 32);
      return abi.decode(data, (uint256));
  }

  /// @inheritdoc IAtlantisV1PoolDerivedState
  function snapshotCumulativesInside(int24 tickLower, int24 tickUpper)
    external view override noDelegateCall
    returns (
        int56 tickCumulativeInside,
        uint160 secondsPerLiquidityInsideX128,
        uint32 secondsInside)
  {    
    // checkTicks(tickLower, tickUpper);

    // int56 tickCumulativeLower;
    // int56 tickCumulativeUpper;
    // uint160 secondsPerLiquidityOutsideLowerX128;
    // uint160 secondsPerLiquidityOutsideUpperX128;
    // uint32 secondsOutsideLower;
    // uint32 secondsOutsideUpper;
    // {
    //     Tick.Info storage lower = ticks[tickLower];
    //     Tick.Info storage upper = ticks[tickUpper];
    //     bool initializedLower;
    //     (tickCumulativeLower, secondsPerLiquidityOutsideLowerX128, secondsOutsideLower, initializedLower) = (
    //         lower.tickCumulativeOutside,
    //         lower.secondsPerLiquidityOutsideX128,
    //         lower.secondsOutside,
    //         lower.initialized
    //     );
    //     require(initializedLower);

    //     bool initializedUpper;
    //     (tickCumulativeUpper, secondsPerLiquidityOutsideUpperX128, secondsOutsideUpper, initializedUpper) = (
    //         upper.tickCumulativeOutside,
    //         upper.secondsPerLiquidityOutsideX128,
    //         upper.secondsOutside,
    //         upper.initialized
    //     );
    //     require(initializedUpper);
    // }

    // Slot0 memory _slot0 = slot0;

    // if (_slot0.tick < tickLower) {
    //     return (
    //         tickCumulativeLower - tickCumulativeUpper,
    //         secondsPerLiquidityOutsideLowerX128 - secondsPerLiquidityOutsideUpperX128,
    //         secondsOutsideLower - secondsOutsideUpper
    //     );
    // } 
    // else if (_slot0.tick < tickUpper) {
    //     uint32 time = _blockTimestamp();
    //     (int56 tickCumulative, uint160 secondsPerLiquidityCumulativeX128) =
    //         observations.observeSingle(
    //             time,
    //             0,
    //             _slot0.tick,
    //             _slot0.observationIndex,
    //             liquidity,
    //             _slot0.observationCardinality
    //         );
    //     return (
    //         tickCumulative - tickCumulativeLower - tickCumulativeUpper,
    //         secondsPerLiquidityCumulativeX128 -
    //             secondsPerLiquidityOutsideLowerX128 -
    //             secondsPerLiquidityOutsideUpperX128,
    //         time - secondsOutsideLower - secondsOutsideUpper
    //     );
    // } else {
    //     return (
    //         tickCumulativeUpper - tickCumulativeLower,
    //         secondsPerLiquidityOutsideUpperX128 - secondsPerLiquidityOutsideLowerX128,
    //         secondsOutsideUpper - secondsOutsideLower
    //     );
    // }
  }

  /// @inheritdoc IAtlantisV1PoolDerivedState
  function observe(uint32[] calldata secondsAgos)
      external
      view
      override
      noDelegateCall
      returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
  {
    // return observations.observe(
    //   _blockTimestamp(),
    //   secondsAgos,
    //   slot0.tick,
    //   slot0.observationIndex,
    //   liquidity,
    //   slot0.observationCardinality
    // );
  }


}