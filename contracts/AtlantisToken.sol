// SPDX-Licence-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AtlantisToken is ERC20 {
  constructor(uint256 initSupply) ERC20("Atlantis", "ATL"){
    _mint(msg.sender, initSupply);
  }
}