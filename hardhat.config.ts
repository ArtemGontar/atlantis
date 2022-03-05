// hardhat.config.js
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-waffle";
const { alchemyApiKey, mnemonic } = require('./secrets.json');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  solidity: "0.8.11",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
      accounts: { mnemonic: mnemonic },
    },
  },
};