// hardhat.config.js
require('@nomiclabs/hardhat-ethers');
const { alchemyApiKey, mnemonic } = require('./secrets.json');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
    url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
    accounts: { mnemonic: mnemonic },
    },
  },
};