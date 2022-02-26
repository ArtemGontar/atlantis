const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider('https://rinkeby.infura.io/v3/da52061ed5a94d03949fb39417aa8b7e'));

eth.getBlockByNumber(45300, true, (err, block) => {
  // result null { ...block data... }
  console.log(block)
});

const etherValue = Eth.toWei(72, 'ether');

// result <BN: 3e733628714200000>

const tokenABI = [{
  "constant": true,
  "inputs": [],
  "name": "totalSupply",
  "outputs":[{"name": "","type": "uint256"}],
  "payable": false,
  "type": "function",
}];

const token = eth.contract(tokenABI).at('0x6e0E0e02377Bc1d90E8a7c21f12BA385C2C35f78');

token.totalSupply().then((totalSupply) => {
  // result <BN ...>  4500000
});

// token.transfer( ... ).then(txHash => eth.getTransactionSuccess(txHash)).then(receipt => console.log(receipt));