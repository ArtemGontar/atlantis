import { describe } from "mocha"
import { expect } from "chai"
import { ethers } from 'hardhat'

const TEST_TOKEN_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000',
]

const TEST_FACTORY_ADDRESS: string = '0x3000000000000000000000000000000000000000'

describe("PoolDeployer", function(){
  before(async function() {
    this.PoolDeployer = await ethers.getContractFactory('TestAtlantisV1PoolDeployer');
  })

  beforeEach(async function () {
    this.poolDeployer = await this.PoolDeployer.deploy();
    await this.poolDeployer.deployed();
  })

  it('deploy should return non zero address', async function () {
    // Arrange
    const feeAmount = 500;
    const tickSpacing = 10;
    // Act
    const pool = await this.poolDeployer._deploy(TEST_FACTORY_ADDRESS, TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[1], feeAmount, tickSpacing);
    // Assert
    expect(pool, 'pool').to.not.equal(undefined)
  })
})