// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LendingPool contract
 * @dev Main point of interaction with an Atlantis protocol's market
 * - Users can:
 *   # Deposit
 *   # Withdraw
 *   # Borrow
 *   # Repay
 *   # Swap their loans between variable and stable rate
 *   # Enable/disable their deposits as collateral rebalance stable rate borrow positions
 *   # Liquidate positions
 *   # Execute Flash Loans
 * - To be covered by a proxy contract, owned by the LendingPoolAddressesProvider of the specific market
 * - All admin functions are callable by the LendingPoolConfigurator contract defined also in the
 *   LendingPoolAddressesProvider
 * @author Atlantis
 **/
contract LendingPool {
  mapping(address => mapping(address => uint256)) public stakingBalance;
  bool private _paused = false;
  modifier whenNotPaused() {
    _whenNotPaused();
    _;
  }
  
  function _whenNotPaused() internal view {
    require(!_paused, "LP is paused");
  }

  function deposit(address token, 
    uint256 amount) public whenNotPaused {
    require(amount > 0, "Amount must be more than 0");
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    stakingBalance[token][msg.sender] = stakingBalance[token][msg.sender] + amount;
  }
  
  function withdraw(
    address token, 
    uint256 amount) public whenNotPaused {
      uint256 balance = stakingBalance[token][msg.sender];
      require(balance > 0, "Staking balance is now 0");
      require(amount <= balance, "Not enough tokens");
      IERC20(token).transfer(msg.sender, amount);
  }

  function borrow(
    address token,
    uint256 amount,
    uint256 interestRateMode,
    address onBehalfOf
  ) external whenNotPaused {

  }

  function repay(
    address asset,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
  ) external whenNotPaused returns (uint256) {

  }

  function getUserAccountData(address user)
    external
    view
    returns (
      uint256 totalCollateralETH,
      uint256 totalDebtETH,
      uint256 availableBorrowsETH,
      uint256 currentLiquidationThreshold,
      uint256 ltv,
      uint256 healthFactor
    )
  {
    
  }
}