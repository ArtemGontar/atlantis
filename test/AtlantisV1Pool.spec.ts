import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { describe } from "mocha";

describe('AtlantisV1Pool', async () => {
  let wallet: Wallet, other: Wallet
  let Pool: any;
  let pool: any;
  
  before('create pool', async () => {
    Pool = await ethers.getContractFactory('AtlantisV1Pool');
    [wallet, other] = await (ethers as any).getSigners() 
  })

  beforeEach('create pool',async () => {
    pool = await Pool.deploy();
    await pool.deployed();
  })

  it('constructor initializes immutables', async () => {
    expect(await pool.factory()).to.eq(factory.address)
    expect(await pool.token0()).to.eq(token0.address)
    expect(await pool.token1()).to.eq(token1.address)
    expect(await pool.maxLiquidityPerTick()).to.eq(getMaxLiquidityPerTick(tickSpacing))
  })
})