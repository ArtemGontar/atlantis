// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WethMock is ERC20 {
  constructor(uint256 initSupply) ERC20("Wrapped ETH", "WETH"){
    _mint(msg.sender, initSupply);
  }
}