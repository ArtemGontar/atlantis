import { describe } from "mocha";
import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from "chai";
import { FeeAmount, TICK_SPACINGS } from "./helpers/utilities";

const { constants } = ethers
const TEST_TOKEN_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000',
]

describe("Factory", function(){
  let wallet: Wallet, other: Wallet
  let factory: any
  before(async function () {
    this.Factory = await ethers.getContractFactory('AtlantisV1Factory');
    [wallet, other] = await (ethers as any).getSigners()
  });

  beforeEach(async function () {
    factory = await this.Factory.deploy();
    await factory.deployed();
  });

  it('owner is deployer', async function () {
    //Assert
    expect(await factory.owner(), 'owner').to.equal(wallet.address)
  })

  it('initial enabled fee amounts', async function () {
    //Assert
    expect(await factory.feeAmountTickSpacing(FeeAmount.LOW)).to.eq(TICK_SPACINGS[FeeAmount.LOW])
    expect(await factory.feeAmountTickSpacing(FeeAmount.MEDIUM)).to.eq(TICK_SPACINGS[FeeAmount.MEDIUM])
    expect(await factory.feeAmountTickSpacing(FeeAmount.HIGH)).to.eq(TICK_SPACINGS[FeeAmount.HIGH])
  })

  it('createPool should be succeeds', async function () {
    // Arrange
    const feeAmount = 500;
    // Act
    const pool = await factory.createPool(TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[1], feeAmount);
    // Assert
    console.log(pool)
    expect(pool, 'pool').to.not.equal(undefined)
  })

  it('createPool should be succeeds if passed in reverse', async function () {
    
  })

  it('createPool twice should be reverted second creation', async function () {
    
  })

  it('createPool should be succeeds for low fee pool', async function () {
    
  })

  it('createPool should be succeeds for medium fee pool', async function () {
    
  })

  it('createPool should be succeeds for high fee pool', async function () {
    
  })

  it('createPool should fail if fee not enabled', async function () {
    
  })

  it('createPool should fail if token0 = token1', async function () {
    
  })

  it('createPool should fail if token0 or token1 is 0', async function () {
    
  })

})