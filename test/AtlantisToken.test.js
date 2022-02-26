// test/AtlantisToken.test.js
// Load dependencies
const { expect } = require('chai');

// Start test block
describe('AtlantisToken', function () {
  before(async function () {
    this.AtlantisToken = await ethers.getContractFactory('AtlantisToken');
    this.INITIAL_SUPPLY = 100000000;
  });

  beforeEach(async function () {
    this.atlantisToken = await this.AtlantisToken.deploy(this.INITIAL_SUPPLY);
    await this.atlantisToken.deployed();
  });

  // Test case
  it('totalSupply returns a value of INITIAL_SUPPLY', async function () {
    totalSupply = await this.atlantisToken.totalSupply();
    expect(totalSupply.toString()).to.equal(this.INITIAL_SUPPLY.toString());
  });
});