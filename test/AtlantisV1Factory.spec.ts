import { describe } from "mocha";
import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from "chai";
import { AtlantisV1Factory } from '../typechain-types/AtlantisV1Factory'
import { FeeAmount, TICK_SPACINGS, getCreate2Address } from "./helpers/utilities";

const { constants } = ethers
const TEST_TOKEN_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000',
]

describe("Factory", function(){
  let wallet: Wallet, other: Wallet
  let factory: AtlantisV1Factory
  let poolBytecode: string

  before('deploy factory', async function () {
    this.Factory = await ethers.getContractFactory('AtlantisV1Factory');
    [wallet, other] = await (ethers as any).getSigners()
  });

  before('load pool bytecode', async () => {
    poolBytecode = (await ethers.getContractFactory('AtlantisV1Pool')).bytecode
  })

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

  async function createAndCheckPool(tokens: [string, string], 
    feeAmount: FeeAmount,
    tickSpacing: number = TICK_SPACINGS[feeAmount]) {
      const create2Address = getCreate2Address(factory.address, tokens, feeAmount, poolBytecode)
      const create = await factory.createPool(tokens[0], tokens[1], feeAmount);
      await expect(create)
        .to.emit(factory, 'PoolCreated')
        .withArgs(TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[1], feeAmount, tickSpacing, create2Address)
      await expect(factory.createPool(tokens[0], tokens[1], feeAmount)).to.be.reverted
      await expect(factory.createPool(tokens[1], tokens[0], feeAmount)).to.be.reverted
      expect(await factory.getPool(tokens[0], tokens[1], feeAmount), 'getPool in order').to.eq(create2Address)
      expect(await factory.getPool(tokens[1], tokens[0], feeAmount), 'getPool in reverse').to.eq(create2Address)
      
      const poolContractFactory = await ethers.getContractFactory('AtlantisV1Pool')
      // const pool = poolContractFactory.attach(create2Address)
      // expect(await pool.factory(), 'pool factory address').to.eq(factory.address)
      // expect(await pool.token0(), 'pool token0').to.eq(TEST_TOKEN_ADDRESSES[0])
      // expect(await pool.token1(), 'pool token1').to.eq(TEST_TOKEN_ADDRESSES[1])
      // expect(await pool.fee(), 'pool fee').to.eq(feeAmount)
      // expect(await pool.tickSpacing(), 'pool tick spacing').to.eq(tickSpacing)
    
    }


  describe('#createPool', async function () {
    
    it('createPool should be succeeds for low fee pool', async function () {
      await createAndCheckPool(TEST_TOKEN_ADDRESSES, FeeAmount.LOW);
    })
  
    it('createPool should be succeeds for medium fee pool', async function () {
      await createAndCheckPool(TEST_TOKEN_ADDRESSES, FeeAmount.MEDIUM);
    })
  
    it('createPool should be succeeds for high fee pool', async function () {
      await createAndCheckPool(TEST_TOKEN_ADDRESSES, FeeAmount.HIGH);
    })
  
    it('createPool should fail if fee not enabled', async function () {
      await expect(factory.createPool(TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[1], 101)).to.be.reverted;
    })
  
    it('createPool should fail if token0 = token1', async function () {
      await expect(factory.createPool(TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[0], FeeAmount.MEDIUM)).to.be.reverted;
    })
  
    it('createPool should fail if token0 or token1 is 0', async function () {
      await expect(factory.createPool(TEST_TOKEN_ADDRESSES[0], constants.AddressZero, FeeAmount.MEDIUM)).to.be.reverted;
    })
  })

  describe('#setOwner', () => {
    it('fails if caller is not owner', async () => {
      await expect(factory.connect(other).setOwner(wallet.address)).to.be.reverted
    })

    it('updates owner', async () => {
      await factory.setOwner(other.address)
      expect(await factory.owner()).to.eq(other.address)
    })

    it('emits event', async () => {
      await expect(factory.setOwner(other.address))
        .to.emit(factory, 'OwnerChanged')
        .withArgs(wallet.address, other.address)
    })

    it('cannot be called by original owner', async () => {
      await factory.setOwner(other.address)
      await expect(factory.setOwner(wallet.address)).to.be.reverted
    })
  })

  describe('#enableFeeAmount', () => {
    it('fails if caller is not owner', async () => {
      await expect(factory.connect(other).enableFeeAmount(100, 2)).to.be.reverted
    })
    it('fails if fee is too great', async () => {
      await expect(factory.enableFeeAmount(1000000, 10)).to.be.reverted
    })
    it('fails if tick spacing is too small', async () => {
      await expect(factory.enableFeeAmount(500, 0)).to.be.reverted
    })
    it('fails if tick spacing is too large', async () => {
      await expect(factory.enableFeeAmount(500, 16834)).to.be.reverted
    })
    it('fails if already initialized', async () => {
      await factory.enableFeeAmount(100, 5)
      await expect(factory.enableFeeAmount(100, 10)).to.be.reverted
    })
    it('sets the fee amount in the mapping', async () => {
      await factory.enableFeeAmount(100, 5)
      expect(await factory.feeAmountTickSpacing(100)).to.eq(5)
    })
    it('emits an event', async () => {
      await expect(factory.enableFeeAmount(100, 5)).to.emit(factory, 'FeeAmountEnabled').withArgs(100, 5)
    })
    it('enables pool creation', async () => {
      await factory.enableFeeAmount(250, 15)
      await createAndCheckPool([TEST_TOKEN_ADDRESSES[0], TEST_TOKEN_ADDRESSES[1]], 250, 15)
    })
  })
})

